/**
 * DashboardLayout — shared wrapper for all role dashboards.
 * Sidebar slot + main content area.
 * Each role dashboard provides its own Sidebar via props.
 * Includes a mobile-friendly drawer sidebar.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

const DashboardLayout = ({ sidebar: Sidebar }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Desktop sidebar (lg+) ── */}
      {Sidebar && (
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <Sidebar />
        </aside>
      )}

      {/* ── Mobile sidebar drawer ── */}
      {Sidebar && mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden shadow-xl">
            <Sidebar />
          </aside>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        {Sidebar && (
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 lg:hidden sticky top-0 z-30">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-800">CarePath AI</span>
          </div>
        )}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
