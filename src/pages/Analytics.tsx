// File: src/pages/Analytics.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, MailOpen, MousePointerClick, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useEffect, useState } from "react";
import api from "@/lib/api"; // --- 1. Import the central api instance ---
import { toast } from "sonner";

// Define interfaces for data structures for type safety
interface CampaignPerformance {
  name: string;
  sent: number;
  opened: number;
  clicked: number;
}
interface ListGrowth {
  date: string;
  subscribers: number;
}
interface RateTrend {
  date: string;
  openRate: number;
  clickRate: number;
}
interface AnalyticsData {
  totalSubscribers: number;
  newSubscribersThisWeek: number;
  avgOpenRate: number;
  openRateTrend: number;
  avgClickRate: number;
  clickRateTrend: number;
  listGrowthRate: number;
  campaignPerformance: CampaignPerformance[];
  listGrowth: ListGrowth[];
  rateTrend: RateTrend[];
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // --- 2. Use the 'api' instance which automatically sends the token ---
        const response = await api.get('/analytics');
        setAnalyticsData(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        // The global error handler in api.ts will show a toast for 401
        if ((err as any).response?.status !== 401) {
            toast.error("Failed to load analytics data.");
        }
        setError("Failed to fetch analytics data. Please check the console and ensure the backend server is running on port 5000.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading Analytics...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="p-4 text-center bg-destructive/10 border border-destructive/20 rounded-lg">
        <h3 className="text-lg font-semibold text-destructive">An Error Occurred</h3>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  const quickStats = [
    { title: "Total Subscribers", value: analyticsData.totalSubscribers.toLocaleString(), icon: Users, trend: `${analyticsData.newSubscribersThisWeek >= 0 ? '+' : ''}${analyticsData.newSubscribersThisWeek.toLocaleString()} this week` },
    { title: "Avg. Open Rate", value: `${analyticsData.avgOpenRate.toFixed(1)}%`, icon: MailOpen, trend: `${analyticsData.openRateTrend >= 0 ? '+' : ''}${analyticsData.openRateTrend.toFixed(1)}%` },
    { title: "Avg. Click Rate", value: `${analyticsData.avgClickRate.toFixed(1)}%`, icon: MousePointerClick, trend: `${analyticsData.clickRateTrend >= 0 ? '' : ''}${analyticsData.clickRateTrend.toFixed(1)}%` },
    { title: "List Growth Rate", value: `${analyticsData.listGrowthRate.toFixed(1)}%`, icon: TrendingUp, trend: "Monthly Avg" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Email Analytics</h2>
        <p className="text-muted-foreground mt-1">Monitor email performance and list health</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Campaign Performance (Recent)</CardTitle>
            <CardDescription>Sent, Opens, and Clicks for recent campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10}/>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                <Bar dataKey="sent" fill="hsl(var(--muted))" name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" fill="hsl(45 65% 52%)" name="Opened" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="hsl(var(--primary) / 0.7)" name="Clicked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Subscriber Growth</CardTitle>
            <CardDescription>Total subscribers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.listGrowth}>
                <defs>
                   <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45 65% 52%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(45 65% 52%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['dataMin - 100', 'dataMax + 100']}/>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="subscribers" stroke="hsl(45 65% 52%)" fillOpacity={1} fill="url(#colorSubscribers)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Open & Click Rate Trend</CardTitle>
            <CardDescription>Average rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.rateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%"/>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Line type="monotone" dataKey="openRate" name="Open Rate" stroke="hsl(45 65% 52%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="clickRate" name="Click Rate" stroke="hsl(var(--primary) / 0.7)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;