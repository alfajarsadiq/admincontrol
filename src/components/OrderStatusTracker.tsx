// File: src/components/OrderStatusTracker.tsx (Unchanged as the file is for single-order status, not bulk export)

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Truck, Package, X, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { confirmDelivery, OrderStatusDetails } from '@/lib/api'; // Assuming you update api.ts

// 🔥 IMPORT NEW DISPATCH MODAL COMPONENT
import DispatchConfirmationModal from './DispatchConfirmationModal';

// Define the steps and their order
// NOTE: Dispatched is now the middle status
const STATUS_STEPS = ['Confirmed', 'Dispatched', 'Delivered'];

// Component Props
interface OrderStatusTrackerProps {
  order: OrderStatusDetails;
  salespersonName: string; // Used for confirmation logic
}

const OrderStatusTracker = ({ order, salespersonName }: OrderStatusTrackerProps) => {
  const queryClient = useQueryClient();
  const currentStatus = order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false); // Renamed for clarity
  // 🔥 NEW STATE: Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  
  const [password, setPassword] = useState('');

  // Mutation for confirming delivery
  const deliveryMutation = useMutation({
    mutationFn: () => 
      confirmDelivery({ 
        orderId: order.orderId, 
        salesperson: salespersonName, 
        password 
      }),
    onSuccess: (data) => {
      // Invalidate the specific order status query to refetch details
      queryClient.invalidateQueries({ queryKey: ['orderStatus', order.orderId] });
      toast.success(data.msg || `Order ${order.orderId} successfully confirmed as Delivered.`);
      setIsDeliveryModalOpen(false);
      setPassword('');
    },
    onError: (err: Error) => {
      // Display the specific error message from the backend (e.g., "Invalid password")
      const message = err.message || 'Failed to confirm delivery. Please try again.';
      toast.error(message);
    },
  });

  const handleDeliveryConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.warning('Please enter the salesperson password.');
      return;
    }
    deliveryMutation.mutate();
  };
  
  // Renders a single step circle/label
  const renderStep = (step: string, index: number) => {
    const isCompleted = index < currentStepIndex; // Step is complete if we are past it
    const isActive = index === currentStepIndex;

    let Icon = Package;
    if (step === 'Dispatched') Icon = Truck;
    if (step === 'Delivered') Icon = CheckCircle;
    
    // Status text (Completed vs. Pending)
    let text = step;
    if (index > currentStepIndex) {
        text = 'Pending';
    } else if (isActive && currentStatus === 'Confirmed') {
        text = 'Confirmed';
    } else if (isActive && currentStatus === 'Dispatched') {
        text = 'Dispatched';
    } else if (isCompleted || isActive && currentStatus === 'Delivered') {
        text = step;
    }
    
    // Adjust colors based on current status
    let bgColor = 'border-gray-300 text-gray-400'; // Default: Pending
    let textColor = 'text-gray-500';

    if (isCompleted || (isActive && step === 'Delivered')) {
        // Delivered or steps before it are green
        bgColor = 'bg-green-500 border-green-500 text-white';
        textColor = 'text-green-600';
    } else if (isActive) {
        // Current step (Confirmed or Dispatched) is active/yellow
        bgColor = 'bg-yellow-400 border-yellow-400 text-black';
        textColor = 'text-yellow-700';
    }


    return (
      <div key={step} className="flex flex-col items-center">
        <div 
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${bgColor}
            transition-colors duration-200
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className={`mt-2 text-xs font-medium text-center ${textColor}`}>
          {text}
        </span>
      </div>
    );
  };

  const isAnyMutationPending = deliveryMutation.isPending || (isDispatchModalOpen && !isDeliveryModalOpen); // Simple check for any ongoing process

  return (
    <>
      <div className="pt-4 space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Order Tracking</h3>

        {/* Tracking Timeline */}
        <div className="flex justify-between items-center py-4 relative">
          {/* Timeline Connector Line */}
          {/* The line should reach up to the current step */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 mx-auto w-[90%] transform -translate-y-1/2" />
          
          {STATUS_STEPS.map((step, index) => renderStep(step, index))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          
          {/* 1. DISPATCH Button: Show when status is 'Confirmed' */}
          {currentStatus === 'Confirmed' && (
             <Button 
              onClick={() => setIsDispatchModalOpen(true)}
              disabled={isAnyMutationPending}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
                <Truck className="mr-2 h-4 w-4" />
                Salesperson Confirm Dispatch
            </Button>
          )}

          {/* 2. DELIVERY Button: Show when status is 'Dispatched' */}
          {currentStatus === 'Dispatched' && (
            <Button 
              onClick={() => setIsDeliveryModalOpen(true)}
              disabled={isAnyMutationPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {deliveryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Salesperson Confirm Delivery
                </>
              )}
            </Button>
          )}
          
          {/* 3. DELIVERED Label: Show when status is 'Delivered' */}
          {currentStatus === 'Delivered' && (
             <span className="text-green-600 font-semibold p-2 border border-green-200 rounded-lg">
                <CheckCircle className="inline h-4 w-4 mr-1" /> Order Delivered
             </span>
          )}
        </div>
      </div>

      {/* 1. DISPATCH CONFIRMATION MODAL */}
      <DispatchConfirmationModal
        order={order}
        salespersonName={salespersonName}
        isOpen={isDispatchModalOpen}
        onOpenChange={setIsDispatchModalOpen}
      />

      {/* 2. DELIVERY CONFIRMATION MODAL (Existing logic) */}
      <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" /> Confirm Delivery
            </DialogTitle>
            <DialogDescription>
              Enter the salesperson's password to confirm delivery for order **{order.orderId}** ({order.salesperson}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeliveryConfirm} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                disabled={deliveryMutation.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeliveryModalOpen(false)} disabled={deliveryMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={deliveryMutation.isPending || !password}>
                {deliveryMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Confirm & Deliver'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderStatusTracker;
