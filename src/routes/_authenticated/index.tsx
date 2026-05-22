import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp, calcHealth, priorityLevel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Route as RouteIcon,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Flame,
  TrendingUp,
  Activity as ActivityIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const trend = [
  { m: "Dec", complaints: 32, repairs: 18 },
  { m: "Jan", complaints: 41, repairs: 22 },
  { m: "Feb", complaints: 38, repairs: 26 },
  { m: "Mar", complaints: 55, repairs: 30 },
  { m: "Apr", complaints: 62, repairs: 35 },
  { m: "May", complaints: 48, repairs: 41 },
];

function Stat({ label, value, icon: Icon, accent, sub }: { label: string; value: string | number; icon: React.ElementType; accent: string; sub?: string }) {
  return (
    <Card className="glass border-border/60 overflow-hidden relative group hover:-translate-y-0.5 transition-transform">
      <div className={`absolute inset-x-0 top-0 h-px ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
            {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
          </div>
          <div className={`h-10 w-10 rounded-xl grid place-items-center ${accent.replace("bg-", "bg-").replace("/60", "/15")}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { roads, complaints } = useApp();
  const totals = useMemo(() => {
    const high = roads.filter((r) => priorityLevel(r) === "High").length;
    const repair = roads.filter((r) => r.status === "Under Repair").length;
    const done = roads.filter((r) => r.status === "Completed").length;
    const active = complaints.filter((c) => c.status !== "Resolved").length;
    return { total: roads.length, high, repair, done, active };
  }, [roads, complaints]);

  const statusData = [
    { name: "Pending", value: roads.filter((r) => r.status === "Pending").length, color: "oklch(0.82 0.17 80)" },
    { name: "Under Repair", value: totals.repair, color: "oklch(0.72 0.15 230)" },
    { name: "Completed", value: totals.done, color: "oklch(0.72 0.18 155)" },
  ];

  const recentAlerts = roads
    .map((r) => ({ ...r, score: 100 - calcHealth(r), level: priorityLevel(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Municipal Control Center</div>
          <h1 className="mt-1 text-3xl font-bold">City road network <span className="gradient-text">at a glance</span></h1>
        </div>
        <div className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          Live telemetry · updated just now
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Stat label="Total Roads" value={totals.total} icon={RouteIcon} accent="bg-primary/60" sub="across 5 zones" />
        <Stat label="Active Complaints" value={totals.active} icon={AlertTriangle} accent="bg-warning/60" sub="awaiting action" />
        <Stat label="High Priority" value={totals.high} icon={Flame} accent="bg-destructive/60" sub="urgent maintenance" />
        <Stat label="Under Repair" value={totals.repair} icon={Wrench} accent="bg-info/60" sub="in progress" />
        <Stat label="Completed" value={totals.done} icon={CheckCircle2} accent="bg-success/60" sub="this cycle" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/60 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Complaints vs Repairs · 6 months</CardTitle>
            <Badge variant="secondary" className="bg-success/15 text-success border-success/30">
              <TrendingUp className="h-3 w-3 mr-1" /> +18% resolution
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 200)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 200)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.68 0.2 290)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.68 0.2 290)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.3 0.03 250 / 0.3)" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="oklch(0.68 0.03 250)" />
                  <YAxis stroke="oklch(0.68 0.03 250)" />
                  <Tooltip contentStyle={{ background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.3 0.03 250)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="complaints" stroke="oklch(0.78 0.16 200)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="repairs" stroke="oklch(0.68 0.2 290)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">Road status distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                    {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.3 0.03 250)", borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Recent emergency alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60">
                <div className={`h-9 w-9 rounded-lg grid place-items-center ${a.level === "High" ? "bg-destructive/20 text-destructive" : a.level === "Medium" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}>
                  <Flame className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.area} · Health {100 - a.score}%</div>
                </div>
                <Badge className={a.level === "High" ? "bg-destructive/20 text-destructive border-destructive/30" : a.level === "Medium" ? "bg-warning/20 text-warning border-warning/30" : "bg-success/20 text-success border-success/30"}>
                  {a.level}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> Activity timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative border-l border-border/60 ml-2 space-y-5">
              {[
                { t: "10 min ago", text: "Repair crew dispatched to Industrial Highway", tag: "DISPATCH" },
                { t: "1 hr ago", text: "New citizen complaint on Airport Expressway", tag: "COMPLAINT" },
                { t: "3 hr ago", text: "MG Road priority escalated to HIGH", tag: "ALERT" },
                { t: "Yesterday", text: "Lake View Avenue marked Completed", tag: "RESOLVED" },
                { t: "2 days ago", text: "Quarterly inspection scheduled for West Zone", tag: "SCHEDULE" },
              ].map((e, i) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full gradient-primary" />
                  <div className="text-xs text-muted-foreground">{e.t} · <span className="text-primary font-medium">{e.tag}</span></div>
                  <div className="text-sm">{e.text}</div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
