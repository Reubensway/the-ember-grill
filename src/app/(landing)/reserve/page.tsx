'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, CalendarDays, Clock, Users, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { brand } from '@/lib/constants';
import Link from 'next/link';

const TIME_SLOTS = [
  { period: 'Lunch', slots: ['12:00', '12:30', '13:00', '13:30', '14:00'] },
  { period: 'Dinner', slots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] },
];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface ReservationConfirmation {
  reference: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber: number | null;
}

interface FormErrors {
  customerName?: string;
  phone?: string;
  date?: string;
  time?: string;
  partySize?: string;
}

export default function ReservePage() {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  function validateForm(): boolean {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!date) newErrors.date = 'Please select a date';
    if (!time) newErrors.time = 'Please select a time';
    if (!partySize || partySize < 1 || partySize > 12) newErrors.partySize = 'Please select party size';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setSuggestedTimes([]);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          date,
          time,
          partySize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestedTimes?.length > 0) {
          setApiError(data.error);
          setSuggestedTimes(data.suggestedTimes);
          toast.error('Time slot unavailable');
        } else {
          setApiError(data.error || 'Failed to create reservation');
          toast.error('Reservation failed');
        }
        return;
      }

      const reservation = data.reservation;
      setConfirmation({
        reference: reservation.reference,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        tableNumber: reservation.tableNumber,
      });
      toast.success('Reservation confirmed!');
    } catch {
      setApiError('Something went wrong. Please try again.');
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirmation view
  if (confirmation) {
    return (
      <section className="min-h-[calc(100vh-4.5rem)] bg-gradient-to-b from-charcoal to-charcoal-light flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mt-6 font-heading text-2xl font-bold text-charcoal">
                You&apos;re All Set!
              </h2>
              <p className="mt-2 text-charcoal-light/70">
                We look forward to welcoming you
              </p>
            </div>

            <div className="mt-8 space-y-4 rounded-2xl bg-cream p-5">
              <DetailRow label="Reference" value={confirmation.reference} />
              <DetailRow label="Date" value={formatDate(confirmation.date)} />
              <DetailRow label="Time" value={formatTime(confirmation.time)} />
              <DetailRow label="Guests" value={`${confirmation.partySize} ${confirmation.partySize === 1 ? 'guest' : 'guests'}`} />
              {confirmation.tableNumber && (
                <DetailRow label="Table" value={`Table ${confirmation.tableNumber}`} />
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-amber/20 bg-amber/5 p-4">
              <p className="text-center text-sm text-charcoal-light">
                A confirmation has been noted. Please arrive 5 minutes before your booking.
              </p>
            </div>

            <Button
              render={<Link href="/" />}
              className="mt-6 w-full rounded-2xl bg-charcoal py-6 text-white hover:bg-charcoal-light"
            >
              Back to Home
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  // Reservation form
  return (
    <section className="min-h-[calc(100vh-4.5rem)] bg-gradient-to-b from-charcoal via-charcoal to-charcoal-light">
      {/* Hero header */}
      <div className="relative overflow-hidden px-4 pb-12 pt-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(202,138,4,0.15)_0%,_transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <Flame className="mx-auto mb-4 h-10 w-10 text-amber" />
          <h1 className="font-heading text-4xl font-bold text-cream sm:text-5xl">
            Reserve a Table
          </h1>
          <p className="mt-3 text-cream/60">
            Join us at {brand.name} for an unforgettable dining experience
          </p>
        </motion.div>
      </div>

      {/* Form card */}
      <div className="mx-auto max-w-xl px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            {/* Party size selector */}
            <div className="mb-8">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Users className="h-4 w-4 text-amber" />
                Party Size
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PARTY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPartySize(size);
                      if (errors.partySize) setErrors((prev) => ({ ...prev, partySize: undefined }));
                    }}
                    className={cn(
                      'flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all',
                      partySize === size
                        ? 'bg-amber text-white shadow-md shadow-amber/30'
                        : 'bg-cream text-charcoal hover:bg-amber/10'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.partySize && <p className="mt-2 text-xs text-red-500">{errors.partySize}</p>}
            </div>

            {/* Date picker */}
            <div className="mb-6">
              <label htmlFor="date" className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <CalendarDays className="h-4 w-4 text-amber" />
                Date
              </label>
              <input
                id="date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border bg-cream/50 px-4 py-3.5 text-sm text-charcoal outline-none transition-all focus:border-amber focus:ring-2 focus:ring-amber/20',
                  errors.date ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.date && <p className="mt-2 text-xs text-red-500">{errors.date}</p>}
            </div>

            {/* Time slot selector */}
            <div className="mb-6">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Clock className="h-4 w-4 text-amber" />
                Time
              </label>
              {TIME_SLOTS.map((group) => (
                <div key={group.period} className="mb-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-charcoal-light/60">
                    {group.period}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setTime(slot);
                          if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                        }}
                        className={cn(
                          'rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                          time === slot
                            ? 'bg-amber text-white shadow-md shadow-amber/30'
                            : 'bg-cream text-charcoal hover:bg-amber/10'
                        )}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
            </div>

            {/* Contact details */}
            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="customerName" className="mb-2 block text-sm font-semibold text-charcoal">
                  Full Name
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: undefined }));
                  }}
                  placeholder="e.g. James Wilson"
                  className={cn(
                    'w-full rounded-xl border bg-cream/50 px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal-light/40 outline-none transition-all focus:border-amber focus:ring-2 focus:ring-amber/20',
                    errors.customerName ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-charcoal">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+44 7XXX XXX XXX"
                  className={cn(
                    'w-full rounded-xl border bg-cream/50 px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal-light/40 outline-none transition-all focus:border-amber focus:ring-2 focus:ring-amber/20',
                    errors.phone ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>

            {/* API Error with suggested times */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">{apiError}</p>
                    {suggestedTimes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-red-600">Try one of these instead:</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestedTimes.map((suggestedTime) => (
                            <button
                              key={suggestedTime}
                              type="button"
                              onClick={() => {
                                setTime(suggestedTime);
                                setApiError(null);
                                setSuggestedTimes([]);
                              }}
                              className="rounded-lg bg-amber/10 px-3 py-1.5 text-sm font-semibold text-amber transition-colors hover:bg-amber/20"
                            >
                              {formatTime(suggestedTime)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-amber py-6 text-base font-semibold text-white shadow-lg shadow-amber/25 hover:bg-amber-light disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reserving your table...
                </>
              ) : (
                'Confirm Reservation'
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-charcoal-light/50">
              Free cancellation up to 2 hours before your booking
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-charcoal-light/70">{label}</span>
      <span className="text-sm font-semibold text-charcoal">{value}</span>
    </div>
  );
}
