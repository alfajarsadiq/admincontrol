// File: Dashboard.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, TrendingUp, Send, Loader2 } from "lucide-react";
import api from "@/lib/api"; // --- 1. Import the new api instance ---
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Types ---
type ESPStatus = {
  status: "Connected" | "Disconnected" | "Error" | "Loading...";
  detail?: string;
};

type CampaignReport = {
  _id: string;
  name: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
};

type Subscriber = {
  email: string;
  status: "Subscribed" | "Unsubscribed" | "Pending";
};

type StatCard = {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
};

const initialStats: StatCard[] = [
  { title: "Total Subscribers", value: "...", change: "", icon: Users, color: "text-blue-500" },
  { title: "Avg. Open Rate", value: "...", change: "", icon: Mail, color: "text-primary" },
  { title: "Avg. Click Rate", value: "...", change: "", icon: TrendingUp, color: "text-purple-500" },
  { title: "Campaigns Sent", value: "...", change: "", icon: Send, color: "text-green-500" },
];

const Dashboard = () => {
  const [espStatus, setEspStatus] = useState<ESPStatus>({ status: "Loading..." });
  const [stats, setStats] = useState<StatCard[]>(initialStats);
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignReport[]>([]);
  const [systemStatus, setSystemStatus] = useState({ domain: "Loading...", scheduled: 0, health: "Loading..." });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // --- 2. Use the 'api' instance for all requests ---
        const [campaignsRes, subscribersRes, espStatusRes] = await Promise.all([
          api.get<CampaignReport[]>('/campaigns'),
          api.get<Subscriber[]>('/subscribers'),
          api.get<ESPStatus>('/status/email')
        ]);

        const campaigns = campaignsRes.data;
        const subscribers = subscribersRes.data;
        setEspStatus(espStatusRes.data);

        // --- Process Stats ---
        const totalSubscribers = subscribers.filter(s => s.status === 'Subscribed').length;
        const totalCampaignsSent = campaigns.length;
        
        let totalRecipients = 0;
        let totalOpens = 0;
        let totalClicks = 0;
        campaigns.forEach(c => {
          totalRecipients += c.sentCount || 0;
          totalOpens += c.openCount || 0;
          totalClicks += c.clickCount || 0;
        });

        const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
        const avgClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0;

        setStats([
            { title: "Total Subscribers", value: totalSubscribers.toLocaleString(), change: "", icon: Users, color: "text-blue-500" },
            { title: "Avg. Open Rate", value: `${avgOpenRate.toFixed(1)}%`, change: "", icon: Mail, color: "text-primary" },
            { title: "Avg. Click Rate", value: `${avgClickRate.toFixed(1)}%`, change: "", icon: TrendingUp, color: "text-purple-500" },
            { title: "Campaigns Sent", value: totalCampaignsSent.toLocaleString(), change: "", icon: Send, color: "text-green-500" },
        ]);

        setRecentCampaigns(campaigns.slice(0, 3));
        setSystemStatus({ domain: "Verified", scheduled: 3, health: "Good" });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        if ((error as any).response?.status !== 401) {
          toast.error("Failed to load dashboard data.");
        }
        setStats(initialStats.map(s => ({ ...s, value: "Error" })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status: ESPStatus["status"]) => {
    switch (status) {
      case "Connected": return "bg-green-500/10 text-green-500";
      case "Disconnected": return "bg-yellow-500/10 text-yellow-500";
      case "Error": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500 animate-pulse";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">Monitor your email marketing performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-gold transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold text-foreground", isLoading && "animate-pulse bg-gray-300/20 rounded-md w-1/2")}>
                {isLoading ? "..." : stat.value}
              </div>
              <p className={cn("text-xs mt-1", stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500')}>{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle>Recent Campaigns</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</div>
            ) : recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No campaigns sent yet.</p>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => {
                  const openPerc = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
                  const clickPerc = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;
                  return (
                    <div key={campaign._id} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Send className="w-5 h-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                         <p className="text-xs text-muted-foreground">Opens: {openPerc.toFixed(1)}%</p>
                         <p className="text-xs text-muted-foreground">Clicks: {clickPerc.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Email Service Status</span>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusBadgeClass(espStatus.status))} title={espStatus.detail || ''}>{espStatus.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Domain Authentication</span>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", isLoading ? "bg-gray-500/10 text-gray-500 animate-pulse" : "bg-green-500/10 text-green-500")}>{isLoading ? "..." : systemStatus.domain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Scheduled Campaigns</span>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", isLoading ? "bg-gray-500/10 text-gray-500 animate-pulse" : "bg-blue-500/10 text-blue-500")}>{isLoading ? "..." : `${systemStatus.scheduled} pending`}</span>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">List Health</span>
                <span className={cn("text-xs", isLoading ? "text-gray-500 animate-pulse" : "text-muted-foreground")}>{isLoading ? "..." : systemStatus.health}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;