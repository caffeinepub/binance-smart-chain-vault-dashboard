import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { normalizeAddress } from '@/lib/evm';
import type { TokenDropdownOption } from '@/hooks/useSavedTokenCatalog';

interface TokenSelectorInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: TokenDropdownOption[];
  helperText?: string;
  id?: string;
}

/**
 * Reusable token selector component that provides:
 * - Dropdown of saved tokens with labels
 * - Manual address input as fallback
 * - Validation and normalization
 */
export default function TokenSelectorInput({
  label,
  placeholder = '0x... (Token Address)',
  value,
  onChange,
  disabled = false,
  options,
  helperText,
  id = 'token-selector',
}: TokenSelectorInputProps) {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const selectedOption = options.find(
    opt => opt.value.toLowerCase() === value.toLowerCase()
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  const handleManualInput = (inputValue: string) => {
    onChange(inputValue);
  };

  const toggleMode = () => {
    setManualMode(!manualMode);
    if (!manualMode) {
      // Switching to manual mode
      onChange('');
    }
  };

  // If no options available, always show manual input
  const showManualInput = manualMode || options.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {options.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            disabled={disabled}
            className="h-auto py-1 px-2 text-xs"
          >
            {showManualInput ? 'Use Saved Tokens' : 'Enter Manually'}
          </Button>
        )}
      </div>

      {showManualInput ? (
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleManualInput(e.target.value)}
          className="font-mono text-sm"
          disabled={disabled}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between font-mono text-sm"
            >
              {selectedOption ? (
                <span className="truncate">
                  {selectedOption.label}
                  {selectedOption.label !== selectedOption.displayAddress && (
                    <span className="ml-2 text-muted-foreground">
                      {selectedOption.displayAddress}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Select a token...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border shadow-lg z-50" 
            align="start"
            sideOffset={4}
          >
            <Command className="bg-popover">
              <CommandInput placeholder="Search tokens..." className="bg-popover" />
              <CommandList className="bg-popover">
                <CommandEmpty>No tokens found.</CommandEmpty>
                <CommandGroup className="bg-popover">
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="font-mono text-sm bg-popover hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value.toLowerCase() === option.value.toLowerCase()
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {option.displayAddress}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No saved tokens yet. Add tokens in the Balances tab to see them here.
        </p>
      )}
    </div>
  );
}
