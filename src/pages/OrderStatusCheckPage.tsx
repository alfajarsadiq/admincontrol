// File: src/pages/OrderStatusCheckPage.tsx (Updated with OrderExportButton and Tracker)

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, XCircle } from 'lucide-react';
import { fetchOrderStatus, OrderStatusDetails } from '@/lib/api';
import { toast } from 'sonner';

// 🔥 IMPORT THE NEW EXPORT BUTTON and the TRACKER COMPONENT
import OrderExportButton from '@/components/OrderExportButton';
import OrderStatusTracker from '@/components/OrderStatusTracker'; 

// Define the state structure for the search result
type SearchResult = OrderStatusDetails | null;

const OrderStatusCheckPage = () => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [searchedOrderId, setSearchedOrderId] = useState('');

  const { data, isFetching, error, refetch } = useQuery<SearchResult, Error>({
    queryKey: ['orderStatus', searchedOrderId],
    queryFn: () => {
      if (!searchedOrderId) return Promise.resolve(null);
      // NOTE: fetchOrderStatus returns OrderStatusDetails or throws an error.
      return fetchOrderStatus(searchedOrderId);
    },
    enabled: !!searchedOrderId,
    staleTime: 60 * 1000, 
    // FIX 1: Ensure `error` is treated as type `Error` to satisfy TanStack Query/TypeScript
    onError: (error) => { 
      // Enhanced error handling
      const errorMessage = error.message || 'Failed to fetch order status. Please check your connection.';
      if (errorMessage.includes('404')) {
        // FIX: Ensure the toast message is correct, using searchedOrderId if available
        toast.error(`Order ID ${searchedOrderId || orderIdInput.toUpperCase()} not found.`);
      } else {
        toast.error(errorMessage);
      }
    },
    onSuccess: (data) => {
        if (data) {
            toast.info(`Status for ${data.orderId} loaded successfully.`);
        }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedId = orderIdInput.trim().toUpperCase();
    
    if (!normalizedId) {
      toast.warning('Please enter an Order ID.');
      return;
    }
    
    // If the ID is the same, force a refetch, otherwise set new ID
    if (normalizedId !== searchedOrderId) {
        setSearchedOrderId(normalizedId); 
    } else {
        refetch();
    }
  };

  const renderResult = () => {
    // Show loading spinner only when actively fetching a searched ID
    if (isFetching && searchedOrderId) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Searching for order...</span>
        </div>
      );
    }
    
    // Show error message only if there was a search attempt
    if (error && searchedOrderId) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-red-500">
          <XCircle className="h-6 w-6 mb-2" />
          <p className="text-sm font-medium">Error finding order.</p>
          <p className="text-xs text-center">{error.message}</p>
        </div>
      );
    }

    // FIX 2 & 3: Narrowing the type of 'data' to OrderStatusDetails inside this block.
    if (data) {
      const { 
        orderId, 
        companyName, 
        salesperson, 
        createdAt, 
        deliveryDate, 
        status, 
      } = data;
      
      const statusColor = status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                          status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700';

      return (
        <div className="space-y-6 pt-4">
          
          {/* 1. Order Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-lg">Order Details</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Company Name</p>
                <p className="font-medium">{companyName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Salesperson</p>
                <p className="font-medium">{salesperson}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Order Date (Created)</p>
                <p className="font-medium">{createdAt}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Delivery Date</p>
                <p className="font-medium">{deliveryDate}</p>
              </div>
            </div>
          </div>
          
          {/* 2. Order Tracking Section (New Component) */}
          <OrderStatusTracker 
            order={data} 
            salespersonName={salesperson} 
          />

        </div>
      );
    }

    return (
      <div className="flex justify-center items-center p-8 text-muted-foreground">
        <Search className="mr-2 h-4 w-4" />
        <span className="text-sm">Enter an **Order ID** to check its status.</span>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Order Status Check</h2>
      <Card>
        <CardHeader>
          <CardTitle>Lookup Order</CardTitle>
          <CardDescription>Enter the Order ID (e.g., ORD-10001) to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 🔥 Layout Fix: Main container for Search and Download Button */}
          <div className="flex gap-3 items-center">
            <form onSubmit={handleSearch} className="flex space-x-3 flex-1">
              <Input
                placeholder="Enter Order ID (e.g., ORD-10001)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="max-w-md w-full" // Use w-full for flex-1
                disabled={isFetching}
              />
              <Button type="submit" disabled={isFetching} className="min-w-[120px]">
                {isFetching && searchedOrderId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </form>
            {/* 🔥 Download Button is placed outside the form but inside the flex container */}
            <OrderExportButton />
          </div>


          <div className="mt-6 border-t pt-6">
            {renderResult()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatusCheckPage;
