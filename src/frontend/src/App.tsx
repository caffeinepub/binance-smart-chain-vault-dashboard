import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Web3Provider } from './hooks/useWeb3';
import { Dashboard } from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Signal that React has mounted successfully
    window.dispatchEvent(new CustomEvent('app-mounted'));
    
    // Set a flag for programmatic checks
    (window as any).__APP_MOUNTED__ = true;
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Web3Provider>
        <ErrorBoundary>
          <Dashboard />
          <Toaster />
        </ErrorBoundary>
      </Web3Provider>
    </ThemeProvider>
  );
}
