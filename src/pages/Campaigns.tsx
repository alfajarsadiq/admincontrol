// File: Campaigns.tsx

import { useState, useEffect } from "react";
import { Send, Users, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api"; // --- 1. Import the new api instance ---

interface Template {
  _id: string;
  name: string;
}

const AVAILABLE_TAGS = ["Newsletter", "Test List", "Marketing", "Promotions", "New Customer"];

const Campaigns = () => {
  const [campaignName, setCampaignName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // --- 2. Use the 'api' instance ---
        const response = await api.get("/templates");
        setTemplates(response.data);
      } catch (error) {
        if ((error as any).response?.status !== 401) {
            toast.error("Could not load email templates.");
        }
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSendCampaign = async () => {
    if (!campaignName || !subjectLine || !selectedTemplate || !selectedList) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSending(true);
    try {
      // --- 3. Use the 'api' instance ---
      await api.post("/campaigns/send", {
          campaignName,
          subject: subjectLine,
          templateId: selectedTemplate,
          listId: selectedList, // This now correctly refers to the tag
      });
      toast.success(`Campaign "${campaignName}" sent successfully!`);
      setCampaignName("");
      setSubjectLine("");
      setSelectedTemplate("");
      setSelectedList("");
    } catch (error) {
        if ((error as any).response?.status !== 401) {
            toast.error("Failed to send campaign.");
        }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Email Campaigns</h2>
        <p className="text-muted-foreground mt-1">Create, schedule, and send email campaigns</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Compose and schedule your email campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name (Internal)</Label>
              <Input id="campaign-name" placeholder="e.g., Test Email Send" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} disabled={isSending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-line">Subject Line</Label>
              <Input id="subject-line" placeholder="Enter the email subject" value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} disabled={isSending} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="template">Select Email Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={isSending || isLoadingTemplates}>
                <SelectTrigger id="template"><Mail className="w-4 h-4 mr-2 opacity-50"/><SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Choose a template"} /></SelectTrigger>
                <SelectContent>
                  {isLoadingTemplates ? (<div className="flex items-center justify-center p-2"><Loader2 className="w-4 h-4 animate-spin" /></div>) 
                  : (templates.map(template => (<SelectItem key={template._id} value={template._id}>{template.name}</SelectItem>)))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Select Audience (Tag)</Label>
              <Select value={selectedList} onValueChange={setSelectedList} disabled={isSending}>
                <SelectTrigger id="audience"><Users className="w-4 h-4 mr-2 opacity-50"/><SelectValue placeholder="Choose a tag to send to" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="all-subscribers">All Subscribers</SelectItem>
                  {AVAILABLE_TAGS.map(tag => (<SelectItem key={tag} value={tag}>Tag: {tag}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSendCampaign} className="w-full bg-gradient-gold hover:opacity-90 transition-opacity text-white shadow-gold" disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSending ? "Sending..." : "Send Campaign Now"}
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>Scheduled Campaigns</CardTitle><CardDescription>Upcoming email sends</CardDescription></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground text-center py-4">No campaigns scheduled.</p></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Campaigns;