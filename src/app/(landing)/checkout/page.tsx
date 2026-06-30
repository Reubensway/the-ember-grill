'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Minus,
  Plus,
  Trash2,
  Tag,
  Loader2,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { processPayment } from '@/lib/mock-payment';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { OrderType } from '@/types';

interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

const ORDER_TYPE_OPTIONS: {
  value: OrderType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'dine-in',
    label: 'Dine In',
    description: 'Eat at the restaurant',
    icon: UtensilsCrossed,
  },
  {
    value: 'pickup',
    label: 'Pickup',
    description: 'Collect your order',
    icon: ShoppingBag,
  },
  {
    value: 'delivery',
    label: 'Delivery',
    description: 'Delivered to your door',
    icon: Truck,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  // Order type
  const [orderType, setOrderType] = useState<OrderType | null>(null);

  // Dine-in fields
  const [tableNumber, setTableNumber] = useState('');

  // Delivery fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Special instructions
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  // Payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-cream py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-charcoal-light/40" />
            <h1 className="mb-4 font-heading text-3xl font-bold text-charcoal">
              Your cart is empty
            </h1>
            <p className="mb-8 text-charcoal-light">
              Add some delicious items from our menu to get started.
            </p>
            <Button
              render={<Link href="/menu" />}
              className="bg-amber text-white hover:bg-amber-light"
            >
              Browse Menu
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  const subtotal = totalPrice;
  const discountAmount = discountInfo?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return;

    setIsValidatingDiscount(true);
    setDiscountError(null);
    setDiscountInfo(null);

    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim().toUpperCase(),
          orderTotal: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setDiscountError(data.error || 'Invalid discount code');
      } else {
        setDiscountInfo({
          code: data.code,
          type: data.type,
          value: data.value,
          discountAmount: data.discountAmount,
        });
      }
    } catch {
      setDiscountError('Failed to validate code. Please try again.');
    } finally {
      setIsValidatingDiscount(false);
    }
  }

  function handleRemoveDiscount() {
    setDiscountInfo(null);
    setDiscountCode('');
    setDiscountError(null);
  }

  async function handlePayNow() {
    setPaymentError(null);

    // Validate required checkout fields
    if (!orderType) {
      setPaymentError('Please select an order type.');
      return;
    }
    if (!customerName.trim()) {
      setPaymentError('Please enter your name.');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      setPaymentError('Please enter your table number.');
      return;
    }
    if (orderType === 'delivery' && (!street.trim() || !city.trim() || !postcode.trim())) {
      setPaymentError('Please fill in your full delivery address.');
      return;
    }
    if (!cardNumber.trim() || !expiryDate.trim() || !cvc.trim()) {
      setPaymentError('Please fill in all payment card fields.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Process payment
      const paymentResult = await processPayment({
        amount: finalTotal,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvc,
      });

      if (!paymentResult.success) {
        setPaymentError(paymentResult.message);
        setIsProcessingPayment(false);
        return;
      }

      // Create order via API
      const deliveryAddress =
        orderType === 'delivery'
          ? `${street}, ${city}, ${postcode}`
          : undefined;

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          orderType,
          tableNumber: orderType === 'dine-in' ? parseInt(tableNumber, 10) : undefined,
          deliveryAddress,
          items: items.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
          })),
          specialInstructions: specialInstructions.trim() || undefined,
          discountCode: discountInfo?.code || undefined,
          discountAmount: discountInfo?.discountAmount || undefined,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        setPaymentError(errorData.error || 'Failed to create order. Please try again.');
        setIsProcessingPayment(false);
        return;
      }

      const { order } = await orderResponse.json();

      // Clear cart and redirect to confirmation
      clearCart();
      router.push(`/checkout/confirmation?orderNumber=${order.orderNumber}&orderType=${orderType}`);
    } catch {
      setPaymentError('Something went wrong. Please try again.');
      setIsProcessingPayment(false);
    }
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-cream py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-8 font-heading text-4xl font-bold text-charcoal">
            Checkout
          </h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column - Form sections */}
            <div className="space-y-6 lg:col-span-2">
              {/* Order Summary */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl text-charcoal">
                    Order Summary
                  </CardTitle>
                  <CardDescription>
                    {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-charcoal truncate">
                          {item.menuItem.name}
                        </p>
                        <p className="text-sm text-charcoal-light">
                          {formatPrice(item.menuItem.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.menuItem.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-charcoal-light hover:border-amber hover:text-amber transition-colors"
                          aria-label={`Decrease quantity of ${item.menuItem.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.menuItem.id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-charcoal-light hover:border-amber hover:text-amber transition-colors"
                          aria-label={`Increase quantity of ${item.menuItem.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.menuItem.id)}
                          className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label={`Remove ${item.menuItem.name} from cart`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="w-16 text-right text-sm font-semibold text-charcoal">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Order Type Selection */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl text-charcoal">
                    Order Type
                  </CardTitle>
                  <CardDescription>
                    How would you like to receive your order?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {ORDER_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = orderType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setOrderType(option.value)}
                          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-amber bg-amber/5 shadow-sm'
                              : 'border-gray-200 hover:border-amber/50'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              isSelected ? 'text-amber' : 'text-charcoal-light'
                            }`}
                          />
                          <span
                            className={`text-sm font-semibold ${
                              isSelected ? 'text-amber' : 'text-charcoal'
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-charcoal-light">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Conditional fields based on order type */}
                  {orderType === 'dine-in' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-2"
                    >
                      <Label htmlFor="tableNumber" className="text-charcoal">
                        Table Number
                      </Label>
                      <Input
                        id="tableNumber"
                        type="number"
                        min={1}
                        max={12}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Enter your table number (1-12)"
                      />
                    </motion.div>
                  )}

                  {orderType === 'pickup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <div className="rounded-lg bg-amber/5 border border-amber/20 p-4">
                        <p className="text-sm font-medium text-charcoal">
                          Estimated pickup time
                        </p>
                        <p className="text-lg font-semibold text-amber">
                          15–20 minutes
                        </p>
                        <p className="mt-1 text-xs text-charcoal-light">
                          We&apos;ll have your order ready for collection at the counter.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {orderType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="street" className="text-charcoal">
                          Street Address
                        </Label>
                        <Input
                          id="street"
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="123 High Street"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-charcoal">
                            City
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="London"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postcode" className="text-charcoal">
                            Postcode
                          </Label>
                          <Input
                            id="postcode"
                            type="text"
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            placeholder="E1 6AN"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Details */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl text-charcoal">
                    Your Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-charcoal">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-charcoal">
                        Email <span className="text-charcoal-light text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="text-charcoal">
                        Phone <span className="text-charcoal-light text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+44 20 7946 0958"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl text-charcoal">
                    Special Instructions
                  </CardTitle>
                  <CardDescription>
                    Any allergies, dietary requirements, or special requests?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="specialInstructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. No nuts, extra spicy, birthday celebration..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right column - Totals & Payment */}
            <div className="space-y-6">
              {/* Discount Code */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-lg text-charcoal">
                    <Tag className="h-4 w-4" />
                    Discount Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {discountInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            {discountInfo.code}
                          </p>
                          <p className="text-xs text-green-600">
                            {discountInfo.type === 'percentage'
                              ? `${discountInfo.value}% off`
                              : `${formatPrice(discountInfo.value)} off`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value);
                          if (discountError) setDiscountError(null);
                        }}
                        placeholder="Enter code"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={isValidatingDiscount || !discountCode.trim()}
                        variant="outline"
                        className="border-amber text-amber hover:bg-amber hover:text-white"
                      >
                        {isValidatingDiscount ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="mt-2 text-xs text-red-600">{discountError}</p>
                  )}
                </CardContent>
              </Card>

              {/* Order Total */}
              <Card className="bg-white shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-charcoal">
                    Order Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal-light">Subtotal</span>
                    <span className="font-medium text-charcoal">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {discountInfo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-charcoal">
                      Total
                    </span>
                    <span className="text-lg font-bold text-amber">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  {/* Payment Form */}
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-5 w-5 text-charcoal" />
                      <span className="text-sm font-semibold text-charcoal">
                        Card Payment
                      </span>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cardNumber" className="text-xs text-charcoal-light">
                          Card Number
                        </Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="bg-white"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="expiryDate" className="text-xs text-charcoal-light">
                            Expiry Date
                          </Label>
                          <Input
                            id="expiryDate"
                            type="text"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            placeholder="MM/YY"
                            className="bg-white"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cvc" className="text-xs text-charcoal-light">
                            CVC
                          </Label>
                          <Input
                            id="cvc"
                            type="text"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            placeholder="123"
                            className="bg-white"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>

                    {paymentError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        {paymentError}
                      </p>
                    )}

                    <Button
                      type="button"
                      onClick={handlePayNow}
                      disabled={isProcessingPayment}
                      className="w-full bg-amber text-white hover:bg-amber-light font-semibold"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Pay Now — {formatPrice(finalTotal)}</>
                      )}
                    </Button>

                    <p className="text-xs text-center text-charcoal-light/60">
                      This is a demo. No real payment will be processed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
