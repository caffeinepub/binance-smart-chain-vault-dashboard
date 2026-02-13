import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Web3Provider } from '@/hooks/useWeb3';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dashboard } from '@/pages/Dashboard';
import { useEffect, useRef } from 'react';

function App() {
  const mountedRef = useRef(false);

  useEffect(() => {
    // Dispatch app-mounted event only once
    if (!mountedRef.current) {
      mountedRef.current = true;
      
      // Small delay to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('app-mounted'));
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Web3Provider>
          <Dashboard />
          <Toaster />
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
