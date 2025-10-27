// src/pages/OrderPage.tsx
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle, ShoppingCart, Loader2, Building } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- 1. IMPORT THE CORRECT FUNCTION NAME ---
import {
  fetchProducts, // Changed from fetchItems
  saveOrder,
  fetchCompanies,
  saveCompany,
  fetchSalespersons,
  Product, // Import the Product type if it's defined in api.ts or types.ts
} from "@/lib/api";

import {
  // Item, // We might use Product type now
  OrderItem,
  NewOrderPayload,
  Company,
  NewCompanyPayload,
  Salesperson,
} from "@/types";

import { RecentOrders } from "@/components/RecentOrders";


const OrderPage: React.FC = () => {
  const queryClient = useQueryClient();

  // --- 2. UPDATE useQuery TO USE fetchProducts ---
  // Also update the expected type from Item[] to Product[]
  const {
    data: products = [], // Renamed from items to products
    isLoading: isLoadingProducts, // Renamed from isLoadingItems
    error: productsError, // Renamed from itemsError
  } = useQuery<Product[]>({ // Expect Product type
    queryKey: ["products"], // Changed queryKey for consistency
    queryFn: fetchProducts, // Use the correct function
  });

  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const {
    data: salespersons = [],
    isLoading: isLoadingSalespersons,
    error: salespersonsError,
  } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: fetchSalespersons,
  });

  const orderMutation = useMutation({
    mutationFn: saveOrder,
    onSuccess: (data) => {
      toast.success("Order Confirmed!", {
        description: `Order ID: ${data.orderId} has been submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["recentOrders"] });
      setSalesperson("");
      setSelectedCompanyId("");
      setCompanyName("");
      setCompanyNumber("");
      setDeliveryDate("");
      setDeliveryLocation("");
      setAddedItems([]);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
    },
    onError: (error: any) => {
      toast.error("Failed to save order", {
        description: error.response?.data?.msg || error.message,
      });
    },
  });

  const companyMutation = useMutation({
    mutationFn: saveCompany,
    onSuccess: (newCompany) => {
      toast.success("Company Added!", {
        description: `${newCompany.name} has been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      handleCompanySelect(newCompany.id);
      setIsCompanyModalOpen(false);
      // Reset company form fields
      setNewCompanyName("");
      setNewCompanyNumber("");
      setNewCompanyLocation("");
    },
    onError: (error: any) => {
      toast.error("Failed to save company", {
        description: error.response?.data?.msg || error.message,
      });
    },
  });

  const [salesperson, setSalesperson] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [addedItems, setAddedItems] = useState<OrderItem[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyNumber, setNewCompanyNumber] = useState("");
  const [newCompanyLocation, setNewCompanyLocation] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
  }, []);

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setSelectedCompanyId(company.id);
      setCompanyName(company.name);
      setCompanyNumber(company.number);
      setDeliveryLocation(company.location);
    } else {
      setSelectedCompanyId("");
      setCompanyName("");
      setCompanyNumber("");
      setDeliveryLocation("");
    }
  };

  const handleSaveCompany = () => {
    if (!newCompanyName) {
      toast.error("Company name is required.");
      return;
    }
    const payload: NewCompanyPayload = {
      name: newCompanyName,
      number: newCompanyNumber,
      location: newCompanyLocation,
    };
    companyMutation.mutate(payload);
  };

  const handleAddItem = () => {
    if (!selectedItemId || itemQty <= 0) {
      toast.error("Invalid Item", {
        description: "Please select an item and enter a valid Qty.",
      });
      return;
    }
    // --- 3. Find product using _id ---
    const product = products.find((p) => p._id === selectedItemId); // Use _id
    if (!product) return;
    const newItem: OrderItem = {
      id: Date.now(), // Keep using Date.now() for unique key in the list
      itemId: product._id, // Use _id from product
      name: product.name,
      qty: itemQty,
    };
    setAddedItems([...addedItems, newItem]);
    toast.success("Item added successfully");
    setSelectedItemId("");
    setItemQty(1);
  };

  const handleRemoveItem = (id: number) => {
    setAddedItems(addedItems.filter((item) => item.id !== id));
    toast.success("Item removed");
  };

  const handleConfirmOrder = () => {
    if (addedItems.length === 0) {
      toast.error("Empty Order", { description: "Please add at least one item." });
      return;
    }
    if (!companyName) {
      toast.error("Invalid Order", { description: "Please select a company." });
      return;
    }
    if (!salesperson) {
      toast.error("Invalid Order", { description: "Please select a salesperson." });
      return;
    }
    setIsPasswordModalOpen(true);
  };

  const handlePasswordVerify = () => {
    const newOrderPayload: NewOrderPayload = {
      salesperson,
      salespersonPassword: passwordInput,
      companyName,
      companyNumber,
      currentDate,
      deliveryDate,
      deliveryLocation,
      items: addedItems.map((item) => ({
        itemId: item.itemId, // Should be the product's _id
        qty: item.qty,
      })),
    };
    orderMutation.mutate(newOrderPayload);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <ShoppingCart className="w-8 h-8" />
        Create New Order
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesperson">Salesperson Name</Label>
                <Select
                  value={salesperson}
                  onValueChange={setSalesperson}
                  disabled={isLoadingSalespersons || !!salespersonsError}
                >
                  <SelectTrigger id="salesperson">
                    <SelectValue placeholder={
                      isLoadingSalespersons
                        ? "Loading..."
                        : salespersonsError
                        ? "Error loading"
                        : "Select a salesperson"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {salespersons.map((sp) => (
                      <SelectItem key={sp.id} value={sp.name}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCompanyId}
                    onValueChange={handleCompanySelect}
                    disabled={isLoadingCompanies || !!companiesError}
                  >
                    <SelectTrigger id="company-name">
                      <SelectValue
                        placeholder={
                          isLoadingCompanies
                            ? "Loading companies..."
                            : companiesError
                            ? "Error loading"
                            : "Select a company..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog
                    open={isCompanyModalOpen}
                    onOpenChange={setIsCompanyModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Add New Company"
                      >
                        <Building className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Company</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="new-company-name"
                            className="text-right"
                          >
                            Name
                          </Label>
                          <Input
                            id="new-company-name"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            className="col-span-3"
                            placeholder="Enter company name"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="new-company-number"
                            className="text-right"
                          >
                            Number
                          </Label>
                          <Input
                            id="new-company-number"
                            value={newCompanyNumber}
                            onChange={(e) =>
                              setNewCompanyNumber(e.target.value)
                            }
                            className="col-span-3"
                            placeholder="Enter company number"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="new-company-location"
                            className="text-right"
                          >
                            Location
                          </Label>
                          <Input
                            id="new-company-location"
                            value={newCompanyLocation}
                            onChange={(e) =>
                              setNewCompanyLocation(e.target.value)
                            }
                            className="col-span-3"
                            placeholder="Enter delivery location"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          onClick={handleSaveCompany}
                          disabled={companyMutation.isPending}
                        >
                          {companyMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Save Company
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-number">Company Number</Label>
                <Input
                  id="company-number"
                  placeholder="Auto-filled from company"
                  value={companyNumber}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-location">Delivery Location</Label>
                <Input
                  id="delivery-location"
                  placeholder="Auto-filled from company"
                  value={deliveryLocation}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-date">Current Date</Label>
                <Input
                  id="current-date"
                  type="date"
                  value={currentDate}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="item-select">Item</Label>
                  <Select
                    value={selectedItemId}
                    onValueChange={setSelectedItemId}
                    disabled={isLoadingProducts || !!productsError} // Use renamed state
                  >
                    <SelectTrigger id="item-select">
                      <SelectValue
                        placeholder={
                          isLoadingProducts // Use renamed state
                            ? "Loading items..."
                            : productsError // Use renamed state
                            ? "Error loading items"
                            : "Select an item..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {/* --- 4. Map over products using _id --- */}
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-qty">Qty</Label>
                  <Input
                    id="item-qty"
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddItem}
                className="w-full md:w-auto"
                disabled={isLoadingProducts || !!productsError} // Use renamed state
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Added Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Act</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addedItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      addedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>
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
              <div className="border-t mt-4 pt-4 space-y-3">
                <Button
                  onClick={handleConfirmOrder}
                  className="w-full"
                  size="lg"
                  variant="default"
                  disabled={
                    addedItems.length === 0 || orderMutation.isPending
                  }
                >
                  {orderMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  {orderMutation.isPending ? "Saving..." : "Confirm Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <RecentOrders />
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Order Authentication</DialogTitle>
            <DialogDescription>
              Please enter the password for <strong>{salesperson || '...'}</strong> to confirm this order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
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
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setPasswordInput("")}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handlePasswordVerify} disabled={orderMutation.isPending}>
              {orderMutation.isPending ? "Verifying..." : "Verify and Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderPage;