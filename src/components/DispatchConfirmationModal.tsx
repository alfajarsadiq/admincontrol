// File: src/components/DispatchConfirmationModal.tsx (New Component)

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  confirmDispatch, 
  OrderStatusDetails,
  DispatchConfirmationResponse
} from '@/lib/api'; 
// Use date-fns for formatting the current time display
import { format } from 'date-fns'; 

interface DispatchConfirmationModalProps {
  order: OrderStatusDetails;
  salespersonName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DispatchConfirmationModal = ({ 
  order, 
  salespersonName, 
  isOpen, 
  onOpenChange 
}: DispatchConfirmationModalProps) => {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  // Current time is set on component render and is not editable
  const currentTime = new Date(); 

  const dispatchMutation = useMutation<DispatchConfirmationResponse, Error>({
    mutationFn: () => 
      confirmDispatch({ 
        orderId: order.orderId, 
        salesperson: salespersonName, 
        password,
        driverName,
        vehicleName,
      }),
    onSuccess: (data) => {
      // Invalidate the specific order status query to refetch details and show 'Dispatched' status
      queryClient.invalidateQueries({ queryKey: ['orderStatus', order.orderId] });
      toast.success(data.msg || `Order ${order.orderId} successfully Dispatched.`);
      
      // Reset state on successful dispatch
      onOpenChange(false);
      setPassword('');
      setDriverName('');
      setVehicleName('');
    },
    onError: (err: Error) => {
      // The API interceptor ensures a clear message is in err.message (e.g., "Invalid password")
      const message = err.message || 'Failed to confirm dispatch. Please try again.';
      toast.error(message);
      // Only clear the password if it was incorrect
      if (message.includes('password')) {
        setPassword('');
      }
    },
  });

  const handleDispatchConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !vehicleName || !password) {
      toast.warning('All fields (Driver Name, Vehicle Name, and Password) are required.');
      return;
    }
    dispatchMutation.mutate();
  };
  
  const isPending = dispatchMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" /> Salesperson Confirm Dispatch
          </DialogTitle>
          <DialogDescription>
            Enter vehicle details and the salesperson's password to mark order **{order.orderId}** as **Dispatched**.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDispatchConfirm} className="grid gap-4 py-4">
          
          {/* Order ID - Not Changable */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order-id" className="text-right">Order ID</Label>
            <Input id="order-id" value={order.orderId} className="col-span-3 font-mono" readOnly disabled />
          </div>

          {/* Current Time - Not Changable */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Time</Label>
            <Input id="time" value={format(currentTime, 'yyyy-MM-dd HH:mm:ss')} className="col-span-3" readOnly disabled />
          </div>

          {/* Driver Name Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver" className="text-right">Driver Name</Label>
            <Input
              id="driver"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="col-span-3"
              disabled={isPending}
              required
            />
          </div>

          {/* Vehicle Name Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicle" className="text-right">Vehicle Name</Label>
            <Input
              id="vehicle"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              className="col-span-3"
              disabled={isPending}
              required
            />
          </div>

          {/* Salesperson Password Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right flex items-center">
              <Lock className="h-3 w-3 mr-1" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !password || !driverName || !vehicleName}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Dispatch'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DispatchConfirmationModal;