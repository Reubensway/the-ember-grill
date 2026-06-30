'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Flame, ArrowLeft } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'demo@theembergrill.co.uk' && password === 'demo2025') {
      showMobileToast('Logged in!');
      sessionStorage.setItem('mobile_authenticated', 'true');
      router.push('/mobile');
    } else {
      showMobileToast('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/mobile/welcome')}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 mb-4"
      >
        <ArrowLeft className="h-4 w-4 text-gray-700" />
      </button>

      {/* Logo centered */}
      <div className="flex justify-center pt-6 pb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/10">
          <Flame className="h-8 w-8 text-amber" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/10 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-800">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Forgot password — right aligned */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-amber"
              />
              <span className="text-xs text-gray-500">Remember me</span>
            </label>
            <button type="button" onClick={() => router.push('/mobile/forgot-password')} className="text-xs font-semibold text-amber">
              Forgot Password
            </button>
          </div>
        </div>

        {/* Submit + link */}
        <div className="mt-auto pb-4 space-y-5">
          <button
            type="submit"
            className="w-full rounded-2xl bg-amber py-4 text-sm font-bold text-white shadow-sm shadow-amber/20 active:scale-[0.98] transition-transform"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/mobile/signup" className="font-semibold text-amber">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
