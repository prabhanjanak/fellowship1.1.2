import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  FileText,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Type,
  Code,
  Download,
  Loader2,
  CheckCircle2,
  FileUp,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

// Placeholders for the template
const PLACEHOLDERS = [
  { label: "Full Name", value: "{{FULL_NAME}}" },
  { label: "Email", value: "{{EMAIL}}" },
  { label: "Specialization", value: "{{SPECIALIZATION}}" },
  { label: "Unit", value: "{{UNIT}}" },
  { label: "Date", value: "{{DATE}}" },
  { label: "Submission ID", value: "{{SUBMISSION_ID}}" },
];

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, val: string = "") => {
    document.execCommand(command, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="border rounded-xl bg-white overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-slate-50 border-b p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("bold")} title="Bold"><b>B</b></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("italic")} title="Italic"><i>I</i></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 underline" onClick={() => execCommand("underline")} title="Underline">U</Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyLeft")}><Type className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyCenter")}><Type className="h-4 w-4 rotate-90" /></Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")}>1.</Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")}>•</Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
          const url = prompt("Enter image URL:");
          if (url) execCommand("insertImage", url);
        }}><ImageIcon className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
          const url = prompt("Enter link URL:");
          if (url) execCommand("createLink", url);
        }}><Code className="h-4 w-4" /></Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="flex-1 p-8 focus:outline-none min-h-[500px] prose prose-sm max-w-none font-serif text-lg leading-relaxed"
      />
    </div>
  );
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editorValue, setEditorValue] = useState("");
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<any[]>("/templates"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (selectedTemplate?.id) {
        return api.patch(`/templates/${selectedTemplate.id}`, data);
      }
      return api.post("/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template Saved", description: "Your changes have been recorded." });
    },
  });

  useEffect(() => {
    if (selectedTemplate) {
      setEditorValue(selectedTemplate.content);
      setTemplateName(selectedTemplate.name);
    } else {
      setEditorValue("");
      setTemplateName("");
    }
  }, [selectedTemplate]);

  const insertPlaceholder = (val: string) => {
    document.execCommand("insertHTML", false, `<span class="bg-orange-100 text-orange-800 px-1 rounded font-mono font-bold">${val}</span>`);
  };

  const handleDocxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        try {
          // Load mammoth from CDN if not available
          const win = window as any;
          if (!win.mammoth) {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
            script.onload = () => processDocx(arrayBuffer);
            document.head.appendChild(script);
          } else {
            processDocx(arrayBuffer);
          }
        } catch (err) {
          toast({ title: "Import Error", description: "Failed to process the document.", variant: "destructive" });
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processDocx = (arrayBuffer: ArrayBuffer) => {
    (window as any).mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
      .then((result: any) => {
        setEditorValue(result.value);
        toast({ title: "Import Success", description: "Document content loaded into editor." });
        if (fileInputRef.current) fileInputRef.current.value = "";
      })
      .catch((err: any) => {
        toast({ title: "Import Error", description: "Could not convert Word document.", variant: "destructive" });
      });
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Templates</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTemplate(null)}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No templates yet.</div>
            ) : (
              <div className="divide-y">
                {templates.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-muted transition-colors flex items-center gap-3",
                      selectedTemplate?.id === t.id && "bg-muted border-r-4 border-primary"
                    )}
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(t.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Placeholders</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              Click a placeholder to insert it into the document at the current cursor position.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PLACEHOLDERS.map(p => (
                <Button key={p.value} variant="outline" size="sm" className="justify-start text-xs h-8 font-mono" onClick={() => insertPlaceholder(p.value)}>
                  {p.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name (e.g. Admission Offer July 2026)"
              className="text-lg font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-10"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".docx"
              onChange={handleDocxImport}
            />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Import Word (.docx)
            </Button>
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export as PDF</Button>
            <Button size="sm" className="gap-2" onClick={() => saveMutation.mutate({ name: templateName, content: editorValue, type: "offer_letter" })} disabled={saveMutation.isPending || !templateName}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Template
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-4 h-full">
            <RichEditor value={editorValue} onChange={setEditorValue} />
          </div>
        </div>
      </div>
    </div>
  );
}

