// File: src/components/invoices/RecentInvoicesList.tsx
// (You might want to rename this file to RecentOrderFormsList.tsx)

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { Loader2, Eye, Trash } from "lucide-react";
// --- UPDATED TYPE IMPORT ---
import { IRecentOrderForm } from "@/types";

// --- UPDATED PROPS ---
interface RecentOrderFormsListProps {
  forms: IRecentOrderForm[]; // Renamed prop
  isLoading: boolean;
  onViewForm: (form: IRecentOrderForm) => void; // Renamed prop
  onDeleteForm: (form: IRecentOrderForm) => void; // Renamed prop
  isDeleting: boolean;
}

// --- UPDATED COMPONENT NAME AND PROPS ---
export const RecentOrderFormsList = ({
  forms,
  isLoading,
  onViewForm,
  onDeleteForm,
  isDeleting,
}: RecentOrderFormsListProps) => {
  return (
    <Card>
      <CardHeader>
        {/* --- UPDATED TITLE --- */}
        <CardTitle>Recent Order Forms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                {/* --- UPDATED HEADER --- */}
                <TableHead>Form ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading recent forms... {/* Updated text */}
                    </div>
                  </TableCell>
                </TableRow>
              ) : forms.length > 0 ? (
                forms.map((form) => ( // Use 'form' variable
                  <TableRow key={form._id}>
                    {/* --- UPDATED DATA FIELD --- */}
                    <TableCell className="font-medium">{form.formId}</TableCell>
                    <TableCell>{form.companyName || "N/A"}</TableCell>
                    <TableCell>
                      {/* --- UPDATED DATA FIELD --- */}
                      {new Date(form.formDate).toLocaleDateString()}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewForm(form)} // Use renamed handler
                          disabled={isDeleting}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => onDeleteForm(form)} // Use renamed handler
                          disabled={isDeleting}
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
                    No recent order forms found. {/* Updated text */}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrderFormsList;