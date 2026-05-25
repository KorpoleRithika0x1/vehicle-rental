import { Facebook, Instagram, Linkedin, Send, Twitter } from 'lucide-react';

import { SUPPORT_LINKS } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr] lg:px-8">
        <div>
          <h3 className="font-heading text-3xl">Veloce Rentals</h3>
          <p className="mt-4 max-w-sm text-sm text-slate-200">
            Premium vehicle access with disciplined operations behind the scenes. Search, book, manage, and scale from one calm platform.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {[Facebook, Instagram, Twitter, Linkedin].map((Icon) => (
              <a key={Icon.displayName || Icon.name} href="#" className="rounded-full border border-white/20 p-2 text-slate-200 transition hover:border-gold hover:text-gold">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Corporate</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {SUPPORT_LINKS.corporate.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Rent A Car</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {SUPPORT_LINKS.rental.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Support</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {SUPPORT_LINKS.support.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <form className="mt-6 flex rounded-full bg-white/10 p-1">
            <input
              type="email"
              placeholder="Subscribe for updates"
              className="w-full rounded-full bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-300 focus:outline-none"
            />
            <button type="button" className="rounded-full bg-gold px-4 py-2 text-brand">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
