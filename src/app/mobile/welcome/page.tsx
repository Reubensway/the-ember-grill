'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function WelcomePage() {
  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Full-screen background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=900&fit=crop"
          alt="Delicious food"
          fill
          className="object-cover"
          sizes="375px"
          priority
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      </div>

      {/* Content on top of image */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top — brand name */}
        <div className="pt-8 px-6">
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            The Ember Grill
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom section — welcome text + buttons */}
        <div className="px-6 pb-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              Welcome to The Ember Grill 🎉
            </h2>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Your fastest way to order delicious wood-fired food — anytime, anywhere.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/mobile/signup"
              className="flex w-full items-center justify-center rounded-2xl bg-white py-4 text-sm font-bold text-gray-900 active:scale-[0.98] transition-transform"
            >
              Let&apos;s Start!
            </Link>
            <Link
              href="/mobile/login"
              className="flex w-full items-center justify-center rounded-2xl border-2 border-white/30 py-4 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
