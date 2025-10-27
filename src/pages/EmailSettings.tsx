import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EmailSettings = () => {
  const [senderName, setSenderName] = useState("Ferrari Foods");
  const [senderEmail, setSenderEmail] = useState("marketing@ferrarifoods.com");
  const [espApiKey, setEspApiKey] = useState("");
  const [defaultFooter, setDefaultFooter] = useState(
    "Ferrari Foods LLC\nDubai, UAE\nUnsubscribe here: {{UNSUB_LINK}}"
  );
  const [domainStatus, setDomainStatus] = useState("Verified");

  const handleSave = () => {
    console.log("Saving settings:", { senderName, senderEmail, espApiKey, defaultFooter });
    toast.success("Email settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Email Settings</h2>
        <p className="text-muted-foreground mt-1">Configure sender details and integrations</p>
      </div>

      {/* Sender & Authentication Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Sender & Authentication</CardTitle>
          <CardDescription>Manage your sender identity and domain authentication (DKIM/SPF)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sender Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Input
                id="sender-name"
                placeholder="e.g., Ferrari Foods Marketing"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-email">Sender Email Address</Label>
              <Input
                id="sender-email"
                type="email"
                placeholder="e.g., newsletter@yourdomain.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Domain Authentication Status */}
          <div className="space-y-2">
            <Label>Domain Authentication Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant={domainStatus === "Verified" ? "default" : "destructive"}
               className={cn(
                   domainStatus === "Verified" && "bg-green-500/10 text-green-600 border-green-500/20",
                   domainStatus !== "Verified" && "bg-red-500/10 text-red-600 border-red-500/20"
               )}>
                {domainStatus}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {domainStatus === "Verified"
                  ? "Your sending domain is properly authenticated."
                  : "Authentication needed. Check your DNS settings."}
              </p>
            </div>
          </div>

          {/* ESP API Key */}
          <div className="space-y-2">
            <Label htmlFor="esp-api-key">Email Provider API Key</Label>
            <Input
              id="esp-api-key"
              type="password"
              placeholder="Enter your ESP API Key (e.g., SendGrid, Mailgun)"
              value={espApiKey}
              onChange={(e) => setEspApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required to send emails via your Email Service Provider. Stored securely on the server.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Default Content Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Default Content</CardTitle>
          <CardDescription>Set up default content required for your emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Footer */}
          <div className="space-y-2">
            <Label htmlFor="default-footer">Default Email Footer</Label>
            <Textarea
              id="default-footer"
              value={defaultFooter}
              onChange={(e) => setDefaultFooter(e.target.value)}
              rows={4}
              className="resize-none font-mono text-xs"
            />
            {/* --- CORRECTED DESCRIPTION --- */}
            <p className="text-xs text-muted-foreground">
              Required by anti-spam laws. Include your physical address and unsubscribe link. Use '{'{'}{'{'}UNSUB_LINK{'}'}{'}'}' placeholder for the unsubscribe link provided by your ESP.
            </p>
            {/* --- END CORRECTION --- */}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="bg-gradient-gold hover:opacity-90 transition-opacity text-white shadow-gold"
          >
            Save Email Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;