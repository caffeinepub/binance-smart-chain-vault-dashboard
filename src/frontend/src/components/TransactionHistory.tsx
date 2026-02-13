import { History, ExternalLink, Trash2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTxHistory, type TxHistoryEntry } from '@/hooks/useTxHistory';
import { formatDistanceToNow } from 'date-fns';

export default function TransactionHistory() {
  const { history, clearHistory, getBscScanUrl } = useTxHistory();

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')) {
      clearHistory();
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear History
            </Button>
          )}
        </div>
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
