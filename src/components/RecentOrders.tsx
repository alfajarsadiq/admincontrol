// src/components/RecentOrders.tsx
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
import { Eye, FileDown, FileText, Loader2, Trash2 } from "lucide-react"; 
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
  downloadOrdersByDate 
} from "@/lib/api";
import { DownloadTodaysDeliveriesButton } from "./DownloadTodaysDeliveriesButton";
import { ConfirmedOrder } from "@/types";

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
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null);
  const [excelDate, setExcelDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ConfirmedOrder | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExcelExport = async () => {
    if (!excelDate) {
      toast.error("Please select a date to export.");
      return;
    }
    
    setIsExporting(true);
    const toastId = toast.loading(`Generating report for ${excelDate}...`);

    try {
      const blob = await downloadOrdersByDate(excelDate);
      
      const filename = `orders_report_${excelDate}.xlsx`;
      saveAs(blob, filename); 

      toast.success(`Report for ${excelDate} downloaded!`, {
        id: toastId,
      });

    } catch (err: any) {
      console.error('Failed to download report:', err);
      toast.error(err.message || 'Failed to download report.', {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteClick = (order: ConfirmedOrder) => {
    setOrderToDelete(order);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.orderId);
    }
  };

  return (
    <>
      <Dialog>
        <Card className="col-span-1 lg:col-span-3">
          {/* --- START OF MOBILE FIX 1: Header layout --- */}
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Recent Confirmed Orders</CardTitle>
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start">
              {/* --- END OF MOBILE FIX 1 --- */}
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
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                {isExporting ? "Exporting..." : "Export by Date"}
              </Button>
              <DownloadTodaysDeliveriesButton />
            </div>
          </CardHeader>
          <CardContent>
            {/* --- START OF MOBILE FIX 2: Table horizontal scroll --- */}
            <div className="overflow-x-auto">
              <Table>
            {/* --- END OF MOBILE FIX 2 --- */}
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-destructive">
                        Failed to load recent orders.
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                        <TableCell>{order.currentDate}</TableCell>
                        <TableCell>{order.deliveryDate || "N/A"}</TableCell>
                        {/* Use a flex container for actions to prevent weird wrapping */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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

        {/* View Order Details Dialog */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details: {selectedOrder?.orderId}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <>
              <div className="max-h-[70vh] overflow-y-auto pr-4">
                {/* --- START OF MOBILE FIX 3: Dialog grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* --- END OF MOBILE FIX 3 --- */}
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

      {/* Delete Confirmation Dialog (No changes needed) */}
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