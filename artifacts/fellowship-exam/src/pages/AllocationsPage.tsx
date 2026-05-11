import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Loader2,
  Download,
  CheckCircle2,
  UserCheck,
  Trophy,
  Filter,
  BarChart3,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import * as XLSX from 'xlsx';

export default function AllocationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterSpec, setFilterSpec] = useState<string | null>(null);

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => api.get<any[]>("/candidates"),
  });

  const { data: matrixData, isLoading: isLoadingMatrix } = useQuery({
    queryKey: ["seat-matrix"],
    queryFn: () => api.get<any>("/seat-matrix"),
  });

  const isLoading = isLoadingCandidates || isLoadingMatrix;

  // Extract specializations and seat counts from matrixData
  const SPECIALIZATIONS = matrixData?.rows?.map((r: any) => r.speciality) || [];
  const SEAT_MATRIX: Record<string, number> = {};
  matrixData?.rows?.forEach((r: any) => {
    SEAT_MATRIX[r.speciality] = r.total;
  });

  // Calculate scores and sort
  const scoredCandidates = candidates
    .map((c: any) => {
      // Use actual interview average if available, otherwise fallback to 0
      const interviewAvg = c.interviewScore || 0;
      
        ...c,
        totalScore: (c.mcqScore || 0) + (c.psychometricScore || 0) + interviewAvg,
        interviewAvg,
        preferences: c.specializations || [],
        parsedCenterPreference: (() => {
          try {
            return typeof c.centerPreference === 'string' ? JSON.parse(c.centerPreference) : c.centerPreference || {};
          } catch(e) { return {}; }
        })()
      };
    })
    .sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));

  const allocationMutation = useMutation({
    mutationFn: ({ id, specialization }: { id: number, specialization: string }) => 
      api.patch(`/candidates/${id}`, { status: 'allocated', reviewNotes: `Allocated to ${specialization}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["seat-matrix"] });
      toast({ title: "Allocation Successful", description: "Candidate has been assigned to the specialization." });
    }
  });

  const autoAllocateMutation = useMutation({
    mutationFn: async (plan: { id: number, specialization: string }[]) => {
      for (const item of plan) {
        await api.patch(`/candidates/${item.id}`, { status: 'allocated', reviewNotes: `Allocated to ${item.specialization}` });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["seat-matrix"] });
      toast({ title: "Auto-Allocation Complete", description: "Candidates have been assigned based on merit and preferences." });
    }
  });

  const handleAutoAllocate = () => {
    const plan: { id: number, specialization: string }[] = [];
    const tempOccupancy = { ...occupancy };
    
    scoredCandidates.forEach((c: any) => {
      if (c.status === 'allocated') return;
      
      for (const pref of c.preferences) {
        if ((tempOccupancy[pref] || 0) < (SEAT_MATRIX[pref] || 0)) {
          plan.push({ id: c.id, specialization: pref });
          tempOccupancy[pref] = (tempOccupancy[pref] || 0) + 1;
          break;
        }
      }
    });

    if (plan.length === 0) {
      toast({ title: "Nothing to allocate", description: "All candidates are either allocated or no seats match their preferences." });
      return;
    }

    if (confirm(`This will automatically allocate ${plan.length} candidates based on merit. Proceed?`)) {
      autoAllocateMutation.mutate(plan);
    }
  };

  const exportToExcel = () => {
    const data = scoredCandidates.map((c: any, index: number) => ({
      Rank: index + 1,
      "Candidate Code": c.candidateCode,
      Name: c.fullName,
      "MCQ Score": c.mcqScore || 0,
      "Psych Score": c.psychometricScore || 0,
      "Interview Score": c.interviewAvg.toFixed(2),
      "Total Score": c.totalScore.toFixed(2),
      "Preferences": c.preferences.map((p: string) => {
         const units = c.parsedCenterPreference[p];
         return `${p} ${Array.isArray(units) && units.length ? `(${units.join(', ')})` : ''}`;
      }).join("; "),
      "Current Status": c.status,
      "Allocated Specialization": c.status === 'allocated' ? c.reviewNotes?.replace('Allocated to ', '') : 'Pending'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocations");
    XLSX.writeFile(workbook, `Fellowship_Allocations_JUL_2026.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate current occupancy from the matrixData
  const occupancy: Record<string, number> = {};
  matrixData?.rows?.forEach((r: any) => {
    occupancy[r.speciality] = r.totalAllocated || 0;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merit-Based Allocation</h1>
          <p className="text-muted-foreground">JULY 2026 Batch — Final Seat Assignment Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleAutoAllocate} variant="default" className="gap-2 bg-primary hover:bg-primary/90" disabled={autoAllocateMutation.isPending}>
            {autoAllocateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
            Smart Auto-Allocate
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
            <Download className="h-4 w-4" /> Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Seat Matrix Sidebar */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Seat Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {SPECIALIZATIONS.map(spec => {
              const total = SEAT_MATRIX[spec] || 0;
              const filled = occupancy[spec] || 0;
              const percent = (filled / total) * 100;
              
              return (
                <div key={spec} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="truncate max-w-[150px]">{spec}</span>
                    <span>{filled} / {total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${percent >= 100 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t mt-4 flex justify-between items-center text-xs font-bold text-slate-600">
              <span>TOTAL SEATS</span>
              <span>{Object.values(occupancy).reduce((a,b)=>a+b, 0)} / {Object.values(SEAT_MATRIX).reduce((a,b)=>a+b, 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Merit List */}
        <Card className="md:col-span-3 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-white">
            <CardTitle className="text-lg">Merit Merit List (Ranked by Total Score)</CardTitle>
            <div className="flex gap-2">
               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-2 py-0.5">MCQ + Psych + Interview</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Preferences</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoredCandidates.map((c: any, index: number) => {
                  const isAllocated = c.status === 'allocated' && c.reviewNotes?.startsWith('Allocated to ');
                  const allocatedSpec = isAllocated ? c.reviewNotes.replace('Allocated to ', '') : null;
                  
                  return (
                    <TableRow key={c.id} className={isAllocated ? "bg-emerald-50/30" : ""}>
                      <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold">{c.fullName}</div>
                        <div className="text-[10px] text-muted-foreground">{c.candidateCode}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">M: {c.mcqScore || 0} | P: {c.psychometricScore || 0}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Int: {c.interviewAvg.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-black text-primary">{c.totalScore.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {c.preferences.slice(0, 3).map((p: string, i: number) => {
                            const preferredUnits = c.parsedCenterPreference[p];
                            return (
                            <div key={i} className="flex flex-col gap-0.5 group">
                              <div className="flex items-center gap-1.5">
                                <Badge variant={p === allocatedSpec ? "default" : "outline"} className={`text-[9px] h-4 px-1 ${p === allocatedSpec ? "bg-emerald-600" : "text-muted-foreground"}`}>
                                  {i + 1}
                                </Badge>
                                <span className={`text-[11px] ${p === allocatedSpec ? "font-bold text-emerald-700" : "text-slate-600"}`}>
                                  {p}
                                </span>
                                {!isAllocated && (occupancy[p] || 0) < (SEAT_MATRIX[p] || 0) && (
                                  <button 
                                    onClick={() => allocationMutation.mutate({ id: c.id, specialization: p })}
                                    className="hidden group-hover:flex items-center text-[10px] text-emerald-600 font-bold hover:underline"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-0.5" /> Allocate
                                  </button>
                                )}
                              </div>
                              {Array.isArray(preferredUnits) && preferredUnits.length > 0 && (
                                <div className="text-[9px] text-muted-foreground ml-6">
                                  📍 {preferredUnits.join(", ")}
                                </div>
                              )}
                            </div>
                          )})}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAllocated ? (
                          <div className="flex flex-col items-end">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                              <UserCheck className="h-3 w-3 mr-1" /> ALLOCATED
                            </Badge>
                            <span className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{allocatedSpec}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Pending...</div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

