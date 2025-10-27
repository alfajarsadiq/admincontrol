// File: CampaignReports.tsx

import { useState, useEffect } from "react";
import { Search, Filter, Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api"; // --- 1. Import the new api instance ---
import { toast } from "sonner";

interface CampaignReport {
  _id: string;
  name: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  unsubscribedCount: number;
  createdAt: string;
  status: string;
}

const CampaignReports = () => {
  const [reports, setReports] = useState<CampaignReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // --- 2. Use the 'api' instance ---
        const response = await api.get<CampaignReport[]>("/campaigns/reports");
        setReports(response.data);
      } catch (error) {
        if ((error as any).response?.status !== 401) {
            toast.error("Failed to load campaign reports.");
        }
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const nameMatch = report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? true;
    const statusMatch = statusFilter === 'all' || (report.status && report.status.toLowerCase() === statusFilter.toLowerCase());
    return nameMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Campaign Reports</h2>
        <p className="text-muted-foreground mt-1">Detailed analytics per email campaign</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search campaign name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Campaign Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Opened (%)</TableHead>
              <TableHead className="text-right">Clicked (%)</TableHead>
              <TableHead className="text-right">Unsub</TableHead>
              <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && (<TableRow><TableCell colSpan={7} className="h-24 text-center"><div className="flex justify-center items-center"><Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />Loading...</div></TableCell></TableRow>)}
            {!isLoading && filteredReports.length === 0 && (<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No reports found.</TableCell></TableRow>)}
            {!isLoading && filteredReports.map((report) => (
              <TableRow key={report._id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span className="truncate">{report.name}</span></TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'})}</TableCell>
                <TableCell className="text-right tabular-nums">{report.sentCount > 0 ? report.sentCount.toLocaleString() : '-'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {report.status === 'Sent' && report.sentCount > 0 ? `${((report.openCount / report.sentCount) * 100).toFixed(1)}%` : '-'}
                  {report.openCount > 0 && <span className="text-xs text-muted-foreground ml-1">({report.openCount.toLocaleString()})</span>}
                </TableCell>
                 <TableCell className="text-right tabular-nums">
                   {report.status === 'Sent' && report.openCount > 0 ? `${((report.clickCount / report.openCount) * 100).toFixed(1)}%` : '-'}
                   {report.clickCount > 0 && <span className="text-xs text-muted-foreground ml-1">({report.clickCount.toLocaleString()})</span>}
                 </TableCell>
                 <TableCell className="text-right tabular-nums">{report.unsubscribedCount > 0 ? report.unsubscribedCount : '-'}</TableCell>
                <TableCell>
                   <Badge variant={report.status === "Sent" ? "default" : "secondary"} className={cn("whitespace-nowrap", report.status === "Sent" && "bg-green-500/10 text-green-600 border-green-500/20", report.status === "Scheduled" && "bg-blue-500/10 text-blue-600 border-blue-500/20")}>{report.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignReports;