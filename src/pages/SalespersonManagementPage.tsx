// File: src/pages/SalespersonManagementPage.tsx (Updated)

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// --- Import functions from your api.ts file ---
import { createSalesperson, deleteSalesperson, fetchSalespersons } from "@/lib/api";
// --- 1. Import NewSalespersonPayload as well ---
import { Salesperson, NewSalespersonPayload } from "@/types";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus, Eye, EyeOff } from "lucide-react"; // <-- 2. Import Eye icons

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Validation Schema
const salespersonSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// This type is inferred from the schema
type SalespersonFormData = z.infer<typeof salespersonSchema>;

export default function SalespersonManagementPage() {
  const queryClient = useQueryClient();
  // --- 3. Add state for password visibility ---
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SalespersonFormData>({
    resolver: zodResolver(salespersonSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  // Query to fetch salespersons
  const { data: salespersons = [], isLoading } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: fetchSalespersons,
  });

  // Mutation to create a salesperson
  const createMutation = useMutation<Salesperson, Error, NewSalespersonPayload>({
    mutationFn: createSalesperson,
    onSuccess: () => {
      toast.success("Salesperson created successfully!");
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
      form.reset();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.msg || "Failed to create salesperson.";
      toast.error(errorMsg);
    },
  });

  // Mutation to delete a salesperson
  const deleteMutation = useMutation({
    mutationFn: deleteSalesperson,
    onSuccess: () => {
      toast.success("Salesperson deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.msg || "Failed to delete salesperson.";
      toast.error(errorMsg);
    },
  });

  // FIX: Cast values to NewSalespersonPayload to resolve type mismatch error
  const onSubmit = (values: SalespersonFormData) => {
    createMutation.mutate(values as NewSalespersonPayload);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Memoize the table body
  const salespersonTableRows = useMemo(() => {
    return salespersons.map((sp) => (
      <TableRow key={sp.id}>
        <TableCell className="font-medium">{sp.name}</TableCell>
        <TableCell className="text-right">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  salesperson "{sp.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(sp.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
    ));
  }, [salespersons, deleteMutation.isPending]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Salesperson Management</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Salesperson
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salesperson Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* --- 4. MODIFIED PASSWORD FIELD --- */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="pr-10" // Add padding to make space for the icon
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* --- END MODIFICATION --- */}
                
                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Salesperson"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>All Salespersons</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin inline-block" />
                    </TableCell>
                  </TableRow>
                ) : salespersons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      No salespersons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  salespersonTableRows
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
