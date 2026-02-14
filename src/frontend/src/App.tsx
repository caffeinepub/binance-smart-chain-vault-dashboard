import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Web3Provider } from '@/hooks/useWeb3';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { Dashboard } from '@/pages/Dashboard';
import Footer from '@/components/Footer';
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
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Dashboard />
            </main>
            <Footer />
          </div>
          <Toaster />
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
