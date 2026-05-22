import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, calcHealth, priorityLevel, type Road, type RoadStatus } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

type SearchParams = { q?: string };

export const Route = createFileRoute("/_authenticated/roads")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === "string" ? s.q : undefined }),
  component: RoadsPage,
});

const empty = { name: "", area: "", traffic: 50, potholes: 30, accidents: 1, costEstimate: 500, status: "Pending" as RoadStatus };

function priorityBadge(level: ReturnType<typeof priorityLevel>) {
  const map = {
    High: "bg-destructive/20 text-destructive border-destructive/30",
    Medium: "bg-warning/20 text-warning border-warning/30",
    Low: "bg-success/20 text-success border-success/30",
  };
  return <Badge className={map[level]}>{level}</Badge>;
}

function statusBadge(s: RoadStatus) {
  const map: Record<RoadStatus, string> = {
    Pending: "bg-warning/20 text-warning border-warning/30",
    "Under Repair": "bg-info/20 text-info border-info/30",
    Completed: "bg-success/20 text-success border-success/30",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}

function RoadForm({ initial, onSave, onClose }: { initial: typeof empty | Road; onSave: (v: typeof empty) => void; onClose: () => void }) {
  const [v, setV] = useState({ ...empty, ...initial });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2"><Label>Road name</Label><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Area / zone</Label><Input value={v.area} onChange={(e) => setV({ ...v, area: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Status</Label>
          <Select value={v.status} onValueChange={(s) => setV({ ...v, status: s as RoadStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2"><Label>Traffic density · {v.traffic}</Label>
          <Slider value={[v.traffic]} max={100} step={1} onValueChange={([x]) => setV({ ...v, traffic: x })} />
        </div>
        <div className="space-y-2 col-span-2"><Label>Pothole severity · {v.potholes}</Label>
          <Slider value={[v.potholes]} max={100} step={1} onValueChange={([x]) => setV({ ...v, potholes: x })} />
        </div>
        <div className="space-y-1.5"><Label>Accident count</Label><Input type="number" min={0} value={v.accidents} onChange={(e) => setV({ ...v, accidents: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Repair cost (₹k)</Label><Input type="number" min={0} value={v.costEstimate} onChange={(e) => setV({ ...v, costEstimate: +e.target.value })} /></div>
      </div>
      <div className="rounded-xl p-3 bg-secondary/40 border border-border/60 text-sm flex justify-between">
        <span>Auto-calculated health</span>
        <span className="font-bold gradient-text">{Math.max(0, Math.round(100 - (v.traffic * 0.4 + v.potholes * 0.4 + Math.min(v.accidents * 10, 100) * 0.2)))}%</span>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button className="gradient-primary text-primary-foreground" onClick={() => { onSave(v); onClose(); }}>Save road</Button>
      </DialogFooter>
    </div>
  );
}

function RoadsPage() {
  const { roads, addRoad, updateRoad, deleteRoad } = useApp();
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [priority, setPriority] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("priority");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Road | null>(null);

  const filtered = useMemo(() => {
    let list = roads.map((r) => ({ ...r, health: calcHealth(r), level: priorityLevel(r) }));
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(s) || r.area.toLowerCase().includes(s));
    }
    if (priority !== "all") list = list.filter((r) => r.level === priority);
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (sort === "priority") list.sort((a, b) => (100 - a.health) - (100 - b.health) > 0 ? -1 : 1).reverse(); // approximate
    if (sort === "health") list.sort((a, b) => a.health - b.health);
    if (sort === "cost") list.sort((a, b) => b.costEstimate - a.costEstimate);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [roads, q, priority, status, sort]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Road Management</h1>
          <p className="text-sm text-muted-foreground">Add, monitor, and prioritize roads across the city network.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground glow" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-1" /> Add road
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>{editing ? "Edit road" : "Register new road"}</DialogTitle></DialogHeader>
            <RoadForm
              initial={editing ?? empty}
              onClose={() => setOpen(false)}
              onSave={(v) => {
                if (editing) { updateRoad(editing.id, v); toast.success("Road updated"); }
                else { addRoad(v); toast.success("Road registered"); }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/60">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or area…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-secondary/40" />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[160px] bg-secondary/40"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-secondary/40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] bg-secondary/40"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="health">Sort: Health (low→high)</SelectItem>
              <SelectItem value="cost">Sort: Cost</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>Road</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Traffic</TableHead>
              <TableHead>Potholes</TableHead>
              <TableHead>Accidents</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="border-border/60 hover:bg-secondary/30">
                <TableCell className="font-medium">{r.name}<div className="text-xs text-muted-foreground">{r.id}</div></TableCell>
                <TableCell>{r.area}</TableCell>
                <TableCell>{r.traffic}</TableCell>
                <TableCell>{r.potholes}</TableCell>
                <TableCell>{r.accidents}</TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Progress value={r.health} className="h-1.5 w-16" />
                    <span className="text-xs">{r.health}%</span>
                  </div>
                </TableCell>
                <TableCell>{priorityBadge(r.level)}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell>₹{r.costEstimate}k</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { deleteRoad(r.id); toast.success("Road removed"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">No roads match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
