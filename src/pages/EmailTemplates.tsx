import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api"; // --- 1. Import the new authenticated api instance ---

// Type definition for a Template
interface Template {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch all templates from the API
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // --- 2. Use the 'api' instance which automatically sends the token ---
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
        // The global error handler in api.ts will show a toast for 401 errors
        if ((error as any).response?.status !== 401) {
            toast.error("Could not load templates.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Listen for messages from the iframe to update HTML content
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type, content } = event.data;
      if (type === 'htmlUpdate') {
        setCurrentTemplate(prev => ({ ...prev, htmlContent: content }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Dialog and File Upload handlers
  const handleOpenAddDialog = () => {
    setCurrentTemplate({ name: "", subject: "", htmlContent: "<html><body><h1>Welcome!</h1><p>Click me to edit this text.</p></body></html>" });
    setIsDialogOpen(true);
  };
  const handleOpenEditDialog = (template: Template) => {
    setCurrentTemplate(template);
    setIsDialogOpen(true);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentTemplate(prev => ({ ...prev, htmlContent: e.target?.result as string }));
        toast.success("HTML file loaded.");
      };
      reader.readAsText(file);
    }
  };
  const triggerFileUpload = () => fileInputRef.current?.click();

  // Handle form submission (Create or Update)
  const handleSaveTemplate = async () => {
    if (!currentTemplate?.name || !currentTemplate.subject || !currentTemplate.htmlContent) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    setIsSubmitting(true);
    const isEditing = currentTemplate._id;
    const cleanedHtml = currentTemplate.htmlContent.replace(/<script id="editor-script">[\s\S]*?<\/script>/, '');
    const payload = { ...currentTemplate, htmlContent: cleanedHtml };

    try {
      // --- 3. Use the 'api' instance for create/update/delete actions ---
      if (isEditing) {
        await api.put(`/templates/${currentTemplate._id}`, payload);
        toast.success("Template updated successfully!");
      } else {
        await api.post('/templates', payload);
        toast.success("Template created successfully!");
      }
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(isEditing ? "Failed to update template." : "Failed to create template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
        await api.delete(`/templates/${id}`);
        toast.success("Template deleted successfully!");
        fetchTemplates();
    } catch (error) {
        toast.error("Failed to delete template.");
    }
  };

  // Injects the editor script into the HTML for the iframe
  const getPreviewHtml = () => {
    if (!currentTemplate?.htmlContent) return "";
    const script = `
      <script id="editor-script">
        document.addEventListener('DOMContentLoaded', () => {
          const postUpdate = () => {
            const cleaner = document.cloneNode(true);
            const editorScript = cleaner.getElementById('editor-script');
            if (editorScript) editorScript.remove();
            window.parent.postMessage({ type: 'htmlUpdate', content: cleaner.documentElement.outerHTML }, '*');
          };
          const editableTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'td'];
          document.body.addEventListener('click', (e) => {
            if (editableTags.includes(e.target.tagName.toLowerCase())) {
              e.target.setAttribute('contenteditable', 'true');
              e.target.focus();
              e.target.addEventListener('blur', () => {
                e.target.removeAttribute('contenteditable');
                postUpdate();
              }, { once: true });
            }
          });
        });
      <\/script>
    `;
    const html = currentTemplate.htmlContent;
    if (html.includes('</head>')) return html.replace('</head>', script + '</head>');
    return html.replace('</body>', script + '</body>');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Email Templates</h2>
          <p className="text-muted-foreground mt-1">Manage your reusable email designs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog} className="bg-gradient-gold hover:opacity-90 transition-opacity text-white shadow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover sm:max-w-6xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{currentTemplate?._id ? "Edit Template" : "Add New Template"}</DialogTitle>
              <DialogDescription>
                Edit content on the left, or click directly on text in the preview pane to edit it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Left Side: Editor */}
                <div className="space-y-4 flex flex-col">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name (Internal)</Label>
                        <Input id="template-name" placeholder="e.g., Weekly Newsletter" value={currentTemplate?.name || ""} onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template-subject">Subject Line</Label>
                        <Input id="template-subject" placeholder="Subject for the email" value={currentTemplate?.subject || ""} onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}/>
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="template-content">Email Content (HTML)</Label>
                            <Button variant="outline" size="sm" onClick={triggerFileUpload}>
                                <Upload className="w-3 h-3 mr-2" /> Upload HTML
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".html" className="hidden" />
                        </div>
                        <Textarea id="template-content" placeholder="Paste your HTML here..." value={currentTemplate?.htmlContent || ""} onChange={(e) => setCurrentTemplate({ ...currentTemplate, htmlContent: e.target.value })} className="flex-1 resize-none font-mono text-xs"/>
                    </div>
                </div>
                {/* Right Side: Preview */}
                <div className="space-y-2 flex flex-col">
                    <Label>Live Preview (Click text to edit)</Label>
                    <div className="flex-1 border rounded-md bg-white overflow-hidden">
                        <iframe
                            ref={iframeRef}
                            srcDoc={getPreviewHtml()}
                            title="Email Preview"
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>
            <DialogFooter className="mt-4">
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleSaveTemplate} disabled={isSubmitting} className="bg-gradient-gold hover:opacity-90 transition-opacity text-white">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentTemplate?._id ? "Save Changes" : "Create Template"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No templates found. Add one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template._id} className="shadow-card hover:shadow-gold transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Subject: {template.subject}</CardDescription>
                <CardDescription className="mt-2 line-clamp-4 text-sm border-l-2 pl-2 border-border italic">
                  {template.htmlContent.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEditDialog(template)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template._id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;