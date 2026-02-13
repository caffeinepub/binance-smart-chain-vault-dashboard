import { Heart } from 'lucide-react';
import { getBuildVersion, getDeployedBuildId } from '@/lib/buildInfo';
import { APP_BRANDING } from '@/lib/appBranding';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : APP_BRANDING.identifier
  );
  const caffeineUrl = `https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`;
  const buildVersion = getBuildVersion();
  const buildId = getDeployedBuildId();

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span>© {currentYear} {APP_BRANDING.fullName}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-xs opacity-70">
              {buildVersion} ({buildId})
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> using{' '}
              <a
                href={caffeineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>by @JDtech</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
