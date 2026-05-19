import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white border-t-2 border-brand-gold pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-brand-coral rounded-lg text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Want-A-<span className="text-brand-teal">Bai</span>
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              India's premium marketplace for verified and trustworthy domestic help, housekeepers, and cooks. Building trust, one household at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-brand-gold text-sm tracking-wider uppercase mb-4">Discover</h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li><Link to="/discovery" className="hover:text-brand-teal transition-colors">Find Domestic Helpers</Link></li>
              <li><Link to="/discovery?serviceId=house-cleaning" className="hover:text-brand-teal transition-colors">House Cleaners</Link></li>
              <li><Link to="/discovery?serviceId=cooking" className="hover:text-brand-teal transition-colors">Home Cooks</Link></li>
              <li><Link to="/discovery?serviceId=baby-sitting" className="hover:text-brand-teal transition-colors">Babysitters</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-display font-semibold text-brand-gold text-sm tracking-wider uppercase mb-4">Support</h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li><Link to="/faq" className="hover:text-brand-teal transition-colors">Frequently Asked Questions</Link></li>
              <li><a href="/robots.txt" className="hover:text-brand-teal transition-colors" target="_blank">Search Directory</a></li>
              <li><a href="/sitemap.xml" className="hover:text-brand-teal transition-colors" target="_blank">Sitemap</a></li>
              <li><a href="#" className="hover:text-brand-teal transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-brand-gold text-sm tracking-wider uppercase mb-4">Connect</h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>Email: support@wantabai.com</li>
              <li>Phone: +91 1800-BAI-HELP</li>
              <li>Support Hours: 9 AM - 6 PM (IST)</li>
              <li className="text-[10px] text-white/50 mt-4 leading-normal">
                Verifying WAB-IDs on arrival is mandatory for household safety.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/60">
          <p>&copy; {new Date().getFullYear()} Want-A-Bai. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            Made with <Heart className="w-3.5 h-3.5 text-brand-coral fill-brand-coral" /> for Indian households.
          </p>
        </div>
      </div>
    </footer>
  );
}
