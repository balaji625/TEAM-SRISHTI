/**
 * Footer — CarePath AI (Stage 5: polished)
 */
import { Link } from 'react-router-dom';
import { Heart, Shield, FileText, Users } from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' },
];

const ACCOUNT_LINKS = [
  { label: 'Log In', to: '/login' },
  { label: 'Register', to: '/register' },
];

const TRUST_ITEMS = [
  { icon: Shield, label: 'Role-Based Security' },
  { icon: FileText, label: 'Consent Management' },
  { icon: Users, label: 'Verified Network' },
];

const Footer = () => (
  <footer className="bg-gray-950 text-gray-400">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        {/* Brand col — spans 2 on lg */}
        <div className="sm:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-4" aria-label="CarePath AI home">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold text-white">
              CarePath <span className="text-blue-400">AI</span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm mb-5">
            An AI-powered healthcare access ecosystem connecting patients with verified
            hospitals, qualified professionals, and independent health experts.
          </p>
          {/* Trust badges */}
          <div className="flex flex-wrap gap-3">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">
                <Icon className="w-3 h-3 text-blue-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Platform links */}
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Platform</h3>
          <ul className="space-y-2.5 text-sm">
            {PLATFORM_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account links */}
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Account</h3>
          <ul className="space-y-2.5 text-sm">
            {ACCOUNT_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-xs text-gray-600 space-y-1.5">
            <p>For hospitals, professionals,</p>
            <p>and independent experts.</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <p>© {new Date().getFullYear()} CarePath AI. All rights reserved.</p>
        <p className="text-center sm:text-right">
          Not a substitute for professional medical advice. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Founder / Admin access — intentionally low-profile */}
      <div className="mt-4 text-center">
        <Link
          to="/admin/login"
          className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
          aria-label="Founder / Platform Admin Login"
        >
          Platform Admin ·{' '}
          <span className="underline underline-offset-2">Founder Access</span>
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
