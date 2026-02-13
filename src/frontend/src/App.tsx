import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Web3Provider } from './hooks/useWeb3';
import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
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
