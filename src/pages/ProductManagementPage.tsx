// File: src/pages/ProductManagementPage.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// --- ADDED: Imports for dialog and icon ---
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
import { Loader2, PlusCircle, AlertCircle, Trash2 } from 'lucide-react';
// --- UPDATED: Import deleteProduct ---
import { fetchProducts, createProduct, deleteProduct, Product } from '@/lib/api';
import { useAuth } from '@/context/AuthContext'; // To check role before rendering potentially

const ProductManagementPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { admin } = useAuth(); // Get admin info for role check

    const [newProductName, setNewProductName] = useState('');
    const [newProductUnits, setNewProductUnits] = useState('');
    
    // --- ADDED: State for delete confirmation ---
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // Fetch existing products
    const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    // Mutation for creating a new product
    const createProductMutation = useMutation({
        mutationFn: (variables: { name: string; defaultUnits: string }) =>
            createProduct(variables.name, variables.defaultUnits),
        onSuccess: (newProduct) => {
            toast.success(`Product "${newProduct.name}" added successfully!`);
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch the product list
            // Also invalidate items list for LR generator if products list is used there
            queryClient.invalidateQueries({ queryKey: ['items'] }); // Use the correct query key if different
            setNewProductName('');
            setNewProductUnits('');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to add product.";
            toast.error(message);
            console.error("Error creating product:", error);
        },
    });

    // --- ADDED: Mutation for deleting a product ---
    const deleteProductMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: (_, deletedProductId) => {
            toast.success("Product deleted successfully!");
            // Optimistically update UI or just refetch
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['items'] }); // Also invalidate items for LR generator
            setProductToDelete(null); // Close the dialog
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to delete product.";
            toast.error(message);
            console.error("Error deleting product:", error);
            setProductToDelete(null); // Close the dialog on error
        },
    });
    // --- END ADDED ---

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductName || !newProductUnits) {
            toast.error("Please enter both product name and units.");
            return;
        }
        createProductMutation.mutate({ name: newProductName, defaultUnits: newProductUnits });
    };

    // --- ADDED: Handler for delete confirmation ---
    const handleDeleteConfirm = () => {
        if (productToDelete) {
            deleteProductMutation.mutate(productToDelete._id);
        }
    };
    // --- END ADDED ---

    // --- Conditional Rendering based on Role ---
    if (admin?.role !== 'admin') {
        return (
             <div className="p-6 md:p-8 space-y-6 bg-muted/40 min-h-screen flex items-center justify-center">
                 <Card className="w-full max-w-md">
                     <CardHeader>
                         <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
                     </CardHeader>
                     <CardContent className="text-center text-muted-foreground">
                         <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                         You do not have permission to access this page.
                     </CardContent>
                 </Card>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 bg-muted/40 min-h-screen">
            <h1 className="text-3xl font-bold">Product Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add Product Form */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Add New Product</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleAddProduct}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="product-name">Product Name</Label>
                                <Input
                                    id="product-name"
                                    placeholder="e.g., AMIR OIL"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    disabled={createProductMutation.isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product-units">Default Units</Label>
                                <Input
                                    id="product-units"
                                    placeholder="e.g., 5 LTR"
                                    value={newProductUnits}
                                    onChange={(e) => setNewProductUnits(e.target.value)}
                                    disabled={createProductMutation.isPending}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={createProductMutation.isPending}>
                                {createProductMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                {createProductMutation.isPending ? 'Adding...' : 'Add Product'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Recent Products List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-96"> {/* Added max-h and overflow */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Default Units</TableHead>
                                        <TableHead>Added On</TableHead>
                                        {/* --- ADDED: Actions Header --- */}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingProducts ? (
                                        <TableRow>
                                            {/* --- UPDATED: colSpan --- */}
                                            <TableCell colSpan={4} className="text-center">
                                                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : productsError ? (
                                         <TableRow>
                                             {/* --- UPDATED: colSpan --- */}
                                            <TableCell colSpan={4} className="text-center text-destructive">
                                                Failed to load products.
                                            </TableCell>
                                        </TableRow>
                                    ) : products.length === 0 ? (
                                        <TableRow>
                                             {/* --- UPDATED: colSpan --- */}
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No products added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((product) => (
                                            <TableRow key={product._id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.defaultUnits}</TableCell>
                                                <TableCell>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                                {/* --- ADDED: Delete Button Cell --- */}
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setProductToDelete(product)}
                                                        disabled={deleteProductMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                {/* --- END ADDED --- */}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- ADDED: Delete Confirmation Dialog --- */}
            <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product
                            <strong className="mx-1">{productToDelete?.name}</strong>
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteProductMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteProductMutation.isPending}
                        >
                            {deleteProductMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* --- END ADDED --- */}

        </div>
    );
};

export default ProductManagementPage;