/**
 * ConnectivityBanner — CarePath AI
 *
 * Detects low/no network connectivity and shows a non-blocking banner.
 * Disappears automatically when connection is restored.
 * Does NOT store health data in browser storage.
 */

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const ConnectivityBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(t);
    };
    const handleOffline = () => {
      setOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && !showRestored) return null;

  if (showRestored) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700 animate-pulse">
        <Wifi className="w-4 h-4 shrink-0" />
        Connection restored. Syncing data…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
      <WifiOff className="w-4 h-4 shrink-0" />
      <div>
        <strong>Limited Connectivity Mode</strong> — Some features may be unavailable.
        Previously loaded information may still be accessible.
        Non-critical requests will be sent when connection is restored.
      </div>
    </div>
  );
};

export default ConnectivityBanner;
