// File: src/pages/UserManagementPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash, UserPlus, Eye, Mail, User as UserIcon, Lock, Users, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { fetchUsers, createUser, deleteUser, updateUser } from '@/lib/api';
import { User, NewUserPayload } from '@/types'; // Import the new User types

// --- UserManagementPage Component ---

export const UserManagementPage = () => {
  const { admin } = useAuth(); // To check the currently logged-in user (optional for disabling self-actions)
  
  // State for Create Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // FIX 2: Role state should hold the actual database value, default to 'lr_user'
  const [role, setRole] = useState<'lr_user' | 'salesperson' | 'admin'>('lr_user');
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State for Read/Delete List
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // --- Fetch Users ---
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      // Sort users by name for better display
      setUsers(fetchedUsers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load user list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Create User Handler ---
  const handleCreateUser = async () => {
    if (!name || !email || !password || !role) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsCreating(true);
    
    // FIX 3: Send the current state value, which is one of the valid database roles
    const payload: NewUserPayload = { name, email, password, role };

    try {
      const newUser = await createUser(payload);
      toast.success(`User "${newUser.name}" created successfully.`);
      
      // Refresh the user list to show the new user
      loadUsers(); 
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setRole('lr_user'); // Reset to the standard role

    } catch (error: any) {
      const message = error.message.includes("400") ? "Email is already in use." : error.message || "Failed to create user.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };
  
  // --- Delete Handlers ---
  const openDeleteAlert = (user: User) => {
    if (admin && admin.id === user._id) {
        toast.error("Cannot delete your own account here.");
        return;
    }
    setUserToDelete(user);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await deleteUser(userToDelete._id);
      toast.success(`User "${userToDelete.name}" deleted successfully.`);
      
      // Filter out the deleted user
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      
      // Close and reset state
      setUserToDelete(null);
      setIsDeleteAlertOpen(false);

    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete user.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // --- View/Edit Handler (Placeholder for future feature) ---
  const handleViewDetails = (user: User) => {
      // For now, we will just show a toast.
      toast.info(`Viewing details for ${user.name}. (Edit functionality coming soon!)`);
  };

  // --- Helper function to display role name ---
  const getRoleLabel = (dbRole: string) => {
      switch(dbRole) {
          case 'lr_user':
              return 'Standard User';
          case 'admin':
              return 'Admin';
          case 'salesperson':
              return 'Salesperson';
          default:
              return dbRole;
      }
  }


  // --- JSX Rendering ---
  return (
    <div className="p-6 md:p-8 space-y-6 bg-muted/40 min-h-screen">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Users className="w-6 h-6"/> User Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Card 1: Add New User --- */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5"/> Add New User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">User Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" placeholder="e.g., Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="pl-10"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="e.g., jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Minimum 6 characters" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pr-10 pl-10"
                />
                <Eye 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" 
                  onClick={() => setShowPassword(prev => !prev)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Select value={role} onValueChange={setRole as (value: string) => void}>
                    <SelectTrigger id="role" className="pl-10">
                        <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* FIX 4: Use 'lr_user' as the value, but 'Standard User' as the label */}
                        <SelectItem value="lr_user">Standard User</SelectItem>
                        <SelectItem value="salesperson">Salesperson</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateUser} disabled={isCreating} className="w-full bg-primary hover:bg-primary/90 transition-colors">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isCreating ? "Creating User..." : "Add User"}
            </Button>
          </CardFooter>
        </Card>

        {/* --- Card 2: All Users List --- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize text-xs">
                           {/* FIX 5: Use helper function to show 'Standard User' instead of 'lr_user' */}
                           {getRoleLabel(user.role)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewDetails(user)}
                              disabled={isDeleting}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => openDeleteAlert(user)}
                              disabled={isDeleting || (admin && admin.id === user._id)} 
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No users found. Start by adding one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* --- Delete Confirmation Dialog --- */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}" ({userToDelete?.email})? This action is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
