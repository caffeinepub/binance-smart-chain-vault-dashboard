import { useState } from 'react';
import { Check, ChevronsUpDown, Pencil } from 'lucide-react';
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
import { useSavedTokenCatalog } from '@/hooks/useSavedTokenCatalog';
import { useWatchedTokens } from '@/hooks/useWatchedTokens';
import { cn } from '@/lib/utils';

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
  const { getDropdownOptions, getTokenLabel } = useSavedTokenCatalog();
  const { tokens: watchedTokens } = useWatchedTokens();

  const options = getDropdownOptions(watchedTokens);
  const selectedOption = options.find((opt) => opt.value.toLowerCase() === value.toLowerCase());
  const displayLabel = selectedOption?.label || (value ? getTokenLabel(value) : placeholder);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  const toggleMode = () => {
    setManualMode(!manualMode);
    if (manualMode) {
      // Switching back to selector mode
      setOpen(true);
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-lg z-50">
          <Command className="bg-popover">
            <CommandInput placeholder="Search tokens..." className="bg-popover" />
            <CommandList className="bg-popover">
              <CommandEmpty className="bg-popover py-6 text-center text-sm text-muted-foreground">
                No saved tokens found. Use manual entry to add a token address.
              </CommandEmpty>
              <CommandGroup className="bg-popover">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="bg-popover hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
                      <span className="font-medium truncate">{option.label}</span>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {option.value}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
