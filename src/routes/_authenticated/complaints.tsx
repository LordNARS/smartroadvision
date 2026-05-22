import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, type ComplaintStatus } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlus, MessageSquarePlus, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/complaints")({ component: ComplaintsPage });

function statusBadge(s: ComplaintStatus) {
  const map: Record<ComplaintStatus, string> = {
    Pending: "bg-warning/20 text-warning border-warning/30",
    "In Progress": "bg-info/20 text-info border-info/30",
    Resolved: "bg-success/20 text-success border-success/30",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}

function ComplaintsPage() {
  const { complaints, roads, addComplaint, updateComplaint } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ roadId: roads[0]?.id ?? "", citizen: "", description: "", imageUrl: "" });

  const filtered = useMemo(() => {
    let list = complaints;
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.description.toLowerCase().includes(s) || c.citizen.toLowerCase().includes(s) || c.area.toLowerCase().includes(s));
    }
    return list;
  }, [complaints, filter, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Citizen Complaints</h1>
          <p className="text-sm text-muted-foreground">Manage the public complaint pipeline end-to-end.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground glow"><MessageSquarePlus className="h-4 w-4 mr-1" /> File new complaint</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Citizen Complaint Portal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Citizen name</Label><Input value={form.citizen} onChange={(e) => setForm({ ...form, citizen: e.target.value })} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Road / area</Label>
                <Select value={form.roadId} onValueChange={(v) => setForm({ ...form, roadId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roads.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} — {r.area}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Describe the issue</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pothole near junction, water clogging…" /></div>
              <div className="space-y-1.5"><Label>Photo (optional)</Label>
                <div className="border border-dashed border-border/60 rounded-xl p-4 text-center bg-secondary/30 cursor-pointer hover:bg-secondary/50">
                  <ImagePlus className="h-6 w-6 mx-auto text-muted-foreground" />
                  <div className="text-xs text-muted-foreground mt-1">Drop image or paste URL</div>
                  <Input className="mt-2" placeholder="https://…" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => {
                    if (!form.citizen || !form.description) { toast.error("Name and description required"); return; }
                    const road = roads.find((r) => r.id === form.roadId);
                    addComplaint({ ...form, area: road?.area ?? "Unknown" });
                    toast.success("Complaint submitted — tracking ID assigned");
                    setForm({ roadId: roads[0]?.id ?? "", citizen: "", description: "", imageUrl: "" });
                    setOpen(false);
                  }}
                >Submit complaint</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/60">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Input placeholder="Search complaints…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px] bg-secondary/40" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] bg-secondary/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const road = roads.find((r) => r.id === c.roadId);
          return (
            <Card key={c.id} className="glass border-border/60 group hover:-translate-y-0.5 transition-transform">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{road?.name ?? c.roadId}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {c.area}
                  </div>
                </div>
                {statusBadge(c.status)}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/90">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.citizen}</span><span>{c.createdAt} · {c.id}</span>
                </div>
                <Select value={c.status} onValueChange={(v) => { updateComplaint(c.id, v as ComplaintStatus); toast.success(`Marked ${v}`); }}>
                  <SelectTrigger className="bg-secondary/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Mark Pending</SelectItem>
                    <SelectItem value="In Progress">Mark In Progress</SelectItem>
                    <SelectItem value="Resolved">Mark Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">No complaints match.</div>
        )}
      </div>
    </div>
  );
}
