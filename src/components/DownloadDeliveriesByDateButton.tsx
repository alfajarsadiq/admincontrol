// File: src/components/DownloadDeliveriesByDateButton.tsx (New Component)

import React, { useState } from 'react';
import { Download, Loader2, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  fetchDeliveryLocationsByDate, 
  downloadOrdersByDate 
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export const DownloadDeliveriesByDateButton: React.FC = () => {
  // Get today's date in YYYY-MM-DD format as the initial default date
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // useQuery to fetch locations for the selected date.
  const { 
    data: locations = [], 
    isLoading: isLoadingLocations, 
    isError,
    refetch,
  } = useQuery<string[]>({
    queryKey: ['deliveryLocationsByDate', selectedDate],
    queryFn: () => fetchDeliveryLocationsByDate(selectedDate),
    enabled: isMenuOpen && !!selectedDate, // Only fetch when the dropdown is opened and a date is selected
    staleTime: 5 * 60 * 1000, 
  });
  
  // Refetch locations when the dropdown opens if a date is selected
  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    if (open && selectedDate) {
        // Force refetch locations when opening the menu
        refetch();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    // Automatically close menu when date changes to force refetch on next open
    setIsMenuOpen(false); 
  };

  const handleDownload = async (location: string) => {
    if (!selectedDate || !location) return;
    setIsDownloading(true);
    const toastId = toast.loading(`Generating report for ${location} on ${selectedDate}...`);
    
    try {
      // Calls the UPDATED backend route: /api/orders/download/by-date?date=...&location=...
      const blob = await downloadOrdersByDate(selectedDate, location);

      const safeLocation = location.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `deliveries_${safeLocation}_${selectedDate}.xlsx`;
      
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
      setIsMenuOpen(false);
    }
  };

  const isLoading = isLoadingLocations || isDownloading;
  
  // Render the DropdownMenuTrigger content (Date Picker + Button)
  const triggerContent = (
    <div className="flex items-center gap-2">
      {/* Date Input */}
      <Input
        id="delivery-date-export"
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="w-auto h-9 p-2 text-sm"
        disabled={isLoading}
      />
      
      {/* Dropdown Button */}
      <Button 
        variant="outline" 
        size="sm"
        disabled={isLoading || !selectedDate}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        
        <span className="hidden sm:inline">Export Deliveries</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );


  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerContent}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          Deliveries on {selectedDate || 'Select Date'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Loading State */}
        {isLoadingLocations && (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Locations...
          </DropdownMenuItem>
        )}
        
        {/* Error State */}
        {isError && (
          <DropdownMenuItem disabled className="text-destructive">
            Failed to load locations
          </DropdownMenuItem>
        )}

        {/* Success State: Show Locations */}
        {!isLoadingLocations && !isError && locations.length > 0 ? (
          locations.map((location) => (
            <DropdownMenuItem 
              key={location} 
              onClick={() => handleDownload(location)}
              disabled={isDownloading}
            >
              {location || "Unspecified Location"}
            </DropdownMenuItem>
          ))
        ) : (
          // No Results State
          !isLoadingLocations && !isError && (
            <DropdownMenuItem disabled>
              No deliveries scheduled.
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};