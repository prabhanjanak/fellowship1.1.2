import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Plus, Trash2, Loader2, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface Speciality {
  id: number;
  name: string;
  code: string | null;
}

export default function SpecialitiesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Speciality | null>(null);

  const { data: specialities = [], isLoading } = useQuery<Speciality[]>({
    queryKey: ["specialities"],
    queryFn: () => api.get<Speciality[]>("/specialities"),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post("/specialities", { name }),
    onSuccess: () => {
      toast({ title: "Speciality added" });
      qc.invalidateQueries({ queryKey: ["specialities"] });
      setCreateOpen(false);
      setNewName("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/specialities/${id}`),
    onSuccess: () => {
      toast({ title: "Speciality removed" });
      qc.invalidateQueries({ queryKey: ["specialities"] });
      setDeleteConfirm(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Fellowship Specialities</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage the master list of clinical specializations for all application forms.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 gap-2 h-11 px-6">
          <Plus className="h-4 w-4" /> Add Speciality
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading master data...</p>
        </div>
      ) : specialities.length === 0 ? (
        <Card className="border-dashed border-2 py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Star className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900">No specialities found</p>
              <p className="text-sm text-muted-foreground max-w-xs">Start by adding clinical specialities that candidates can apply for.</p>
            </div>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>Add your first speciality</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialities.map((s) => (
            <Card key={s.id} className="group hover:border-orange-200 transition-all shadow-sm hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono opacity-60">ID: {s.id}</Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(s)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Speciality Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Speciality</DialogTitle>
            <DialogDescription>Enter the name of the clinical speciality as it should appear in the application form.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Speciality Name</Label>
            <Input
              id="name"
              placeholder="e.g. Cornea & Refractive Surgery"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2 h-11"
              onKeyDown={(e) => e.key === 'Enter' && newName && createMutation.mutate(newName)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button 
              disabled={!newName || createMutation.isPending}
              onClick={() => createMutation.mutate(newName)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Speciality
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="text-gray-900">"{deleteConfirm?.name}"</strong>? 
              This will not affect existing submissions but it will disappear from new application forms.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Keep it</Button>
            <Button 
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Speciality"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

