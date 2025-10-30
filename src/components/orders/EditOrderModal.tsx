// File: src/components/orders/EditOrderModal.tsx (Cleaned Up)

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Assuming these imports are available ---
// NOTE: ConfirmedOrder now includes itemId in its item sub-type.
import { ConfirmedOrder, OrderItem, Salesperson } from "@/types"; 
import { Product, fetchProducts, fetchSalespersons, updateOrder, UpdateOrderPayload } from "@/lib/api";

// Local Item State Structure
// NOTE: We rely on the updated ConfirmedOrder type now.
interface EditableItem extends OrderItem {
  id: number; // Used for local keying (Date.now() or similar)
  itemId: string; // The Product's MongoDB ID (must be a string for update payload)
}

interface EditOrderModalProps {
  order: ConfirmedOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  // --- State for Modal Fields ---
  const [salespersonPassword, setSalespersonPassword] = useState("");
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedDeliveryDate, setEditedDeliveryDate] = useState("");
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  
  // --- State for adding a new item ---
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // --- Load Products and Salespersons for the select dropdowns ---
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: allSalespersons = [] } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: fetchSalespersons,
  });
  
  // Initialize state when the order prop changes (i.e., when the modal opens)
  useEffect(() => {
    if (order) {
      setEditedCompanyName(order.companyName);
      setEditedDeliveryDate(order.deliveryDate || "");
      
      // Map the ConfirmedOrder items to local state
      // This is now clean because ConfirmedOrder item structure has itemId
      const initialItems: EditableItem[] = order.items
        .map((item, index) => ({
            // This is safe now, as item.itemId is guaranteed by the updated ConfirmedOrder type
            id: Date.now() + index, 
            itemId: item.itemId, 
            name: item.name,
            qty: item.qty,
        }));
        
      setEditedItems(initialItems);
      setSalespersonPassword(""); // Reset password on open
    } else {
        setEditedItems([]);
    }
  }, [order]);
  
  // --- Mutation Hook for Order Update ---
  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: (data) => {
      toast.success(data.msg, {
        description: `Order ID: ${order?.orderId} was successfully modified.`,
      });
      // Invalidate the recentOrders cache to refresh the table
      queryClient.invalidateQueries({ queryKey: ["recentOrders"] });
      
      // Close all modals and reset state
      setIsPasswordModalOpen(false);
      onClose();
    },
    onError: (error: any) => {
      // The interceptor returns the error message in the Error object
      toast.error("Update Failed", {
        description: error.message || "An unexpected error occurred during update.",
      });
      // Important: Only reset password, keep the form open for retry
      setSalespersonPassword("");
    },
  });

  // --- Handlers ---

  const handleAddItem = () => {
    if (!selectedProductId || itemQty <= 0) {
      toast.error("Invalid Item", { description: "Select an item and enter a valid quantity." });
      return;
    }
    const product = allProducts.find((p) => p._id === selectedProductId);
    if (!product) return;

    const newItem: EditableItem = {
      id: Date.now(), // Unique ID for React list key
      itemId: product._id,
      name: product.name,
      qty: itemQty,
    };
    
    setEditedItems((prev) => [...prev, newItem]);
    setSelectedProductId("");
    setItemQty(1);
    toast.success(`${product.name} added!`);
  };

  const handleRemoveItem = (id: number) => {
    setEditedItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removed");
  };

  const handleQuantityChange = (id: number, newQty: number) => {
    if (newQty <= 0) return;
    setEditedItems((prev) => 
        prev.map(item => item.id === id ? { ...item, qty: newQty } : item)
    );
  };

  const handleConfirmEditClick = () => {
    if (!order) return;
    if (editedItems.length === 0) {
        toast.error("Cannot confirm edit", { description: "The order must contain at least one item." });
        return;
    }
    // Open the password verification step
    setIsPasswordModalOpen(true);
  };

  const handlePasswordVerify = () => {
    if (!order) return;
    if (!salespersonPassword) {
      toast.error("Password required", { description: "Please enter the salesperson's password." });
      return;
    }

    const payload: UpdateOrderPayload = {
      salespersonName: order.salesperson, // Use the original salesperson name for verification
      salespersonPassword: salespersonPassword,
      companyName: editedCompanyName,
      deliveryDate: editedDeliveryDate,
      
      // Map local items to backend-expected format { itemId, qty }
      updatedItems: editedItems.map(item => ({
        itemId: item.itemId,
        qty: item.qty,
      })),
    };

    updateMutation.mutate({ orderId: order.orderId, payload });
  };

  if (!order) return null;

  // Find the selected product name for display
  const currentProduct = allProducts.find(p => p._id === selectedProductId);


  return (
    <>
      {/* Main Edit Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
          // If closing the main dialog, also close the nested password dialog
          if (!open) {
            setIsPasswordModalOpen(false);
            onClose();
          }
        }}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Edit Order: {order.orderId}</DialogTitle>
            <DialogDescription>
              Modify products, quantities, and delivery details. Salesperson authentication is required to confirm changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-0">
            {/* Column 1: Order Meta Details */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Order Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="salesperson">Salesperson (Non-editable)</Label>
                <Input id="salesperson" value={order.salesperson} readOnly className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={editedCompanyName}
                  onChange={(e) => setEditedCompanyName(e.target.value)}
                  placeholder="Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-date">Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={editedDeliveryDate}
                  onChange={(e) => setEditedDeliveryDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-700">Add New Item</h3>
                  <div className="space-y-2">
                    <Label htmlFor="add-item-select">Product</Label>
                    <Select
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                      disabled={!allProducts.length}
                    >
                      <SelectTrigger id="add-item-select">
                        <SelectValue placeholder="Select product to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allProducts.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-item-qty">Quantity</Label>
                    <Input
                      id="add-item-qty"
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
              </div>
            </div>

            {/* Column 2 & 3: Item List */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Current Order Items ({editedItems.length})</h3>
              <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 sticky top-0">
                      <TableHead className="w-[50%]">Item Name</TableHead>
                      <TableHead className="w-[30%]">Qty</TableHead>
                      <TableHead className="w-[20%] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No items added.
                        </TableCell>
                      </TableRow>
                    ) : (
                      editedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                              className="w-20 text-right h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="pt-4 border-t">
                  <Button 
                      onClick={handleConfirmEditClick} 
                      className="w-full"
                      disabled={editedItems.length === 0 || updateMutation.isPending}
                  >
                      Confirm Changes
                  </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Nested Password Verification Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authenticate Order Edit</DialogTitle>
            <DialogDescription>
              Please enter the password for **{order.salesperson}** to authorize and confirm these changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Password
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={salespersonPassword}
                onChange={(e) => setSalespersonPassword(e.target.value)}
                className="col-span-3"
                placeholder="Enter salesperson password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordVerify();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
                setSalespersonPassword("");
                setIsPasswordModalOpen(false);
            }}>
              Back to Edit
            </Button>
            <Button onClick={handlePasswordVerify} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Verify and Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
