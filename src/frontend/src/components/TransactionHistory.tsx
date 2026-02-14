import { useState } from 'react';
import { History, ExternalLink, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Share2 } from 'lucide-react';
import { SiWhatsapp, SiTelegram } from 'react-icons/si';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTxHistory, type TxHistoryEntry } from '@/hooks/useTxHistory';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  formatTxHistoryForSharing,
  buildWhatsAppShareUrl,
  buildTelegramShareUrl,
  openShareUrl,
} from '@/lib/txHistoryShare';

export default function TransactionHistory() {
  const { history, clearHistory, getBscScanUrl } = useTxHistory();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')) {
      clearHistory();
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(history.map(entry => entry.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleShare = (platform: 'whatsapp' | 'telegram') => {
    try {
      if (selectedIds.size === 0) {
        toast.error('No transactions selected', {
          description: 'Please select at least one transaction to share.',
        });
        return;
      }

      const selectedEntries = history.filter(entry => selectedIds.has(entry.id));
      const shareText = formatTxHistoryForSharing(selectedEntries);
      
      const shareUrl = platform === 'whatsapp' 
        ? buildWhatsAppShareUrl(shareText)
        : buildTelegramShareUrl(shareText);

      const opened = openShareUrl(shareUrl);
      
      if (!opened) {
        toast.error('Unable to open share window', {
          description: 'Please check if popups are blocked in your browser settings.',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share transaction history', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const getStatusIcon = (status: TxHistoryEntry['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'Confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TxHistoryEntry['status']) => {
    const variants = {
      Pending: 'default',
      Confirmed: 'default',
      Failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span>{status}</span>
      </Badge>
    );
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const shortenAddress = (address: string) => {
    if (address.startsWith('0x') && address.length === 42) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Deposit & Withdrawal History
            </CardTitle>
            <CardDescription>
              Track your vault transactions initiated from this dApp
            </CardDescription>
          </div>
          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={selectedIds.size === 0}
                  >
                    <Share2 className="h-4 w-4" />
                    Share {selectedIds.size > 0 && `(${selectedIds.size})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <SiWhatsapp className="h-4 w-4 text-green-600" />
                    <span>Share via WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleShare('telegram')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <SiTelegram className="h-4 w-4 text-blue-500" />
                    <span>Share via Telegram</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </div>
          )}
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 text-xs"
              disabled={selectedIds.size === 0}
            >
              Clear Selection
            </Button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} of {history.length} selected
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <Alert className="border-primary/30 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              No transaction history yet. Your deposits and withdrawals will appear here.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {history.map((entry) => (
                <Card key={entry.id} className="border-primary/10">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selectedIds.has(entry.id)}
                            onCheckedChange={() => handleToggleSelection(entry.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{entry.type}</span>
                              {getStatusBadge(entry.status)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Asset:</span>
                                <span className="font-mono text-xs">{shortenAddress(entry.asset)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Amount:</span>
                                <span>{entry.amount}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Time:</span>
                                <span>{formatDistanceToNow(entry.timestamp, { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                        <span className="text-xs font-mono text-muted-foreground">
                          {shortenHash(entry.txHash)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-primary hover:text-primary/80"
                        >
                          <a
                            href={getBscScanUrl(entry.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs">View on BscScan</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
