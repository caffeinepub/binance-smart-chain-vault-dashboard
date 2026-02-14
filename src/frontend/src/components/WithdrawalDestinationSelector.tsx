import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { normalizeAddress } from '@/lib/evm';

interface WithdrawalDestinationSelectorProps {
  value: string;
  onChange: (address: string) => void;
  ownerAddress: string | null;
  disabled?: boolean;
}

export function WithdrawalDestinationSelector({
  value,
  onChange,
  ownerAddress,
  disabled = false,
}: WithdrawalDestinationSelectorProps) {
  const [mode, setMode] = useState<'owner' | 'custom'>('owner');
  const [customAddress, setCustomAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleModeChange = (newMode: 'owner' | 'custom') => {
    setMode(newMode);
    setValidationError(null);

    if (newMode === 'owner') {
      // Use owner address
      if (ownerAddress) {
        onChange(ownerAddress);
      }
    } else {
      // Switch to custom mode
      onChange(customAddress);
    }
  };

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address);
    setValidationError(null);

    if (address.trim()) {
      try {
        const normalized = normalizeAddress(address.trim());
        onChange(normalized);
      } catch (err: any) {
        setValidationError(err.message || 'Invalid address');
        onChange('');
      }
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      <Label>Withdrawal Destination</Label>
      
      <RadioGroup
        value={mode}
        onValueChange={(val) => handleModeChange(val as 'owner' | 'custom')}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="owner" id="dest-owner" />
          <Label htmlFor="dest-owner" className="font-normal cursor-pointer">
            Owner wallet
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="dest-custom" />
          <Label htmlFor="dest-custom" className="font-normal cursor-pointer">
            Custom address
          </Label>
        </div>
      </RadioGroup>

      {mode === 'owner' && !ownerAddress && (
        <Alert>
          <AlertDescription>
            Loading owner address...
          </AlertDescription>
        </Alert>
      )}

      {mode === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-recipient">Recipient Address</Label>
          <Input
            id="custom-recipient"
            value={customAddress}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder="0x..."
            disabled={disabled}
          />
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
