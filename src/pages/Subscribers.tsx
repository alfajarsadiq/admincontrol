// File: src/pages/Subscribers.tsx

import { useState, useEffect } from "react";
import { Search, Upload, Plus, Tag, ListFilter, X, Loader2, MoreVertical, Edit, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api"; 

const AVAILABLE_TAGS = [
  { value: "newsletter", label: "Newsletter" },
  { value: "test list", label: "Test List" },
  { value: "marketing", label: "Marketing" },
  { value: "promotions", label: "Promotions" },
  { value: "new customer", label: "New Customer" },
];

// --- MultiSelect Component Definition (Moved to top to fix reference error) ---
const MultiSelect = ({ options, selected, onChange, className }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected.length > 0 ? selected.join(", ") : "Select tags..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandEmpty>No tag found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => handleSelect(option.label)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.label) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentSubscriber, setCurrentSubscriber] = useState({
    _id: null,
    name: "",
    email: "",
    lists: [],
    status: "Subscribed",
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/subscribers');
      setSubscribers(response.data); 
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
      if (error.response?.status !== 401) {
        toast.error("Could not load subscribers from the database.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubscriber(prevState => ({ ...prevState, [name]: value }));
  };

  const handleModalSelectChange = (name, value) => {
    setCurrentSubscriber(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleTagsChange = (selectedTags) => {
    setCurrentSubscriber(prevState => ({ ...prevState, lists: selectedTags }));
  }

  const openAddModal = () => {
    setModalMode('add');
    setCurrentSubscriber({ _id: null, name: "", email: "", lists: [], status: "Subscribed" });
    setIsModalOpen(true);
  };

  const openEditModal = (subscriber) => {
    setModalMode('edit');
    setCurrentSubscriber({ ...subscriber, lists: subscriber.lists || [] });
    setIsModalOpen(true);
  };

  const handleSaveSubscriber = async () => {
    if (!currentSubscriber.email || !/^\S+@\S+\.\S+$/.test(currentSubscriber.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    const isEdit = modalMode === 'edit';

    try {
      if (isEdit) {
        await api.put(`/subscribers/${currentSubscriber._id}`, currentSubscriber);
      } else {
        await api.post('/subscribers', currentSubscriber);
      }
      
      toast.success(`Subscriber ${isEdit ? 'updated' : 'saved'} successfully!`);
      setIsModalOpen(false);
      fetchSubscribers(); // Refresh data
    } catch (error) {
      console.error("Save subscriber error:", error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEdit ? 'update' : 'add'} subscriber`;
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (subscriber) => {
    setSubscriberToDelete(subscriber);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;
    try {
      await api.delete(`/subscribers/${subscriberToDelete._id}`);
      
      toast.success("Subscriber deleted successfully!");
      fetchSubscribers(); // Refresh data
    } catch (error) {
      console.error("Delete subscriber error:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete subscriber';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setSubscriberToDelete(null);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      (subscriber.name?.toLowerCase() || '').includes(searchTermLower) ||
      (subscriber.email?.toLowerCase() || '').includes(searchTermLower);
    const matchesList = listFilter === 'all' || (subscriber.lists || []).includes(listFilter);
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    return matchesSearch && matchesList && matchesStatus;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Subscribers</h2>
            <p className="text-muted-foreground mt-1">Manage your email lists and segments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("CSV import feature - UI only")}>
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Button onClick={openAddModal} className="bg-gradient-gold hover:opacity-90 transition-opacity text-white shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Add Subscriber
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search email or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ListFilter className="w-4 h-4 mr-2" /> <SelectValue placeholder="Filter by list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              {AVAILABLE_TAGS.map(tag => (
                  <SelectItem key={tag.value} value={tag.label}>{tag.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Tag className="w-4 h-4 mr-2" /> <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem> <SelectItem value="Subscribed">Subscribed</SelectItem> <SelectItem value="Unsubscribed">Unsubscribed</SelectItem> <SelectItem value="Bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/50"><TableHead>Email Address</TableHead><TableHead>Name</TableHead><TableHead>Lists / Tags</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Loading subscribers...</TableCell></TableRow>) 
              : filteredSubscribers.length > 0 ? (filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber._id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell className="text-muted-foreground">{subscriber.name || '-'}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{(subscriber.lists || []).map(list => (<Badge key={list} variant="secondary">{list}</Badge>))}</div></TableCell>
                    <TableCell><Badge className={cn(subscriber.status === "Subscribed" && "bg-green-500/10 text-green-600 border-green-500/20", subscriber.status === "Unsubscribed" && "text-muted-foreground border-border", subscriber.status === "Bounced" && "bg-red-500/10 text-red-600 border-red-500/20")}>{subscriber.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(subscriber)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(subscriber)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))) 
              : (<TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No subscribers found.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-border"><h3 className="text-xl font-semibold">{modalMode === 'add' ? 'Add New Subscriber' : 'Edit Subscriber'}</h3><Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></Button></div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium text-muted-foreground block mb-2">Email Address</label><Input type="email" name="email" placeholder="name@example.com" value={currentSubscriber.email} onChange={handleModalInputChange} /></div>
              <div><label className="text-sm font-medium text-muted-foreground block mb-2">Full Name</label><Input type="text" name="name" placeholder="John Doe" value={currentSubscriber.name} onChange={handleModalInputChange} /></div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Lists / Tags</label>
                <MultiSelect options={AVAILABLE_TAGS} selected={currentSubscriber.lists} onChange={handleTagsChange} />
              </div>
              <div><label className="text-sm font-medium text-muted-foreground block mb-2">Status</label><Select value={currentSubscriber.status} onValueChange={(value) => handleModalSelectChange('status', value)}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Subscribed">Subscribed</SelectItem><SelectItem value="Unsubscribed">Unsubscribed</SelectItem><SelectItem value="Bounced">Bounced</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveSubscriber} className="bg-gradient-gold hover:opacity-90 transition-opacity text-white shadow-gold" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the subscriber <span className="font-medium">{subscriberToDelete?.email}</span> from your records.</AlertDialogDescription></AlertDialogHeader>
          {/* --- FIX: Corrected </Footer> to </AlertDialogFooter> --- */}
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSubscriber} className="bg-red-600 hover:bg-red-700">Yes, delete subscriber</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Subscribers;