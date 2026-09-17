/**
 * App.jsx — root component
 * Wraps the application with providers and the router.
 */
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AppRouter from './routes/AppRouter';

const App = () => (
  <LanguageProvider>
  <AuthProvider>
    {/* Toast notifications — available to all components via useToast hook */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
          fontSize: '14px',
        },
      }}
    />
    <AppRouter />
  </AuthProvider>
  </LanguageProvider>
);

export default App;
