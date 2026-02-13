import { Heart } from 'lucide-react';
import { getBuildVersion } from '@/lib/buildInfo';

export default function Footer() {
  const buildVersion = getBuildVersion();
  
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p className="flex items-center justify-center gap-1 flex-wrap">
            © {new Date().getFullYear()}. Built with{' '}
            <Heart className="h-4 w-4 text-destructive fill-destructive inline" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'bsc-vault-dashboard'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs">
            powered by @JDtech
          </p>
          <p className="text-xs opacity-50">
            {buildVersion}
          </p>
        </div>
      </div>
    </footer>
  );
}
