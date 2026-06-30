'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showMobileToast('Please enter your email');
      return;
    }
    showMobileToast('Reset link sent to your email!');
    router.push('/mobile/login');
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 px-6 py-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm mb-8"
      >
        <ArrowLeft className="h-4 w-4 text-gray-700" />
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Please enter your email address to receive a password reset link.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div>
          <label className="text-sm font-semibold text-gray-800">Email Address</label>
          <div className="relative mt-2">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white active:scale-[0.98] transition-transform mt-8"
        >
          Send Reset Link
        </button>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => router.push('/mobile/login')}
            className="font-semibold text-amber"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
