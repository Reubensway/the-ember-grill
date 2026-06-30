import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { brand } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        {/* Brand section */}
        <div className="mb-10 text-center lg:mb-0 lg:text-left">
          <h2 className="font-heading text-2xl font-bold text-cream">
            {brand.name}
          </h2>
          <p className="mt-2 text-sm text-cream/60">{brand.tagline}</p>
        </div>

        {/* Info grid */}
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Location */}
          <div className="flex items-start gap-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
            <div>
              <h3 className="text-sm font-semibold text-amber">Location</h3>
              <p className="mt-1.5 text-sm text-cream/70">{brand.location}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <div>
                  <h3 className="text-sm font-semibold text-amber">Phone</h3>
                  <p className="mt-1.5 text-sm text-cream/70">
                    <a
                      href={`tel:${brand.phone}`}
                      className="transition-colors hover:text-amber"
                    >
                      {brand.phone}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <div>
                  <h3 className="text-sm font-semibold text-amber">Email</h3>
                  <p className="mt-1.5 text-sm text-cream/70">
                    <a
                      href={`mailto:${brand.email}`}
                      className="transition-colors hover:text-amber"
                    >
                      {brand.email}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-start gap-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
            <div>
              <h3 className="text-sm font-semibold text-amber">
                Opening Hours
              </h3>
              <p className="mt-1.5 text-sm text-cream/70">{brand.hours}</p>
            </div>
          </div>
        </div>

        {/* Legal links & Copyright */}
        <div className="mt-14 border-t border-cream/10 pt-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap justify-center gap-6">
              <a href="/privacy-policy" className="text-xs text-cream/50 transition-colors hover:text-amber">
                Privacy Policy
              </a>
              <a href="/terms-and-conditions" className="text-xs text-cream/50 transition-colors hover:text-amber">
                Terms & Conditions
              </a>
              <a href="/eula" className="text-xs text-cream/50 transition-colors hover:text-amber">
                End User License Agreement
              </a>
            </div>
            <p className="text-xs text-cream/50">
              &copy; {currentYear} {brand.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
