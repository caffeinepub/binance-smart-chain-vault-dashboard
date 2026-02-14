import { useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { useTokenMetadataCache } from '@/hooks/useTokenMetadataCache';
import { AddCustomTokenForm } from '@/components/AddCustomTokenForm';
import { getTokenDisplayLabel, getShortenedAddress } from '@/lib/tokenDisplay';
import { normalizeAddress } from '@/lib/evm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TokenSelectorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TokenSelectorInput({
  value,
  onChange,
  label = 'Token Address',
  placeholder = 'Select or enter token address',
  disabled = false,
}: TokenSelectorInputProps) {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenToRemove, setTokenToRemove] = useState<string | null>(null);
  const { catalog, removeTokenLabel } = useSavedTokenCatalog();
  const { tokens: watchedTokens, removeToken, hasToken } = useWatchedTokens();
  const { get: getMetadata, clearToken: clearMetadataCache } = useTokenMetadataCache();

  // Build options with proper label resolution
  const options = watchedTokens.map(address => {
    try {
      const normalized = normalizeAddress(address);
      const catalogLabel = catalog.get(normalized);
      const metadata = getMetadata(normalized);
      const displayLabel = getTokenDisplayLabel(normalized, catalogLabel, metadata?.symbol);
      
      return {
        value: normalized,
        label: displayLabel,
        displayAddress: getShortenedAddress(normalized),
      };
    } catch (error) {
      return {
        value: address,
        label: 'Invalid Address',
        displayAddress: address,
      };
    }
  });

  // Get display label for selected value
  const getSelectedDisplayLabel = (): string => {
    if (!value) {
      return placeholder;
    }
    
    try {
      const normalized = normalizeAddress(value);
      const catalogLabel = catalog.get(normalized);
      const metadata = getMetadata(normalized);
      return getTokenDisplayLabel(normalized, catalogLabel, metadata?.symbol);
    } catch (error) {
      return getShortenedAddress(value);
    }
  };

  const displayLabel = getSelectedDisplayLabel();

  // Filter options based on search query
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchQuery('');
  };

  const toggleMode = () => {
    setManualMode(!manualMode);
    if (manualMode) {
      // Switching back to selector mode
      setOpen(false);
    }
  };

  const handleRemoveToken = (address: string) => {
    setTokenToRemove(address);
  };

  const confirmRemoveToken = () => {
    if (!tokenToRemove) return;

    try {
      const normalized = normalizeAddress(tokenToRemove);
      
      // Check if token exists in watched list
      if (!hasToken(normalized)) {
        toast.error('Token not found', {
          description: 'This token is not in your watch list.',
        });
        setTokenToRemove(null);
        return;
      }

      // Remove from watched tokens
      removeToken(normalized);
      
      // Remove from catalog
      removeTokenLabel(normalized);
      
      // Clear metadata cache
      clearMetadataCache(normalized);

      // If the removed token was selected, clear the selection
      if (value.toLowerCase() === normalized.toLowerCase()) {
        onChange('');
      }

      toast.success('Token removed', {
        description: 'The token has been removed from your watch list.',
      });
    } catch (error) {
      console.error('Failed to remove token:', error);
      toast.error('Failed to remove token', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setTokenToRemove(null);
    }
  };

  if (manualMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="token-address">{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="h-7 text-xs"
          >
            Use selector
          </Button>
        </div>
        <Input
          id="token-address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0x..."
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="h-7 text-xs gap-1"
          >
            <Pencil className="h-3 w-3" />
            Manual entry
          </Button>
        </div>
        
        {/* Selected value display button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="w-full justify-start font-normal"
          disabled={disabled}
        >
          <span className="truncate">{displayLabel}</span>
        </Button>

        {/* In-flow list (not popover) */}
        {open && (
          <div className="border rounded-lg bg-popover shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b">
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Token list */}
            <ScrollArea className="h-[240px]">
              <div className="p-1">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No tokens found. Add a custom token below.
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground group',
                        value.toLowerCase() === option.value.toLowerCase() && 'bg-accent/50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value.toLowerCase() === option.value.toLowerCase()
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{option.label}</span>
                          <span className="text-xs text-muted-foreground font-mono truncate">
                            {option.value}
                          </span>
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveToken(option.value)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove token"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Add custom token form */}
            <div className="p-2 border-t">
              <AddCustomTokenForm />
            </div>
          </div>
        )}
      </div>

      {/* Remove token confirmation dialog */}
      <AlertDialog open={!!tokenToRemove} onOpenChange={(open) => !open && setTokenToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this token from your watch list? This will also clear its cached metadata and custom label.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveToken} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
