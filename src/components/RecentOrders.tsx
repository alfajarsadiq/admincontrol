// File: src/components/RecentOrders.tsx (Updated)

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileDown, FileText, Loader2, Trash2, Edit } from "lucide-react"; 
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { saveAs } from "file-saver";

import { 
  fetchRecentOrders, 
  deleteOrder, 
  // 💥 downloadOrdersByDate is no longer imported here
} from "@/lib/api";
import { DownloadTodaysDeliveriesButton } from "./DownloadTodaysDeliveriesButton";
import { ConfirmedOrder } from "@/types";

// 🔥 IMPORT NEW DATE-BASED DOWNLOAD BUTTON
import { DownloadDeliveriesByDateButton } from "./DownloadDeliveriesByDateButton"; 

// 櫨 IMPORT NEW MODAL
import { EditOrderModal } from "./orders/EditOrderModal"; 

interface RecentOrdersProps {
  // No props needed
}

const handleDownloadPDF = (order: ConfirmedOrder) => {
  toast.info("Downloading PDF...", {
    description: `Generating PDF for Order ID: ${order.orderId}. (This is a mock-up).`,
  });
  console.log("Mock PDF Download for:", order);
};

export const RecentOrders: React.FC<RecentOrdersProps> = () => {
  // State for View Details Modal
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null);
  
  // 櫨 STATE FOR EDIT MODAL
  const [orderToEdit, setOrderToEdit] = useState<ConfirmedOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 💥 REMOVED: excelDate state
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ConfirmedOrder | null>(null);
  
  // 💥 REMOVED: isExporting state and handleExcelExport logic

  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<ConfirmedOrder[]>({
    queryKey: ["recentOrders"],
    queryFn: fetchRecentOrders,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: (data, orderId) => {
      toast.success(data.msg || `Order ${orderId} deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ["recentOrders"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.msg || "Failed to delete order.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setOrderToDelete(null);
      setIsAlertOpen(false);
    }
  });

  // 💥 REMOVED: handleExcelExport is deprecated/moved

  const handleDeleteClick = (order: ConfirmedOrder) => {
    setOrderToDelete(order);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.orderId);
    }
  };
  
  // 櫨 NEW HANDLER: Opens the edit modal
  const handleEditClick = (order: ConfirmedOrder) => {
    setOrderToEdit(order);
    setIsEditModalOpen(true);
  };
  
  // 櫨 NEW HANDLER: Closes the edit modal and resets state
  const handleCloseEditModal = () => {
    setOrderToEdit(null);
    setIsEditModalOpen(false);
  }

  return (
    <>
      <Dialog>
        <Card className="col-span-1 lg:col-span-3">
          {/* --- START OF HEADER UPDATE --- */}
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Recent Confirmed Orders</CardTitle>
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start">
              
              {/* 🔥 NEW COMPONENT: Handles date selection and location download */}
              <DownloadDeliveriesByDateButton /> 
              
              {/* Existing "Today's Deliveries" button */}
              <DownloadTodaysDeliveriesButton />
              
              {/* 💥 REMOVED OLD DATE INPUT AND EXPORT BUTTON
              <Label htmlFor="excel-date" className="text-sm font-medium sr-only">
                Export Date:
              </Label>
              <Input
                id="excel-date"
                type="date"
                value={excelDate}
                onChange={(e) => setExcelDate(e.target.value)}
                className="w-auto"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExcelExport}
                disabled={isExporting} 
                title="Download all orders for the selected date"
              >
                ... (Export Button Content)
              </Button>
              */}
            </div>
          </CardHeader>
          {/* --- END OF HEADER UPDATE --- */}
          <CardContent>
            {/* ... (Table content remains unchanged) */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Salesperson</TableHead> {/* Added Salesperson column for context */}
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-destructive">
                        Failed to load recent orders.
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No confirmed orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.orderId} className="odd:bg-white even:bg-muted/40">
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>{order.companyName}</TableCell>
                        <TableCell>{order.salesperson}</TableCell> {/* Display salesperson */}
                        <TableCell>{order.currentDate}</TableCell>
                        <TableCell>{order.deliveryDate || "N/A"}</TableCell>
                        {/* Use a flex container for actions to prevent weird wrapping */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* 櫨 NEW EDIT BUTTON */}
                            <Button
                              variant="secondary"
                              size="icon"
                              title="Edit Order"
                              onClick={() => handleEditClick(order)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                title="View Order"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              title="Download PDF"
                              onClick={() => handleDownloadPDF(order)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="icon"
                              title="Delete Order"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDeleteClick(order)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div> {/* This closes the overflow-x-auto div */}
          </CardContent>
        </Card>

        {/* View Order Details Dialog (Remains unchanged) */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details: {selectedOrder?.orderId}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <>
              <div className="max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>Company:</strong> {selectedOrder.companyName}
                  </div>
                  <div>
                    <strong>Salesperson:</strong> {selectedOrder.salesperson}
                  </div>
                  <div>
                    <strong>Company Number:</strong> {selectedOrder.companyNumber}
                  </div>
                  <div>
                    <strong>Delivery Location:</strong>{" "}
                    {selectedOrder.deliveryLocation}
                  </div>
                  <div>
                    <strong>Order Date:</strong> {selectedOrder.currentDate}
                  </div>
                  <div>
                    <strong>Delivery Date:</strong> {selectedOrder.deliveryDate}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )} 
        </DialogContent>
      </Dialog>
      
      {/* 櫨 NEW EDIT MODAL INTEGRATION */}
      <EditOrderModal 
        order={orderToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />

      {/* Delete Confirmation Dialog (Remains unchanged) */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              order <span className="font-medium">{orderToDelete?.orderId}</span> from
              the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
