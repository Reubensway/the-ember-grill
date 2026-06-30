'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Loader2,
  ShoppingCart,
  ArrowLeft,
  MapPin,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { processPayment } from '@/lib/mock-payment';
import { formatPrice } from '@/lib/utils';
import { showMobileToast } from '@/hooks/use-mobile-toast';
import type { OrderType } from '@/types';

export default function MobileCheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPostcode, setDeliveryPostcode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [savedAddress, setSavedAddress] = useState('');
  const [savedPostcode, setSavedPostcode] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Pre-fill from session profile (set during signup)
  useEffect(() => {
    const stored = sessionStorage.getItem('user_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        if (profile.name) setCustomerName(profile.name);
        if (profile.email) setCustomerEmail(profile.email);
        if (profile.phone) setCustomerPhone(profile.phone);
        if (profile.address) {
          setSavedAddress(profile.address);
          setDeliveryAddress(profile.address);
        }
        if (profile.postcode) {
          setSavedPostcode(profile.postcode);
          setDeliveryPostcode(profile.postcode);
        }
      } catch { /* ignore parse errors */ }
    }
  }, []);

  // Payment
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loyalty
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [availableRewards, setAvailableRewards] = useState<{ id: string; name: string; pointsRequired: number; discountValue: number }[]>([]);
  const [appliedReward, setAppliedReward] = useState<{ id: string; name: string; discountValue: number } | null>(null);

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: string; value: number; discountAmount: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return;
    setDiscountError(null);
    setIsApplyingDiscount(true);
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), orderTotal: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({ code: data.code, type: data.type, value: data.value, discountAmount: data.discountAmount });
        setDiscountCode('');
      } else {
        setDiscountError(data.error || 'Invalid code');
      }
    } catch {
      setDiscountError('Failed to validate code');
    } finally {
      setIsApplyingDiscount(false);
    }
  }

  // Fetch loyalty points and rewards
  useEffect(() => {
    async function fetchLoyalty() {
      if (!customerEmail) return;
      try {
        const [pointsRes, rewardsRes] = await Promise.all([
          fetch(`/api/loyalty/points?email=${encodeURIComponent(customerEmail)}`),
          fetch('/api/loyalty/rewards'),
        ]);
        if (pointsRes.ok) {
          const data = await pointsRes.json();
          setLoyaltyPoints(data.points || 0);
        }
        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          setAvailableRewards(data.rewards || []);
        }
      } catch { /* ignore */ }
    }
    fetchLoyalty();
  }, [customerEmail]);

  const deliveryFee = orderType === 'delivery' ? 2.99 : 0;
  const loyaltyDiscount = appliedReward ? appliedReward.discountValue : 0;
  const codeDiscount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const total = Math.max(0, totalPrice + deliveryFee - loyaltyDiscount - codeDiscount);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 bg-white min-h-full">
        <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
          <ShoppingCart className="h-9 w-9 text-gray-300" />
        </div>
        <p className="text-base font-semibold text-gray-900">Your cart is empty</p>
        <p className="text-xs text-gray-400 text-center">Add items to proceed to checkout</p>
        <Link
          href="/mobile"
          className="mt-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (customerPhone.trim()) {
      const cleaned = customerPhone.replace(/\s/g, '');
      const isValidUK = /^(\+44|0)(7\d{9}|1\d{9}|2\d{9}|3\d{9}|8\d{9})$/.test(cleaned);
      if (!isValidUK) {
        setError('Please enter a valid UK phone number (e.g. +447XXXXXXXXX).');
        return;
      }
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (!cardNumber.trim() || !expiryDate.trim() || !cvc.trim()) {
      setError('Please fill in all payment fields.');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentResult = await processPayment({
        amount: total,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvc,
      });

      if (!paymentResult.success) {
        setError(paymentResult.message);
        setIsProcessing(false);
        return;
      }

      // Redeem loyalty reward if applied
      if (appliedReward && customerEmail) {
        await fetch('/api/loyalty/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: customerEmail.trim(),
            rewardId: appliedReward.id,
          }),
        });
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          orderType,
          deliveryAddress:
            orderType === 'delivery'
              ? `${deliveryAddress.trim()}, ${deliveryPostcode.trim()}`
              : undefined,
          discountAmount: loyaltyDiscount + codeDiscount,
          discountCode: appliedDiscount?.code || undefined,
          items: items.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        setError(errData.error || 'Failed to create order.');
        setIsProcessing(false);
        return;
      }

      const { order } = await orderResponse.json();
      clearCart();
      showMobileToast('Order placed successfully!');
      router.push(
        `/mobile/checkout/confirmation?orderNumber=${order.orderNumber}&orderType=${orderType}`
      );
    } catch {
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 mt-3">

        {/* Order Type Toggle */}
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fulfilment</p>
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                orderType === 'pickup'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Pickup
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                orderType === 'delivery'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Truck className="h-4 w-4" />
              Delivery
            </button>
          </div>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>Delivery address</span>
              </div>

              {/* Saved address option */}
              {savedAddress && !useNewAddress && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryAddress(savedAddress);
                      setDeliveryPostcode(savedPostcode);
                      setUseNewAddress(false);
                    }}
                    className="w-full rounded-xl border border-gray-900 bg-gray-900 px-4 py-3 text-left text-sm text-white"
                  >
                    <p className="font-medium">{savedAddress}</p>
                    {savedPostcode && <p className="text-xs text-gray-300 mt-0.5">{savedPostcode}</p>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseNewAddress(true);
                      setDeliveryAddress('');
                      setDeliveryPostcode('');
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-600"
                  >
                    <p className="font-medium">Enter a different address</p>
                  </button>
                </>
              )}

              {/* New address inputs */}
              {(!savedAddress || useNewAddress) && (
                <>
                  {savedAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseNewAddress(false);
                        setDeliveryAddress(savedAddress);
                        setDeliveryPostcode(savedPostcode);
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-600"
                    >
                      <p className="font-medium">Use saved address</p>
                      <p className="text-xs text-gray-400 mt-0.5">{savedAddress}</p>
                    </button>
                  )}
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={deliveryPostcode}
                    onChange={(e) => setDeliveryPostcode(e.target.value)}
                    placeholder="Postcode"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white"
                  />
                </>
              )}
            </div>
          )}

          {/* Pickup info */}
          {orderType === 'pickup' && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">Ready in 15-20 minutes</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Collect from the counter</p>
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</p>
          <div className="space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white"
            />
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+44 7XXX XXX XXX"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Summary</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.menuItem.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.menuItem.image && (
                    <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" sizes="40px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.menuItem.name}</p>
                  <p className="text-xs text-gray-400">x{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.menuItem.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-gray-900">£2.99</span>
              </div>
            )}
            {appliedReward && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Loyalty: {appliedReward.name}</span>
                <span className="text-green-600">-{formatPrice(appliedReward.discountValue)}</span>
              </div>
            )}
            {appliedDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Code: {appliedDiscount.code}</span>
                <span className="text-green-600">-{formatPrice(appliedDiscount.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Rewards */}
        {customerEmail && loyaltyPoints > 0 && availableRewards.length > 0 && (
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loyalty Rewards</p>
              <span className="text-xs font-bold text-amber">{loyaltyPoints} pts</span>
            </div>
            <div className="space-y-2">
              {availableRewards.map((reward) => {
                const canAfford = loyaltyPoints >= reward.pointsRequired;
                const isApplied = appliedReward?.id === reward.id;
                return (
                  <button
                    key={reward.id}
                    type="button"
                    disabled={!canAfford && !isApplied}
                    onClick={() => {
                      if (isApplied) {
                        setAppliedReward(null);
                      } else if (canAfford) {
                        setAppliedReward({ id: reward.id, name: reward.name, discountValue: reward.discountValue });
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      isApplied
                        ? 'border-amber bg-amber/5 ring-1 ring-amber/30'
                        : canAfford
                          ? 'border-gray-200 bg-gray-50 hover:border-amber/50'
                          : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isApplied ? 'text-amber' : 'text-gray-900'}`}>{reward.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{reward.pointsRequired} points · saves £{reward.discountValue.toFixed(2)}</p>
                      </div>
                      {isApplied && (
                        <span className="text-xs font-semibold text-amber">Applied ✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Discount Code */}
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Discount Code</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white font-mono"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={!discountCode.trim() || isApplyingDiscount}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isApplyingDiscount ? '...' : 'Apply'}
            </button>
          </div>
          {appliedDiscount && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="text-xs font-medium text-green-700">
                {appliedDiscount.code}: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% off` : `£${appliedDiscount.value} off`}
              </span>
              <button
                type="button"
                onClick={() => setAppliedDiscount(null)}
                className="text-xs text-red-500 font-medium"
              >
                Remove
              </button>
            </div>
          )}
          {discountError && (
            <p className="mt-2 text-xs text-red-500">{discountError}</p>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</p>
            <Lock className="h-3 w-3 text-green-500 ml-auto" />
            <span className="text-[10px] text-green-600">Secure</span>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                setCardNumber(formatted);
              }}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (raw.length >= 3) {
                    setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2)}`);
                  } else {
                    setExpiryDate(raw);
                  }
                }}
                placeholder="MM/YY"
                maxLength={5}
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white font-mono"
              />
              <input
                type="text"
                value={cvc}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCvc(raw);
                }}
                placeholder="CVC"
                maxLength={4}
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white font-mono"
              />
            </div>
          </div>
          
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Sticky pay button */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay {formatPrice(total)}</>
          )}
        </button>
      </div>
    </div>
  );
}
