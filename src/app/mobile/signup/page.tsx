'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Flame, ArrowLeft } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

// UK phone number validation: +44 or 0 followed by valid formats
function isValidUKPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  // Matches: +447XXXXXXXXX, 07XXXXXXXXX, +441XXXXXXXXX, +442XXXXXXXXX, 01XXXXXXXXX, 02XXXXXXXXX
  return /^(\+44|0)(7\d{9}|1\d{9}|2\d{9}|3\d{9}|8\d{9})$/.test(cleaned);
}

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      showMobileToast('Please fill in all required fields');
      return;
    }

    if (!isValidUKPhone(form.phone)) {
      showMobileToast('Please enter a valid UK phone number');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showMobileToast('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      showMobileToast('Password must be at least 6 characters');
      return;
    }

    // Store signup data in sessionStorage so profile page can use it
    sessionStorage.setItem('user_profile', JSON.stringify({
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      phone: form.phone,
      address: '',
      postcode: '',
    }));

    showMobileToast('Account created!');
    router.push(`/mobile/verify?email=${encodeURIComponent(form.email)}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Back button + Logo */}
      <div className="px-6 pt-4">
        <button
          onClick={() => router.push('/mobile/welcome')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 mb-2"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Logo centered */}
      <div className="flex justify-center pb-4 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber/10">
          <Flame className="h-7 w-7 text-amber" />
        </div>
      </div>

      {/* Scrollable form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
            />
          </div>

          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-800">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-800">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              placeholder="+44 7XXX XXX XXX"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
            />
           
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Password <span className="text-red-500">*</span></label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative mt-2">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-amber mt-0.5"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I read and agreed to the{' '}
              <span className="font-semibold text-amber">User Agreement</span> and{' '}
              <span className="font-semibold text-amber">privacy policy</span>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-amber py-4 text-sm font-bold text-white shadow-sm shadow-amber/20 active:scale-[0.98] transition-transform"
          >
            Register
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 pb-4">
            Already have an account?{' '}
            <Link href="/mobile/login" className="font-semibold text-amber">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
