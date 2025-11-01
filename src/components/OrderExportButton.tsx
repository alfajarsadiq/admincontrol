// File: src/components/OrderExportButton.tsx

import React, { useState } from 'react';
import { Download, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadOrdersByStatus } from '@/lib/api'; // 🔥 Import the new API function

// Define the available statuses for export
const EXPORT_STATUSES = [
  { label: 'Confirmed Orders', status: 'Confirmed' },
  { label: 'Dispatched Orders', status: 'Dispatched' },
  { label: 'Delivered Orders', status: 'Delivered' },
  { label: 'Cancelled Orders', status: 'Cancelled' },
];

const OrderExportButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingStatus, setDownloadingStatus] = useState('');

  const handleDownload = async (status: string, label: string) => {
    setIsDownloading(true);
    setDownloadingStatus(label);

    try {
      // 1. Call the API function to fetch the Excel Blob
      const blob = await downloadOrdersByStatus(status);

      // 2. Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob);
      
      // 3. Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      // The backend should set the filename, but we provide a fallback
      link.setAttribute('download', `${status.toLowerCase()}_orders_report.xlsx`); 
      document.body.appendChild(link);
      link.click();
      
      // 4. Clean up
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully started download for ${label}.`);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during download.';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
      setDownloadingStatus('');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isDownloading} 
          className="bg-green-600 hover:bg-green-700 text-white min-w-[160px]" // Adjusted min-width slightly
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading {downloadingStatus}...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> 
              Download Orders 
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORT_STATUSES.map((item) => (
          <DropdownMenuItem 
            key={item.status} 
            onClick={() => handleDownload(item.status, item.label)}
            disabled={isDownloading}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderExportButton;