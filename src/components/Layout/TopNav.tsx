// File: TopNav.tsx

import { useState, useEffect } from "react";
import { Bell, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext"; // --- Import useAuth ---
import api from "@/lib/api"; // Use central api
import { toast } from "sonner";

export const TopNav = () => {
  const { admin, setAdmin, logout } = useAuth(); // --- Use the auth hook ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState('');
  
  // Update form state when admin profile is loaded
  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setCompanyName(admin.companyName);
      setPreviewLogo(admin.logo);
    }
  }, [admin]);

  const handleOpenDialog = () => {
    if (admin) {
      setName(admin.name);
      setCompanyName(admin.companyName);
      setPreviewLogo(admin.logo);
      setLogoFile(null);
      setIsDialogOpen(true);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('companyName', companyName);
    if (logoFile) {
        formData.append('logo', logoFile);
    }

    try {
        const response = await api.put('/admin', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // --- THIS IS THE FIX ---
        // REMOVED the line: response.data.logo = `http://localhost:5000${response.data.logo}`;
        // The backend is already sending the full URL (e.g., http://192.168.70.163:5000/uploads/logo.png)
        // We can just use the response data directly.
        
        setAdmin(response.data); // Update the global context with the correct data
        toast.success("Profile updated successfully!");
        setIsDialogOpen(false);
    } catch (error) {
        toast.error("Failed to update profile.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">Admin Management</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {admin?.logo && <img src={admin.logo} alt="User" className="w-8 h-8 rounded-full object-cover" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>{admin?.name}</DropdownMenuLabel>
            {/* --- FIX 1: Replaced placeholder text with DropdownMenuSeparator --- */}
            <DropdownMenuSeparator /> 
            <DropdownMenuItem onClick={handleOpenDialog}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-popover">
            <DialogHeader><DialogTitle>Profile Settings</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Logo (PNG)</Label>
                    <div className="col-span-3 flex items-center gap-4">
                        <img src={previewLogo} alt="Logo Preview" className="w-12 h-12 rounded-lg object-cover border"/>
                        <Button asChild variant="outline"><label htmlFor="logo-upload"><Upload className="w-4 h-4 mr-2"/> Upload<input id="logo-upload" type="file" accept="image/png" className="hidden" onChange={handleLogoChange}/></label></Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
                {/* --- FIX 2: Fixed the incomplete Input tag for companyName --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="companyName" className="text-right">Company</Label>
                    <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            {/* --- FIX 3: Fixed the broken Button tag for "Save Changes" --- */}
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleProfileSave} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </header>
  );
};
