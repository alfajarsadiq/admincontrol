// File: LrGeneratorPage.tsx

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  Printer,
  ChevronsUpDown,
  Check,
  Plus,
  Eye,
  Loader2,
  Trash,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
// --- 1. IMPORT THE NEW API FUNCTION ---
import { deleteLr } from "@/lib/api"; // Make sure your api.ts exports this
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

// --- (Type Definitions are unchanged) ---
interface IAddedItem {
  id: number;
  no: number;
  name: string;
  units: string;
  qty: string;
}

interface IRecentLr {
  _id: string;
  lrId: string;
  driverName: string;
  vehicleNo: string;
  deliveryLocation: string;
  lrDate: string;
  items: IAddedItem[];
  createdAt: string;
}

interface IProductItem {
  value: string;
  label: string;
  units: string;
}

// --- (Combobox component is unchanged) ---
const Combobox = ({ items, value, onSelect, placeholder }: {
  items: IProductItem[],
  value: string,
  onSelect: (value: string) => void,
  placeholder: string
}) => {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find((item) => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white hover:bg-white"
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search item..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={(currentValue) => {
                    const selectedItem = items.find(
                      (i) => i.label.toLowerCase() === currentValue.toLowerCase()
                    );
                    const valueToSet = selectedItem ? selectedItem.value : "";
                    
                    onSelect(valueToSet === value ? "" : valueToSet);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- (LrView component is unchanged) ---
const LrView = ({ lr }: { lr: IRecentLr | null }) => {
  if (!lr) return null;
  const itemsHtml = lr.items
    .map(
      (item) => `
    <tr>
        <td class="border border-gray-400 p-3 text-sm">${item.no}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.name}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.units}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.qty}</td>
    </tr>
  `
    )
    .join("");
  const emptyRowsHtml = Array(5 - lr.items.length > 0 ? 5 - lr.items.length : 0)
    .fill('<tr><td class="border border-gray-400 p-3 h-10">&nbsp;</td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td></tr>')
    .join('');
  const formattedDate = lr.lrDate
    ? new Date(lr.lrDate).toLocaleString("en-GB")
    : "";
  const htmlTemplate = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Poppins', sans-serif; background-color: #f9fafb; }
    </style>
    <div class="max-w-4xl mx-auto bg-amber-50 p-8 sm:p-12 rounded-lg shadow-lg my-8">
        <header class="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-gray-300">
            <div>
                <img src="https://ferrarifoods.com/logo.png" alt="Ferrari Foods LLC Logo" class="h-20" onerror="this.src='https://placehold.co/200x80/FAF3E0/333?text=FERRARI+FOODS'; this.onerror=null;">
            </div>
            <div class="text-xs text-gray-700 text-center sm:text-right">
                <h2 class="font-bold text-base text-black">FERRARI FOODS LLC DUBAI</h2>
                <p>+971 585639040</p>
                <p>info@ferrarifoods.com</p>
                <p>www.ferrarifoods.com</p>
            </div>
        </header>
        <div class="text-center my-8">
            <h1 class="text-3xl font-bold text-gray-800 tracking-wide">LR FORM</h1>
        </div>
        <section class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            <div class="flex items-center border-b border-gray-400 py-2">
                <label class="font-semibold text-gray-700 w-32 shrink-0">DRIVER NAME:</label>
                <span class="p-1">${lr.driverName || "&nbsp;"}</span>
            </div>
            <div class="flex items-center border-b border-gray-400 py-2">
                <label class="font-semibold text-gray-700 w-32 shrink-0">VEHICLE NO:</label>
                <span class="p-1">${lr.vehicleNo || "&nbsp;"}</span>
            </div>
            <div class="flex items-center border-b border-gray-400 py-2">
                <label class="font-semibold text-gray-700 w-32 shrink-0">DELIVERY LOCATION:</label>
                <span class="p-1">${lr.deliveryLocation || "&nbsp;"}</span>
            </div>
            <div class="flex items-center border-b border-gray-400 py-2">
                <label class="font-semibold text-gray-700 w-32 shrink-0">DATE / TIME:</label>
                <span class="p-1">${formattedDate || "&nbsp;"}</span>
            </div>
        </section>
        <section class="mb-10">
            <div class="overflow-x-auto">
                <table class="w-full min-w-[600px] border-collapse border border-gray-400">
                    <thead class="bg-gray-200">
                        <tr>
                            <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">NO</th>
                            <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">ITEMS</th>
                            <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">UNITS</th>
                            <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">QTY</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white">
                        ${itemsHtml}
                        ${emptyRowsHtml}
                    </tbody>
                </table>
            </div>
        </section>
        <footer class="pt-8">
            <p class="text-sm text-gray-700 mb-12">Item is received in good condition and received by:</p>
            <div class="border-t border-gray-400 pt-2 w-1/2 sm:w-1/3">
                <p class="font-semibold text-gray-800">Signature</p>
            </div>
        </footer>
    </div>
  `;
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlTemplate }} />
  );
};


// --- Main Page Component ---
export const LrGeneratorPage = () => {
  const [items, setItems] = useState<IProductItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // ... (other states are unchanged) ...
  const [driverName, setDriverName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [selectedItemValue, setSelectedItemValue] = useState("");
  const [units, setUnits] = useState("");
  const [quantity, setQuantity] = useState("");
  const [addedItems, setAddedItems] = useState<IAddedItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnits, setNewItemUnits] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [recentLrs, setRecentLrs] = useState<IRecentLr[]>([]);
  const [isLoadingRecentLrs, setIsLoadingRecentLrs] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLr, setSelectedLr] = useState<IRecentLr | null>(null);
  
  // --- (Delete states are unchanged) ---
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [lrToDeleteId, setLrToDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // --- (fetchRecentLrs, resetDateTime, fetchProducts useEffect, etc... are unchanged) ---
  const fetchRecentLrs = async () => {
    setIsLoadingRecentLrs(true);
    try {
      const { data } = await api.get('/lrs');
      setRecentLrs(data);
    } catch (error) {
      console.error("Failed to fetch recent LRs", error);
    } finally {
      setIsLoadingRecentLrs(false);
    }
  };
  
  const resetDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDateTime(now.toISOString().slice(0, 16));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingItems(true);
      try {
        const { data } = await api.get('/products');
        if (Array.isArray(data)) {
          const transformedItems = data.map((product: any) => ({
            value: product._id,
            label: product.name,
            units: product.defaultUnits,
          }));
          setItems(transformedItems);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products.");
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchProducts();
    fetchRecentLrs();
  }, []);

  useEffect(() => {
    resetDateTime();
  }, []);

  useEffect(() => {
    if (selectedItemValue) {
      const item = items.find((i) => i.value === selectedItemValue);
      setUnits(item ? item.units : "");
    } else {
      setUnits("");
    }
  }, [selectedItemValue, items]);

  // --- (handleAddItem, handleRemoveItem, handleSaveNewItem, handleViewLr are unchanged) ---
  const handleAddItem = () => {
    if (!selectedItemValue || !quantity || !units) {
      toast.error("Please select an item, units, and quantity.");
      return;
    }
    const item = items.find((i) => i.value === selectedItemValue);
    if (!item) {
       toast.error("Selected item not found.");
       return;
    }
    const newItem = {
      id: Date.now(),
      no: addedItems.length + 1,
      name: item.label,
      units: units,
      qty: quantity,
    };
    setAddedItems([...addedItems, newItem]);
    toast.success(`${item.label} added to list.`);
    setSelectedItemValue("");
    setUnits("");
    setQuantity("");
  };

  const handleRemoveItem = (id: number) => {
    setAddedItems(
      addedItems.filter((item) => item.id !== id).map((item, index) => ({ ...item, no: index + 1 }))
    );
    toast.info("Item removed from list.");
  };

  const handleSaveNewItem = async () => {
    if (!newItemName || !newItemUnits) {
      toast.error("Please enter both a product name and default units.");
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await api.post(
        '/products',
        { name: newItemName, defaultUnits: newItemUnits }
      );
      const newItem: IProductItem = {
        value: data._id,
        label: data.name,
        units: data.defaultUnits,
      };
      setItems(prevItems => [...prevItems, newItem].sort((a, b) => a.label.localeCompare(b.label)));
      toast.success(`Product "${data.name}" created successfully!`);
      setIsDialogOpen(false);
      setNewItemName("");
      setNewItemUnits("");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create product.";
      console.error("Error saving new item:", error);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewLr = (lr: IRecentLr) => {
    setSelectedLr(lr);
    setIsViewOpen(true);
  };
  
  // --- (Delete handlers are unchanged) ---
  const handleConfirmDelete = async () => {
    if (!lrToDeleteId) return;

    if (!deletePassword) {
      toast.error("Please enter the admin password.");
      return;
    }

    setIsDeleting(true);
    try {
      // Use the new api.ts function
      await deleteLr(lrToDeleteId, deletePassword);
      
      setRecentLrs(prevLrs => prevLrs.filter(lr => lr._id !== lrToDeleteId));
      toast.success("LR record deleted successfully.");
      
      // Close and reset the dialog
      setIsDeleteAlertOpen(false);
      setLrToDeleteId(null);
      setDeletePassword("");

    } catch (error: any) {
      console.error("Failed to delete LR:", error);
      // Show the specific error from the backend (e.g., "Password is incorrect")
      toast.error(error.response?.data?.message || "Failed to delete LR record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (lr: IRecentLr) => {
    setLrToDeleteId(lr._id);
    setIsDeleteAlertOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setIsDeleteAlertOpen(false);
    setLrToDeleteId(null);
    setDeletePassword(""); // Clear password on close
  }

  // --- (handleGeneratePdf is unchanged) ---
  const handleGeneratePdf = async () => {
    const lrId = `LR-${Date.now().toString().slice(-6)}`;
    const lrData = {
      lrId,
      driverName,
      vehicleNo,
      deliveryLocation,
      lrDate: dateTime,
      items: addedItems,
    };
    
    try {
      await api.post('/lrs', lrData);
      toast.success(`LR #${lrId} saved.`);
      fetchRecentLrs();
    } catch (error: any) {
      console.error("Failed to save LR:", error);
      toast.error(error.response?.data?.message || "Failed to save LR record. PDF will still be generated.");
    }

    const itemsHtml = addedItems
      .map(
        (item) => `
      <tr>
        <td class="border border-gray-400 p-3 text-sm">${item.no}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.name}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.units}</td>
        <td class="border border-gray-400 p-3 text-sm">${item.qty}</td>
      </tr>
    `
      )
      .join("");
    const emptyRowsHtml = Array(5 - addedItems.length > 0 ? 5 - addedItems.length : 0)
      .fill('<tr><td class="border border-gray-400 p-3 h-10">&nbsp;</td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td></tr>')
      .join('');
    const formattedDate = dateTime
      ? new Date(dateTime).toLocaleString("en-GB")
      : "";
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ferrari Foods - LR Form</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Poppins', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .printable-bg { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .pdf-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; }
              table, th, td { border-color: #9ca3af !important; }
          </style>
      </head>
      <body class="bg-gray-100">
          <div class="pdf-container printable-bg rounded-lg shadow-lg">
              <header class="flex flex-row justify-between items-center pb-8 border-b border-gray-300">
                  <div>
                      <img src="https://ferrarifoods.com/logo.png" alt="Ferrari Foods LLC Logo" class="h-20" onerror="this.src='https://placehold.co/200x80/FAF3E0/333?text=FERRARI+FOODS'; this.onerror=null;">
                  </div>
                  <div class="text-xs text-gray-700 text-right">
                      <h2 class="font-bold text-base text-black">FERRARI FOODS LLC DUBAI</h2>
                      <p>+971 585639040</p>
                      <p>info@ferrarifoods.com</p>
                      <p>www.ferrarifoods.com</p>
                  </div>
              </header>
              <div class="text-center my-8">
                  <h1 class="text-3xl font-bold text-gray-800 tracking-wide">LR FORM</h1>
              </div>
              <section class="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                  <div class="flex items-center border-b border-gray-400 py-2">
                      <label class="font-semibold text-gray-700 w-32 shrink-0">DRIVER NAME:</label>
                      <span class="p-1">${driverName || "&nbsp;"}</span>
                  </div>
                  <div class="flex items-center border-b border-gray-400 py-2">
                      <label class="font-semibold text-gray-700 w-32 shrink-0">VEHICLE NO:</label>
                      <span class="p-1">${vehicleNo || "&nbsp;"}</span>
                  </div>
                  <div class="flex items-center border-b border-gray-400 py-2">
                      <label class="font-semibold text-gray-700 w-32 shrink-0">DELIVERY LOCATION:</label>
                      <span class="p-1">${deliveryLocation || "&nbsp;"}</span>
                  </div>
                  <div class="flex items-center border-b border-gray-400 py-2">
                      <label class="font-semibold text-gray-700 w-32 shrink-0">DATE / TIME:</label>
                      <span class="p-1">${formattedDate || "&nbsp;"}</span>
                  </div>
              </section>
              <section class="mb-10">
                  <div class="overflow-x-auto">
                      <table class="w-full min-w-[600px] border-collapse border border-gray-400">
                          <thead class="bg-gray-200">
                              <tr>
                                  <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">NO</th>
                                  <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">ITEMS</th>
                                  <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">UNITS</th>
                                  <th class="border border-gray-400 p-3 text-left text-sm font-bold text-gray-700 uppercase">QTY</th>
                              </tr>
                          </thead>
                          <tbody class="bg-white">
                              ${itemsHtml}
                              ${emptyRowsHtml}
                          </tbody>
                      </table>
                  </div>
              </section>
              <footer class="pt-8">
                  <p class="text-sm text-gray-700 mb-12">Item is received in good condition and received by:</p>
                  <div class="border-t border-gray-400 pt-2 w-1/2 sm:w-1/3">
                      <p class="font-semibold text-gray-800">Signature</p>
                  </div>
              </footer>
          </div>
      </body>
      </html>
    `;
    var opt = {
      margin: 0,
      filename: `LR_Form_${driverName || "Details"}_${formattedDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt as any).from(htmlTemplate).save();
    setDriverName("");
    setVehicleNo("");
    setDeliveryLocation("");
    setAddedItems([]);
    resetDateTime();
    toast.info("Form cleared for next entry.");
  };

  // --- JSX Rendering ---
  return (
    // --- START OF FIX 1: Reduced padding for mobile ---
    <div className="p-4 md:p-8 space-y-6 bg-muted/40 min-h-screen">
    {/* --- END OF FIX 1 --- */}
      <h1 className="text-3xl font-bold">LR Form Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* --- (LR Details Card is unchanged, it stacks fine on mobile) --- */}
          <Card>
            <CardHeader>
              <CardTitle>LR Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input id="driverName" placeholder="Enter driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleNo">Vehicle No</Label>
                  <Input id="vehicleNo" placeholder="Enter vehicle number" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Delivery Location</Label>
                  <Input id="deliveryLocation" placeholder="Enter delivery location" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTime">Date / Time</Label>
                  <Input id="dateTime" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- START OF FIX 2: Optimized "Add Items" Card --- */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                {/* Item combobox now spans full width on medium screens */}
                <div className="space-y-2 md:col-span-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="item">Item</Label>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary px-2">
                          <Plus className="mr-1 h-4 w-4" />
                          Add New Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                          <DialogDescription>Add a new product to the items list.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-item-name" className="text-right">Product Name</Label>
                            <Input id="new-item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="col-span-3" placeholder="e.g., Al Ain Water" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-item-units" className="text-right">Default Units</Label>
                            <Input id="new-item-units" value={newItemUnits} onChange={(e) => setNewItemUnits(e.target.value)} className="col-span-3" placeholder="e.g., 500 ML" />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                          </DialogClose>
                          <Button type="button" onClick={handleSaveNewItem} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Item"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Combobox items={items} value={selectedItemValue} onSelect={setSelectedItemValue} placeholder={isLoadingItems ? "Loading items..." : "Select item..."} />
                </div>

                {/* Units input */}
                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Input id="units" placeholder="Enter units" value={units} onChange={(e) => setUnits(e.target.value)} />
                </div>

                {/* Quantity input */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>

                {/* Add Item Button - now in the grid flow */}
                <div className="space-y-2">
                  {/* This invisible label helps align the button with the inputs on md+ screens */}
                  <Label htmlFor="add-item-btn" className="invisible hidden md:block">Add</Label>
                  <Button id="add-item-btn" onClick={handleAddItem} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
          {/* --- END OF FIX 2 --- */}


          {/* --- (Recent LRs Card is unchanged, table has overflow-x-auto) --- */}
          <Card>
            <CardHeader>
              <CardTitle>Recent LR Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LR ID</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRecentLrs ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <div className="flex justify-center items-center py-4">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading recent LRs...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : recentLrs.length > 0 ? (
                      recentLrs.map((lr) => (
                        <TableRow key={lr._id}>
                          <TableCell className="font-medium">{lr.lrId}</TableCell>
                          <TableCell>{lr.driverName || "N/A"}</TableCell>
                          <TableCell>{new Date(lr.lrDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewLr(lr)}>
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              disabled={isDeleting}
                              onClick={() => openDeleteDialog(lr)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No recent LRs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- (Added Items Card is unchanged, table has overflow-x-auto) --- */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Added Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Act</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addedItems.length > 0 ? (
                      addedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.no}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.units}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGeneratePdf} className="w-full" disabled={addedItems.length === 0}>
                <Printer className="mr-2 h-4 w-4" />
                Generate LR PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* --- (View LR Dialog is unchanged) --- */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <LrView lr={selectedLr} />
        </DialogContent>
      </Dialog>
      
      {/* --- (Delete Dialog is unchanged) --- */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              To delete this LR, please enter the admin password. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="delete-password">Admin Password</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Enter admin password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LrGeneratorPage;