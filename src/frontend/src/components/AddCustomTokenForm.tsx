import { useState, useEffect } from 'react';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useTokenMetadataCache } from '@/hooks/useTokenMetadataCache';
import { useWeb3 } from '@/hooks/useWeb3';
import { normalizeAddress } from '@/lib/evm';
import { encodeCall } from '@/lib/contracts';
import { decodeTokenSymbol, decodeTokenName } from '@/lib/evmAbiText';
import { suggestLabelFromMetadata, getSafeLabelForSaving } from '@/lib/tokenDisplay';
import { toast } from 'sonner';

export function AddCustomTokenForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [suggestedLabel, setSuggestedLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  const { addToken, hasToken } = useWatchedTokens();
  const { setTokenLabel } = useSavedTokenCatalog();
  const { set: setMetadataCache } = useTokenMetadataCache();
  const { callContract } = useWeb3();

  // Fetch token metadata when address changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!address.trim()) {
        setSuggestedLabel('');
        setMetadataFetched(false);
        return;
      }

      try {
        const normalized = normalizeAddress(address.trim());
        
        setIsFetchingMetadata(true);
        setError(null);
        setMetadataFetched(false);

        // Fetch symbol and name in parallel
        const [symbolResult, nameResult] = await Promise.allSettled([
          callContract(normalized, encodeCall('symbol')),
          callContract(normalized, encodeCall('name')),
        ]);

        const symbol = symbolResult.status === 'fulfilled' 
          ? decodeTokenSymbol(symbolResult.value, '')
          : '';
        
        const name = nameResult.status === 'fulfilled'
          ? decodeTokenName(nameResult.value, '')
          : '';

        // Suggest a label from metadata
        const suggested = suggestLabelFromMetadata(symbol, name);
        setSuggestedLabel(suggested);
        
        // Auto-fill label if empty and we have a suggestion
        if (!label.trim() && suggested) {
          setLabel(suggested);
        }

        setMetadataFetched(true);
      } catch (err: any) {
        console.warn('Failed to fetch token metadata:', err);
        // Don't show error - metadata fetch is optional
        setSuggestedLabel('');
        setMetadataFetched(false);
      } finally {
        setIsFetchingMetadata(false);
      }
    };

    // Debounce metadata fetch
    const timer = setTimeout(fetchMetadata, 500);
    return () => clearTimeout(timer);
  }, [address, callContract]);

  const handleSave = async () => {
    setError(null);

    if (!address.trim()) {
      setError('Please enter a token address');
      return;
    }

    setIsSaving(true);

    try {
      // Validate and normalize address
      const normalized = normalizeAddress(address.trim());

      // Get safe label (never empty)
      const finalLabel = getSafeLabelForSaving(normalized, label.trim());

      // Check if token already exists
      const exists = hasToken(normalized);

      // Add to watched tokens if not already present
      if (!exists) {
        addToken(normalized);
      }

      // Always upsert the label (update if exists)
      setTokenLabel(normalized, finalLabel);

      // If we fetched metadata, cache it
      if (metadataFetched && suggestedLabel) {
        try {
          // Fetch decimals for cache
          const decimalsResult = await callContract(normalized, encodeCall('decimals'));
          const decimals = decimalsResult && decimalsResult !== '0x' 
            ? parseInt(decimalsResult, 16) 
            : 18;
          
          setMetadataCache(normalized, {
            symbol: suggestedLabel,
            decimals,
            name: label.trim() || suggestedLabel,
          });
        } catch (err) {
          console.warn('Failed to cache metadata:', err);
        }
      }

      toast.success(exists ? 'Token label updated' : 'Custom token added');

      // Reset form
      setAddress('');
      setLabel('');
      setSuggestedLabel('');
      setMetadataFetched(false);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error adding custom token:', err);
      setError(err.message || 'Invalid token address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add Custom Token
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/30">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="custom-token-address">Token Contract Address</Label>
          <Input
            id="custom-token-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            disabled={isSaving}
          />
          {isFetchingMetadata && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Fetching token info...
            </div>
          )}
          {metadataFetched && suggestedLabel && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Token found: {suggestedLabel}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-token-label">
            Token Label
            {suggestedLabel && (
              <span className="text-xs text-muted-foreground ml-2">
                (auto-filled from contract)
              </span>
            )}
          </Label>
          <Input
            id="custom-token-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={suggestedLabel || "e.g., USDT, MyToken"}
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            You can customize the label or use the suggested one
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !address.trim() || isFetchingMetadata}
            className="flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Token'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setAddress('');
              setLabel('');
              setSuggestedLabel('');
              setMetadataFetched(false);
              setError(null);
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
