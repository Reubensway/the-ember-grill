'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerify() {
    const code = otp.join('');
    if (code.length < 4) {
      showMobileToast('Please enter the full code');
      return;
    }
    // Valid OTP codes for demo
    const validCodes = ['0000', '1234', '5569'];
    if (!validCodes.includes(code)) {
      showMobileToast('Incorrect OTP code');
      return;
    }
    sessionStorage.setItem('mobile_authenticated', 'true');
    showMobileToast('Email verified!');
    router.push('/mobile');
  }

  // Mask email for display
  function maskEmail(email: string) {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const masked = user.slice(0, 2) + '***';
    return `${masked}@${domain}`;
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
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Please enter the 4-digit code we just sent to{' '}
          <span className="font-semibold text-gray-700">{maskEmail(email)}</span>
        </p>
      </div>

      {/* OTP inputs */}
      <div className="flex justify-center gap-4 mb-10">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`h-16 w-16 rounded-2xl border-2 bg-white text-center text-2xl font-bold text-gray-900 outline-none transition-colors ${
              digit ? 'border-amber' : 'border-gray-200 focus:border-amber'
            }`}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white active:scale-[0.98] transition-transform"
      >
        Verify
      </button>

      {/* Resend */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Didn&apos;t receive the code?{' '}
        <button
          onClick={() => showMobileToast('Code resent!')}
          className="font-semibold text-amber"
        >
          Resend
        </button>
      </p>
    </div>
  );
}
