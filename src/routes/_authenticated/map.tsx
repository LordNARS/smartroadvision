import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, calcHealth, priorityLevel, type Road } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/map")({ component: MapPage });

function colorFor(level: ReturnType<typeof priorityLevel>) {
  if (level === "High") return "oklch(0.65 0.24 25)";
  if (level === "Medium") return "oklch(0.82 0.17 80)";
  return "oklch(0.72 0.18 155)";
}

function MapPage() {
  const { roads, complaints } = useApp();
  const [selected, setSelected] = useState<Road | null>(null);

  const augmented = roads.map((r) => ({ ...r, level: priorityLevel(r), health: calcHealth(r) }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Interactive City Map</h1>
        <p className="text-sm text-muted-foreground">Visualize road risk in real-time. Click a node for details.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/60 lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Compass className="h-4 w-4 text-primary" /> Smart City Grid</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Safe</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 grid-bg bg-gradient-to-br from-background/40 to-secondary/20">
              {/* fake city avenues */}
              <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,25 L100,30" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
                <path d="M0,55 L100,50" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
                <path d="M0,80 L100,78" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
                <path d="M25,0 L30,100" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
                <path d="M55,0 L50,100" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
                <path d="M80,0 L78,100" stroke="oklch(0.78 0.16 200)" strokeWidth="0.3" />
              </svg>
              {/* scanning line */}
              <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-scan" />
              {/* road nodes */}
              {augmented.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${r.lng}%`, top: `${r.lat}%` }}
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-50"
                    style={{ background: colorFor(r.level) }}
                  />
                  <span
                    className="relative block h-4 w-4 rounded-full border-2 border-background shadow-lg"
                    style={{ background: colorFor(r.level) }}
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover/80 backdrop-blur px-2 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity border border-border/60">
                    {r.name}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Road details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected && <div className="text-sm text-muted-foreground py-10 text-center">Click a node on the map to inspect.</div>}
            {selected && (
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.area} · {selected.id}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="glass rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground">Health</div><div className="text-xl font-bold gradient-text">{calcHealth(selected)}%</div></div>
                  <div className="glass rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground">Priority</div><div className="mt-1"><Badge style={{ background: colorFor(priorityLevel(selected)) + "33", color: colorFor(priorityLevel(selected)) }}>{priorityLevel(selected)}</Badge></div></div>
                  <div className="glass rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground">Traffic</div><div className="text-lg font-semibold">{selected.traffic}</div></div>
                  <div className="glass rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground">Accidents</div><div className="text-lg font-semibold">{selected.accidents}</div></div>
                </div>
                <div className="text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Maintenance</div>
                  <div>{selected.status} · ₹{selected.costEstimate}k est.</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Linked complaints</div>
                  <div className="space-y-1.5">
                    {complaints.filter((c) => c.roadId === selected.id).map((c) => (
                      <div key={c.id} className="text-xs p-2 rounded bg-secondary/40 border border-border/60">
                        <span className="text-muted-foreground">{c.id}</span> · {c.description}
                      </div>
                    ))}
                    {complaints.filter((c) => c.roadId === selected.id).length === 0 && <div className="text-xs text-muted-foreground">No complaints filed.</div>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
