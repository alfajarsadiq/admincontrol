// File: src/pages/OrderFormGeneratorPage.tsx

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  Printer,
  ChevronsUpDown,
  Check,
  Loader2,
  Eye,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";
import api, { deleteOrderForm } from "@/lib/api";
import { toast } from "sonner";
import { IRecentOrderForm, IAddedItem } from "@/types";
import { RecentOrderFormsList } from "@/components/invoices/RecentInvoicesList"; // Assuming component file was renamed too

// --- Type Definitions ---
interface ICompanyDetails {
  name: string;
  number: string;
  mail: string;
  website: string;
  logo: string;
}
interface IProductItem {
  value: string; // product._id
  label: string; // product.name
  units: string; // product.defaultUnits
}

// --- Company Data ---
const companyDetails: Record<string, ICompanyDetails> = {
  ferrari: {
    name: "Ferrari Foods LLC",
    number: "+971 45529208",
    mail: "info@ferrarifoods.com",
    website: "www.ferrarifoods.com",
    logo: "https://ferrarifoods.com/logo.png",
  },
  alfajar: {
    name: "Al Fajar Al Sadiq General Trading LLC",
    number: "+971 558867751",
    mail: "info@alfajaralsadiq.com",
    website: "www.alfajaralsadiq.com",
    logo: "https://ferrarifoods.com/alfajar-logo.png",
  },
};

// --- Combobox Component ---
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

// --- OrderFormView Component ---
const OrderFormView = ({ form }: { form: IRecentOrderForm | null }) => {
  if (!form) return null;
  const companyKey = Object.keys(companyDetails).find(
    key => companyDetails[key].name === form.companyName
  ) || 'ferrari';
  const company = companyDetails[companyKey];
  const itemsHtml = form.items
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
  const emptyRowsHtml = Array(5 - form.items.length > 0 ? 5 - form.items.length : 0)
    .fill('<tr><td class="border border-gray-400 p-3 h-10">&nbsp;</td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td><td class="border border-gray-400 p-3"></td></tr>')
    .join('');
  const formattedDate = form.formDate
    ? new Date(form.formDate).toLocaleString("en-GB")
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
                 <img src="${company.logo}" alt="${company.name} Logo" class="h-20" onerror="this.src='https://placehold.co/200x80/FAF3E0/333?text=${encodeURIComponent(company.name)}'; this.onerror=null;">
            </div>
            <div class="text-xs text-gray-700 text-center sm:text-right">
                <h2 class="font-bold text-base text-black">${company.name}</h2>
                <p>${company.number}</p>
                <p>${company.mail}</p>
                <p>${company.website}</p>
            </div>
        </header>
        <div class="text-center my-8">
            <h1 class="text-3xl font-bold text-gray-800 tracking-wide">ORDER FORM</h1>
        </div>
        <section class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            <div class="flex items-center border-b border-gray-400 py-2">
                <label class="font-semibold text-gray-700 w-32 shrink-0">FORM ID:</label>
                <span class="p-1">${form.formId || "&nbsp;"}</span>
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
export const OrderFormGeneratorPage = () => {
  // State
  const [products, setProducts] = useState<IProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCompanyKey, setSelectedCompanyKey] = useState("ferrari");
  const [dateTime, setDateTime] = useState("");
  const [selectedItemValue, setSelectedItemValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [addedItems, setAddedItems] = useState<IAddedItem[]>([]);
  const [recentOrderForms, setRecentOrderForms] = useState<IRecentOrderForm[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrderForm, setSelectedOrderForm] = useState<IRecentOrderForm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<IRecentOrderForm | null>(null);


  // --- Data Fetching ---
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data } = await api.get('/products');
      if (Array.isArray(data)) {
        const transformedItems = data.map((product: any) => ({
          value: product._id,
          label: product.name,
          units: product.defaultUnits,
        }));
        setProducts(transformedItems);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchRecentOrderForms = async () => {
    setIsLoadingRecent(true);
    try {
      const { data } = await api.get('/invoices'); // API endpoint is still /invoices
      setRecentOrderForms(data);
    } catch (error) {
      console.error("Failed to fetch recent order forms", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const resetDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDateTime(now.toISOString().slice(0, 16));
  };

  useEffect(() => {
    fetchProducts();
    fetchRecentOrderForms();
    resetDateTime();
  }, []);

  // --- Event Handlers ---
  const handleAddItem = () => {
    if (!selectedItemValue || !quantity) {
      toast.error("Please select an item and quantity.");
      return;
    }
    const product = products.find((i) => i.value === selectedItemValue);
    if (!product) {
       toast.error("Selected item not found.");
       return;
    }
    const isOil = product.label.toLowerCase().includes("oil");
    const displayUnits = isOil ? "TIN" : "Bags";
    const newItem: IAddedItem = {
      id: Date.now(),
      no: addedItems.length + 1,
      name: product.label,
      qty: quantity,
      units: displayUnits,
      originalUnits: product.units,
    };
    setAddedItems([...addedItems, newItem]);
    toast.success(`${product.label} added to form.`);
    setSelectedItemValue("");
    setQuantity("");
  };

  const handleRemoveItem = (id: number) => {
    setAddedItems(
      addedItems.filter((item) => item.id !== id).map((item, index) => ({ ...item, no: index + 1 }))
    );
    toast.info("Item removed from list.");
  };

  const handleViewOrderForm = (form: IRecentOrderForm) => {
    setSelectedOrderForm(form);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (form: IRecentOrderForm) => {
    setFormToDelete(form);
    setIsDeleteAlertOpen(true);
  };

  const closeDeleteDialog = () => {
    setFormToDelete(null);
    setIsDeleteAlertOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!formToDelete) return;

    setIsDeleting(true);
    try {
      await deleteOrderForm(formToDelete._id);
      toast.success(`Order Form ${formToDelete.formId} deleted successfully.`);
      setRecentOrderForms(prev => prev.filter(form => form._id !== formToDelete._id));
      closeDeleteDialog();
    } catch (error: any) {
      console.error("Failed to delete order form:", error);
      toast.error(error.response?.data?.message || "Failed to delete order form.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- PDF Generation ---
  const handleGenerateOrderFormPdf = async () => {
    // --- START OF FIX (Fix 1) ---
    if (addedItems.length === 0) {
      toast.error("Please add at least one item to the form.");
      return;
    }
    if (!dateTime) {
      toast.error("Please select a date and time.");
      return;
    }
    // --- END OF FIX (Fix 1) ---

    const company = companyDetails[selectedCompanyKey];
    const formId = `FOM-${Date.now().toString().slice(-6)}`;
    const formData = {
      formId,
      companyName: company.name,
      formDate: dateTime,
      items: addedItems.map(item => ({
        no: item.no,
        name: item.name,
        qty: item.qty,
        units: item.units,
      })),
    };
    
    let saveSuccessful = false; // Flag to check if save worked
    try {
      await api.post('/invoices', formData);
      toast.success(`Order Form #${formId} saved.`);
      saveSuccessful = true; // Set flag on success
      // -- REMOVED fetchRecentOrderForms() from here --
    } catch (error: any) {
      console.error("Failed to save order form:", error);
      toast.error(error.response?.data?.message || "Failed to save order form. PDF will still be generated.");
      saveSuccessful = false; // Ensure flag is false on error
    }

    // --- PDF Generation Logic ---
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
          <title>${company.name} - Order Form</title>
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
                      <img src="${company.logo}" alt="${company.name} Logo" class="h-20" onerror="this.src='https://placehold.co/200x80/FAF3E0/333?text=${encodeURIComponent(company.name)}'; this.onerror=null;">
                  </div>
                  <div class="text-xs text-gray-700 text-right">
                      <h2 class="font-bold text-base text-black">${company.name}</h2>
                      <p>${company.number}</p>
                      <p>${company.mail}</p>
                      <p>${company.website}</p>
                  </div>
              </header>
              <div class="text-center my-8">
                  <h1 class="text-3xl font-bold text-gray-800 tracking-wide">ORDER FORM</h1>
              </div>
              <section class="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                  <div class="flex items-center border-b border-gray-400 py-2">
                      <label class="font-semibold text-gray-700 w-32 shrink-0">FORM ID:</label>
                      <span class="p-1">${formId || "&nbsp;"}</span>
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
      filename: `OrderForm_${formId}_${company.name}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Use a promise to know when PDF generation is done (or started)
    html2pdf().set(opt as any).from(htmlTemplate).save().then(() => {
        // Clear the form *after* PDF generation starts
        setAddedItems([]);
        resetDateTime();
        toast.info("Form cleared for next entry.");

        // --- THIS IS THE FIX ---
        // Fetch recent forms *after* clearing the form and showing the toast
        // This ensures the list updates even if the initial save failed
        fetchRecentOrderForms();
        // --- END FIX ---
    }).catch(pdfError => {
        // Handle potential PDF generation errors if necessary
        console.error("Error generating PDF:", pdfError);
        toast.error("Failed to generate PDF.");
        // Still try to fetch recent forms even if PDF fails
        fetchRecentOrderForms();
    });

  };

  // --- JSX Rendering ---
  return (
    <div className="p-6 md:p-8 space-y-6 bg-muted/40 min-h-screen">
      <h1 className="text-3xl font-bold">Order Form Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader><CardTitle>Order Form Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select value={selectedCompanyKey} onValueChange={setSelectedCompanyKey}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ferrari">Ferrari Foods LLC</SelectItem>
                      <SelectItem value="alfajar">Al Fajar Al Sadiq General Trading LLC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTime">Date / Time</Label>
                  <Input id="dateTime" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Items Card */}
          <Card>
            <CardHeader><CardTitle>Add Items</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="item">Item</Label>
                  <Combobox
                    items={products}
                    value={selectedItemValue}
                    onSelect={setSelectedItemValue}
                    placeholder={isLoadingProducts ? "Loading products..." : "Select item..."}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="md:col-start-3">
                  <Button onClick={handleAddItem} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Forms List */}
          <RecentOrderFormsList
            forms={recentOrderForms}
            isLoading={isLoadingRecent}
            onViewForm={handleViewOrderForm}
            onDeleteForm={openDeleteDialog}
            isDeleting={isDeleting}
          />

        </div>

        {/* Added Items Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex-1">
            <CardHeader><CardTitle>Added Items</CardTitle></CardHeader>
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
              <Button onClick={handleGenerateOrderFormPdf} className="w-full" disabled={addedItems.length === 0}>
                <Printer className="mr-2 h-4 w-4" />
                Generate Order Form PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* View Order Form Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <OrderFormView form={selectedOrderForm} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order form
              ({formToDelete?.formId}) from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</AlertDialogCancel>
            {/* --- START OF FIX (Fix 2) --- */}
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
            {/* --- END OF FIX (Fix 2) --- */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderFormGeneratorPage;