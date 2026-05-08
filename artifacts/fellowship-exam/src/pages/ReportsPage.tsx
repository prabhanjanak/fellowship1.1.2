import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f43f5e"];

export default function ReportsPage() {
  const { data: batches = [], isLoading: loadingBatches } = useQuery({ 
    queryKey: ["batches"],
    queryFn: () => api.get<any[]>("/batches")
  });
  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({ 
    queryKey: ["candidates"],
    queryFn: () => api.get<any[]>("/candidates")
  });

  if (loadingBatches || loadingCandidates) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats calculation
  const totalCandidates = candidates.length;
  const totalBatches = batches.length;
  const approvedCount = candidates.filter((c: any) => c.status === "approved").length;
  
  // Chart data: Candidates per batch
  const batchData = batches.map((b: any) => ({
    name: b.name.split('-')[0].trim(),
    candidates: b.candidateCount || 0,
    avgScore: (Math.random() * 20 + 70).toFixed(1), // Mock avg score for now
  }));

  const statusData = [
    { name: "Approved", value: approvedCount },
    { name: "Pending", value: candidates.length - approvedCount },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights into candidate performance and recruitment status.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="px-3 py-1 gap-1.5 bg-white shadow-sm">
             <Filter className="h-3.5 w-3.5" /> Filter Range
           </Badge>
           <Badge variant="outline" className="px-3 py-1 gap-1.5 bg-white shadow-sm">
             <FileText className="h-3.5 w-3.5" /> Export PDF
           </Badge>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Applications", value: totalCandidates, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Batches", value: totalBatches, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Final Selections", value: approvedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completion Rate", value: "84%", icon: Award, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="md:col-span-2 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg">Candidates per Batch</CardTitle>
            <CardDescription>Distribution of applicants across different examination groups.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="candidates" radius={[6, 6, 0, 0]}>
                  {batchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg">Application Status</CardTitle>
            <CardDescription>Breakdown of current selection stage.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#e2e8f0"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
               <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Approved</div>
                 <span className="font-bold">{approvedCount}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200" /> Pending Review</div>
                 <span className="font-bold">{candidates.length - approvedCount}</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Performance Benchmarks */}
         <Card>
           <CardHeader>
             <CardTitle className="text-lg">Batch Average Scores</CardTitle>
             <CardDescription>Average performance metrics per component.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             {batches.slice(0, 4).map((b: any, i: number) => (
               <div key={b.id} className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium">{b.name}</span>
                   <span className="text-emerald-600 font-bold">Avg: {78 + i}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${78 + i}%` }} />
                 </div>
               </div>
             ))}
           </CardContent>
         </Card>

         {/* Alerts / Notifications */}
         <Card className="border-orange-100 bg-orange-50/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5" /> Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-3 bg-white rounded-lg border border-orange-100 flex items-center gap-3">
                  <Badge variant="destructive" className="h-5">Critical</Badge>
                  <p className="text-xs text-slate-700 font-medium">Batch #4 requires doctor scores for 12 candidates.</p>
               </div>
               <div className="p-3 bg-white rounded-lg border border-orange-100 flex items-center gap-3">
                  <Badge className="h-5 bg-blue-500">Notice</Badge>
                  <p className="text-xs text-slate-700 font-medium">6 Offer letters pending template assignment.</p>
               </div>
               <Separator />
               <Button variant="link" className="text-orange-600 text-xs h-auto p-0 font-bold">View all alerts →</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

