import { TxHistoryEntry } from '@/hooks/useTxHistory';
import { format } from 'date-fns';

/**
 * Format transaction history entries into a readable text summary
 * Accepts a subset of entries to share (not necessarily the full history)
 */
export function formatTxHistoryForSharing(entries: TxHistoryEntry[]): string {
  if (entries.length === 0) {
    return 'No transactions selected to share.';
  }

  const lines: string[] = [
    '📊 Digital Asset Vault - Transaction History',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ];

  entries.forEach((entry, index) => {
    const statusEmoji = {
      Pending: '⏳',
      Confirmed: '✅',
      Failed: '❌',
    }[entry.status];

    const typeEmoji = entry.type.includes('Deposit') ? '📥' : '📤';

    lines.push(`${index + 1}. ${typeEmoji} ${entry.type}`);
    lines.push(`   Status: ${statusEmoji} ${entry.status}`);
    lines.push(`   Asset: ${entry.asset}`);
    lines.push(`   Amount: ${entry.amount}`);
    lines.push(`   Time: ${format(entry.timestamp, 'MMM dd, yyyy HH:mm:ss')}`);
    lines.push(`   Tx: https://bscscan.com/tx/${entry.txHash}`);
    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Total Transactions: ${entries.length}`);
  lines.push(`Generated: ${format(Date.now(), 'MMM dd, yyyy HH:mm:ss')}`);

  return lines.join('\n');
}

/**
 * Build WhatsApp share URL with encoded text
 */
export function buildWhatsAppShareUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Build Telegram share URL with encoded text
 */
export function buildTelegramShareUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://t.me/share/url?url=&text=${encodedText}`;
}

/**
 * Open a share URL in a new window/tab
 * Returns true if successful, false if blocked
 */
export function openShareUrl(url: string): boolean {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    return newWindow !== null && !newWindow.closed;
  } catch (error) {
    console.error('Failed to open share URL:', error);
    return false;
  }
}
