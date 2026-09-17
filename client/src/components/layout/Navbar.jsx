/**
 * Navbar — CarePath AI (Stage 5: polished)
 * Responsive navigation with authenticated and unauthenticated states.
 * Uses AuthContext — no auth logic duplicated here.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' },
];

const ROLE_LABELS = {
  USER:         'Patient',
  HOSPITAL:     'Hospital',
  PROFESSIONAL: 'Professional',
  EXPERT:       'Expert',
  ADMIN:        'Administrator',
};

const ROLE_COLORS = {
  USER:         'bg-blue-600',
  HOSPITAL:     'bg-emerald-600',
  PROFESSIONAL: 'bg-indigo-600',
  EXPERT:       'bg-purple-600',
  ADMIN:        'bg-rose-600',
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, dashboardPath } = useAuth();
  const { pathname } = useLocation();
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="CarePath AI home">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors shrink-0">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold text-gray-900 leading-none">
              CarePath <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* ── Desktop nav links ─────────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop auth area ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              /* Authenticated: user menu dropdown */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-sm"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${ROLE_COLORS[user.role] || 'bg-blue-600'}`}>
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </p>
                      <p className="text-sm text-gray-800 font-medium truncate">{user.email}</p>
                    </div>
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated */
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ───────────────────────────────────────────── */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white" role="navigation" aria-label="Mobile navigation">
          <div className="px-4 pt-2 pb-3 space-y-0.5">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="px-4 pt-2 pb-4 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0 ${ROLE_COLORS[user.role] || 'bg-blue-600'}`}>
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 text-center hover:bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 text-center hover:bg-blue-700 transition-colors"
                >
                  Get Started — Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
