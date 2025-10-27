// File: src/components/DownloadTodaysDeliveriesButton.tsx
import React, { useState } from 'react';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  fetchTodaysDeliveryLocations, 
  downloadTodaysDeliveriesByLocation 
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export const DownloadTodaysDeliveriesButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // useQuery to fetch locations. It will only run when `isMenuOpen` is true.
  const { 
    data: locations, 
    isLoading: isLoadingLocations, 
    isError 
  } = useQuery<string[]>({
    queryKey: ['todaysDeliveryLocations'],
    queryFn: fetchTodaysDeliveryLocations,
    enabled: isMenuOpen, // Only fetch when the dropdown is opened
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleDownload = async (location: string) => {
    if (!location) return;
    setIsDownloading(true);
    const toastId = toast.loading(`Generating report for ${location}...`);
    
    try {
      const blob = await downloadTodaysDeliveriesByLocation(location);

      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      const safeLocation = location.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `deliveries_${safeLocation}_${formattedDate}.xlsx`;
      
      saveAs(blob, filename);

      toast.success(`Report for ${location} downloaded!`, {
        id: toastId,
      });

    } catch (err: any) {
      console.error('Failed to download report:', err);
      toast.error(err.message || 'Failed to download report.', {
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // --- START OF MOBILE FIX 1: Shorter loading text ---
  const isLoading = isLoadingLocations || isDownloading;

  const getButtonText = () => {
    if (isLoadingLocations) return "Loading...";
    if (isDownloading) return "Generating...";
    return "Today's Deliveries";
  }
  // --- END OF MOBILE FIX 1 ---

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            // Hide the download icon on mobile if not loading
            <Download className="mr-2 h-4 w-4 sm:mr-2" />
          )}
          
          {/* --- START OF MOBILE FIX 2: Responsive text --- */}
          {/* If loading, always show the status text.
            If not loading, hide the "Today's Deliveries" text on mobile.
          */}
          {isLoading ? (
            <span>{getButtonText()}</span>
          ) : (
            <span className="hidden sm:inline">{getButtonText()}</span>
          )}
          {/* --- END OF MOBILE FIX 2 --- */}

          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {/* --- START OF MOBILE FIX 3: Standardized dropdown width --- */}
      <DropdownMenuContent align="end" className="w-56">
      {/* --- END OF MOBILE FIX 3 --- */}
        <DropdownMenuLabel>Select a Location</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoadingLocations && (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </DropdownMenuItem>
        )}
        
        {isError && (
          <DropdownMenuItem disabled className="text-destructive">
            Failed to load locations
          </DropdownMenuItem>
        )}

        {!isLoadingLocations && !isError && locations && locations.length > 0 ? (
          locations.map((location) => (
            <DropdownMenuItem 
              key={location} 
              onClick={() => handleDownload(location)}
              disabled={isDownloading}
            >
              {location || "Unspecified"}
            </DropdownMenuItem>
          ))
        ) : (
          !isLoadingLocations && !isError && (
            <DropdownMenuItem disabled>
              No deliveries scheduled for today.
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};