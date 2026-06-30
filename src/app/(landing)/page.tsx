'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, UtensilsCrossed, Clock, MapPin } from 'lucide-react';
import { brand } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden">
        {/* Background gradient */}
        {/* Background cover image */}
        <div className="absolute inset-0">
          <img
            src="/images/image.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Decorative ember glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(202,138,4,0.12)_0%,_transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Flame className="mx-auto mb-8 h-16 w-16 text-amber" />
          </motion.div>

          <motion.h1
            className="font-heading text-5xl font-bold tracking-tight text-cream sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            {brand.name}
          </motion.h1>

          <motion.p
            className="mt-6 text-xl text-cream/70 sm:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            {brand.tagline}
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          >
            <Button
              render={<Link href="/dine-in/1" />}
              size="lg"
              className="rounded-2xl bg-amber px-10 py-3.5 text-lg font-semibold text-white shadow-none hover:bg-amber-light"
            >
              Order Dine-In
            </Button>
            <Button
              render={<Link href="/reserve" />}
              size="lg"
              className="rounded-2xl border-2 border-cream/30 bg-transparent px-10 py-3.5 text-lg font-semibold text-cream shadow-none hover:bg-cream/5 hover:text-cream"
            >
              Reserve a Table
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-cream py-24">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
              Welcome to {brand.name}
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-charcoal-light/80">
              Nestled in the heart of Shoreditch, The Ember Grill brings together
              the finest modern British cuisine with the primal flavour of
              wood-fired cooking. Our chefs source seasonal ingredients from local
              suppliers, transforming them over open flames into dishes that
              celebrate simplicity and bold taste.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-charcoal-light/80">
              Whether you&apos;re joining us for a relaxed lunch, an intimate dinner,
              or ordering from the comfort of home, every plate carries the warmth
              and character of the ember.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Highlights Section */}
      <section className="bg-cream-dark py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
          <motion.h2
            className="text-center font-heading text-3xl font-bold text-charcoal sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            Why Dine With Us
          </motion.h2>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              className="rounded-3xl border border-charcoal/5 bg-white/70 backdrop-blur-sm p-10 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Flame className="mx-auto h-10 w-10 text-amber" />
              <h3 className="mt-5 font-heading text-xl font-semibold text-charcoal">
                Wood-Fired Cooking
              </h3>
              <p className="mt-3 text-charcoal-light/80">
                Every dish kissed by flame, cooked over sustainably sourced
                British hardwood for unmatched depth of flavour.
              </p>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-charcoal/5 bg-white/70 backdrop-blur-sm p-10 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <UtensilsCrossed className="mx-auto h-10 w-10 text-amber" />
              <h3 className="mt-5 font-heading text-xl font-semibold text-charcoal">
                Seasonal Menus
              </h3>
              <p className="mt-3 text-charcoal-light/80">
                Our menu evolves with the seasons, showcasing the best of British
                produce from trusted local suppliers.
              </p>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-charcoal/5 bg-white/70 backdrop-blur-sm p-10 text-center sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Clock className="mx-auto h-10 w-10 text-amber" />
              <h3 className="mt-5 font-heading text-xl font-semibold text-charcoal">
                Order Your Way
              </h3>
              <p className="mt-3 text-charcoal-light/80">
                Dine in, pick up, or get it delivered. Scan a QR code at your
                table or order online — it&apos;s all at your fingertips.
              </p>
            </motion.div>
          </div>

          {/* Location callout */}
          <motion.div
            className="mt-20 flex items-center justify-center gap-3 text-center text-charcoal-light/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <MapPin className="h-5 w-5 text-amber" />
            <span>{brand.location}</span>
          </motion.div>
        </div>
      </section>
    </>
  );
}
