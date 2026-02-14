/**
 * Reusable button component for downloading a ZIP of the project source code
 * Shows loading state with progress messages during export
 */

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportProjectZip, downloadZip, type ExportProgress } from '@/lib/buildExport';

export default function BuildExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setProgressMessage('Starting export...');

    try {
      const result = await exportProjectZip((progress: ExportProgress) => {
        setProgressMessage(progress.stage);
      });

      downloadZip(result.blob, result.filename);
      
      toast.success('Project exported successfully', {
        description: `Downloaded ${result.filename}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Failed to create project ZIP',
      });
    } finally {
      setIsExporting(false);
      setProgressMessage('');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? progressMessage : 'Download project ZIP'}
    </Button>
  );
}
