import { useState } from 'react';
import { Copy, Check, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBuildVersion, getDeployedBuildId } from '@/lib/buildInfo';
import { getPerformanceCheckData, formatPerformanceCheckText } from '@/lib/performanceCheck';
import { APP_BRANDING } from '@/lib/appBranding';
import { toast } from 'sonner';

interface DiagnosticsBarProps {
  chainId: number | null;
  isMobile: boolean;
  hasMetaMask: boolean;
}

export function DiagnosticsBar({ chainId, isMobile, hasMetaMask }: DiagnosticsBarProps) {
  const [copied, setCopied] = useState(false);
  const [perfCopied, setPerfCopied] = useState(false);
  const buildVersion = getBuildVersion();
  const buildId = getDeployedBuildId();
  const perfData = getPerformanceCheckData();

  const copyDiagnostics = async () => {
    try {
      const diagnostics = {
        appName: APP_BRANDING.fullName,
        buildId,
        buildVersion,
        url: window.location.href,
        hostname: window.location.hostname,
        hasEthereumProvider: !!window.ethereum,
        isMobile,
        chainId: chainId || 'not connected',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      const text = `${APP_BRANDING.fullName} Diagnostics
Build ID: ${diagnostics.buildId}
Build Version: ${diagnostics.buildVersion}
URL: ${diagnostics.url}
Hostname: ${diagnostics.hostname}
EVM Provider: ${diagnostics.hasEthereumProvider ? 'Detected' : 'Not detected'}
Mobile: ${diagnostics.isMobile ? 'Yes' : 'No'}
Chain ID: ${diagnostics.chainId}
User Agent: ${diagnostics.userAgent}
Timestamp: ${diagnostics.timestamp}`;

      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Diagnostics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy diagnostics');
      console.error('Copy failed:', err);
    }
  };

  const copyPerformanceCheck = async () => {
    try {
      const text = formatPerformanceCheckText(perfData);
      await navigator.clipboard.writeText(text);
      setPerfCopied(true);
      toast.success('Performance check copied to clipboard');
      setTimeout(() => setPerfCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy performance check');
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>{buildVersion}</span>
          </div>
          <Badge variant="outline" className="text-xs h-5 font-mono">
            {buildId}
          </Badge>
          {chainId && (
            <Badge variant="outline" className="text-xs h-5">
              Chain: {chainId}
            </Badge>
          )}
          {isMobile && (
            <Badge variant="outline" className="text-xs h-5">
              Mobile
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyDiagnostics}
          className="h-7 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy diagnostics
            </>
          )}
        </Button>
      </div>

      <Separator />

      <div className="px-4 py-3">
        <Card className="bg-background/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Performance Check</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyPerformanceCheck}
                className="h-7 gap-1.5 text-xs"
              >
                {perfCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <CardDescription className="text-xs">
              Application load and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Build ID:</span>
              <span className="font-mono font-medium">{perfData.buildId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-medium">{perfData.buildVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="font-mono text-[10px]">
                {new Date(perfData.timestamp).toLocaleString()}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Time to App Mounted:</span>
              <span className="font-medium text-primary">
                {perfData.timeToAppMounted !== null
                  ? `${perfData.timeToAppMounted.toFixed(0)} ms`
                  : 'N/A'}
              </span>
            </div>
            {perfData.domContentLoaded !== null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">DOM Content Loaded:</span>
                <span className="font-medium">{perfData.domContentLoaded.toFixed(0)} ms</span>
              </div>
            )}
            {perfData.loadComplete !== null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Load Complete:</span>
                <span className="font-medium">{perfData.loadComplete.toFixed(0)} ms</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
