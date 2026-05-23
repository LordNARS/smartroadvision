import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp, calcHealth, type Road } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Navigation,
  Sparkles,
  ShieldCheck,
  Fuel,
  Clock,
  Gauge,
  Smile,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Route as RouteIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/routing")({
  head: () => ({
    meta: [
      { title: "Smooth Route Optimization — SmartRoad" },
      {
        name: "description",
        content:
          "AI-powered routing engine that recommends the smoothest, safest, and most fuel efficient path using live road health, pothole and accident data.",
      },
    ],
  }),
  component: RoutingPage,
});

type Profile = "smooth" | "safe" | "fuel";

interface ScoredRoute {
  id: string;
  profile: Profile;
  label: string;
  tagline: string;
  icon: typeof Sparkles;
  accent: string; // tailwind color class for accents
  roads: Road[];
  distanceKm: number;
  baseMinutes: number;
  travelMinutes: number;
  smoothness: number; // 0-100
  safety: number; // 0-100
  fuel: number; // L per route
  comfort: "Excellent" | "Good" | "Fair" | "Rough";
  score: number; // composite
}

const PROFILES: Record<Profile, { label: string; tagline: string; icon: typeof Sparkles; accent: string }> = {
  smooth: {
    label: "Smoothest Route",
    tagline: "Best road surface, fewest potholes",
    icon: Sparkles,
    accent: "text-primary",
  },
  safe: {
    label: "Safest Route",
    tagline: "Lowest accident risk corridor",
    icon: ShieldCheck,
    accent: "text-success",
  },
  fuel: {
    label: "Fuel Efficient",
    tagline: "Steady traffic, optimized distance",
    icon: Fuel,
    accent: "text-warning",
  },
};

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRoute(roads: Road[], profile: Profile): Road[] {
  // Pick a 3-4 segment "route" by sorting roads according to the profile bias
  const scored = roads.map((r) => {
    const health = calcHealth(r);
    let s = 0;
    if (profile === "smooth") s = health * 1.0 - r.potholes * 0.6;
    if (profile === "safe") s = health * 0.6 - r.accidents * 12 - r.potholes * 0.2;
    if (profile === "fuel") s = health * 0.4 - r.traffic * 0.7;
    return { r, s };
  });
  scored.sort((a, b) => b.s - a.s);
  const seed = profile === "smooth" ? 7 : profile === "safe" ? 13 : 21;
  return shuffle(scored.slice(0, Math.min(5, scored.length)), seed).slice(0, 4).map((x) => x.r);
}

function scoreRoute(
  roads: Road[],
  profile: Profile,
  source: string,
  destination: string,
): ScoredRoute {
  const p = PROFILES[profile];
  const avg = (sel: (r: Road) => number) =>
    roads.reduce((acc, r) => acc + sel(r), 0) / Math.max(1, roads.length);

  const avgPothole = avg((r) => r.potholes);
  const avgTraffic = avg((r) => r.traffic);
  const avgHealth = avg((r) => calcHealth(r));
  const totalAccidents = roads.reduce((a, r) => a + r.accidents, 0);

  // Synthetic distance & time, deterministic per profile
  const distanceKm = +(
    8 +
    roads.length * 2.4 +
    (profile === "fuel" ? -1.2 : profile === "safe" ? 1.6 : 0)
  ).toFixed(1);

  const baseMinutes = Math.round((distanceKm / 35) * 60);
  // Traffic and potholes slow you down
  const trafficPenalty = (avgTraffic / 100) * 14;
  const potholePenalty = (avgPothole / 100) * (profile === "smooth" ? 4 : 9);
  const travelMinutes = Math.max(
    8,
    Math.round(baseMinutes + trafficPenalty + potholePenalty),
  );

  const smoothness = Math.round(
    Math.max(0, Math.min(100, avgHealth - avgPothole * 0.35 - totalAccidents * 2)),
  );
  const safety = Math.round(
    Math.max(0, Math.min(100, 100 - totalAccidents * 9 - avgPothole * 0.25)),
  );

  // L/100km baseline 6.5, traffic adds, smoothness reduces
  const consumption = 6.5 + (avgTraffic / 100) * 3.2 - (smoothness / 100) * 1.6;
  const fuel = +((consumption * distanceKm) / 100).toFixed(2);

  const comfort: ScoredRoute["comfort"] =
    smoothness >= 80
      ? "Excellent"
      : smoothness >= 60
        ? "Good"
        : smoothness >= 40
          ? "Fair"
          : "Rough";

  const profileWeight =
    profile === "smooth"
      ? smoothness * 0.6 + safety * 0.25 + (100 - avgTraffic) * 0.15
      : profile === "safe"
        ? safety * 0.65 + smoothness * 0.25 + (100 - avgTraffic) * 0.1
        : (100 - avgTraffic) * 0.5 + smoothness * 0.3 + safety * 0.2;

  return {
    id: `${profile}-${source}-${destination}`.replace(/\s+/g, "-"),
    profile,
    label: p.label,
    tagline: p.tagline,
    icon: p.icon,
    accent: p.accent,
    roads,
    distanceKm,
    baseMinutes,
    travelMinutes,
    smoothness,
    safety,
    fuel,
    comfort,
    score: Math.round(profileWeight),
  };
}

function RouteMap({ route, highlight }: { route: ScoredRoute | null; highlight: boolean }) {
  if (!route) return null;
  const pts = route.roads.map((r, i) => {
    // arrange along a curved path
    const t = i / Math.max(1, route.roads.length - 1);
    const x = 8 + t * 84;
    const y = 70 - Math.sin(t * Math.PI) * 40 + (i % 2 === 0 ? -2 : 2);
    return { x, y, r };
  });
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${route.id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* grid */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * 10}
          x2={100}
          y2={i * 10}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="0.2"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={i * 10}
          y1={0}
          x2={i * 10}
          y2={100}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="0.2"
        />
      ))}
      <path
        d={path}
        fill="none"
        stroke={`url(#grad-${route.id})`}
        strokeWidth={highlight ? 2.4 : 1.6}
        strokeLinecap="round"
        strokeDasharray={highlight ? "0" : "1.5 1.5"}
        className={highlight ? "animate-pulse-glow" : ""}
      />
      {pts.map((p, i) => {
        const isEnd = i === 0 || i === pts.length - 1;
        return (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isEnd ? 2.4 : 1.6}
              fill={isEnd ? "hsl(var(--primary))" : "hsl(var(--background))"}
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
            />
            {isEnd && (
              <text
                x={p.x}
                y={p.y - 4}
                fontSize="3"
                textAnchor="middle"
                fill="hsl(var(--foreground))"
              >
                {i === 0 ? "A" : "B"}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RoutingPage() {
  const { roads } = useApp();
  const areas = useMemo(
    () => Array.from(new Set(roads.map((r) => r.area))),
    [roads],
  );
  const [source, setSource] = useState(areas[0] ?? "Central");
  const [destination, setDestination] = useState(areas[areas.length - 1] ?? "South Zone");
  const [results, setResults] = useState<ScoredRoute[] | null>(null);
  const [selected, setSelected] = useState<Profile>("smooth");

  const compute = () => {
    const pool = roads.length
      ? roads
      : [];
    if (pool.length === 0) return;
    const profiles: Profile[] = ["smooth", "safe", "fuel"];
    const computed = profiles.map((p) =>
      scoreRoute(pickRoute(pool, p), p, source, destination),
    );
    setResults(computed);
    setSelected("smooth");
  };

  const selectedRoute = results?.find((r) => r.profile === selected) ?? null;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Navigation className="h-3.5 w-3.5" /> Route Intelligence
            </div>
            <h1 className="text-3xl font-bold mt-1 gradient-text">Smooth Route Optimization</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Real-time routing engine balancing pothole severity, road health,
              traffic density and accident risk to recommend the optimal path.
            </p>
          </div>
        </div>

        {/* Trip planner */}
        <Card className="glass-strong border-border/60 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          </div>
          <CardContent className="relative p-5 md:p-6">
            <div className="grid md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  From
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="pl-9 bg-secondary/60 border-border/60 h-11">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="hidden md:flex md:col-span-1 justify-center pb-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  To
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger className="pl-9 bg-secondary/60 border-border/60 h-11">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="md:col-span-3">
                <Button
                  onClick={compute}
                  className="w-full h-11 gradient-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Route
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Pothole severity
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Road health score
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Traffic density
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Accident risk
              </div>
            </div>
          </CardContent>
        </Card>

        {!results && (
          <Card className="glass border-dashed border-border/60">
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary grid place-items-center mb-4 glow">
                <RouteIcon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Plan your trip</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Choose a source and destination, then let the optimizer compare
                three intelligent routing strategies in real time.
              </p>
            </CardContent>
          </Card>
        )}

        {results && (
          <>
            {/* Route comparison cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {results.map((r) => {
                const Icon = r.icon;
                const active = selected === r.profile;
                return (
                  <button
                    key={r.profile}
                    onClick={() => setSelected(r.profile)}
                    className={`text-left rounded-2xl p-5 border transition-all relative overflow-hidden ${
                      active
                        ? "glass-strong border-primary/50 shadow-xl shadow-primary/20 -translate-y-0.5"
                        : "glass border-border/60 hover:border-border"
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-x-0 top-0 h-0.5 gradient-primary" />
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl grid place-items-center bg-secondary/60 ${r.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{r.label}</div>
                          <div className="text-[11px] text-muted-foreground">{r.tagline}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/80">
                        {r.score}/100
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="glass rounded-lg p-2">
                        <div className="text-[10px] uppercase text-muted-foreground">Time</div>
                        <div className="font-semibold text-sm flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" /> {r.travelMinutes}m
                        </div>
                      </div>
                      <div className="glass rounded-lg p-2">
                        <div className="text-[10px] uppercase text-muted-foreground">Dist</div>
                        <div className="font-semibold text-sm">{r.distanceKm} km</div>
                      </div>
                      <div className="glass rounded-lg p-2">
                        <div className="text-[10px] uppercase text-muted-foreground">Fuel</div>
                        <div className="font-semibold text-sm">{r.fuel} L</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Metric label="Smoothness" value={r.smoothness} icon={Gauge} tone="primary" />
                      <Metric label="Safety" value={r.safety} icon={ShieldCheck} tone="success" />
                      <Metric label="Comfort" value={comfortToScore(r.comfort)} icon={Smile} tone="accent" suffix={` · ${r.comfort}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map + breakdown */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="glass-strong border-border/60 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Route preview</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {source} <ArrowRight className="inline h-3 w-3 mx-1" /> {destination}
                    </p>
                  </div>
                  {selectedRoute && (
                    <Badge className="gradient-primary text-primary-foreground border-0">
                      {selectedRoute.label}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-[16/9] rounded-xl glass overflow-hidden relative">
                    <div className="absolute inset-0 opacity-50 pointer-events-none">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.15),transparent_50%)]" />
                    </div>
                    <RouteMap route={selectedRoute} highlight />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Segment breakdown</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Roads on the {selectedRoute?.label.toLowerCase()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedRoute?.roads.map((r, i) => {
                    const health = calcHealth(r);
                    const risky = r.accidents >= 4 || r.potholes >= 70;
                    return (
                      <div key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg gradient-primary grid place-items-center text-[11px] font-bold text-primary-foreground shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">{r.name}</div>
                            {risky && (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>{r.area}</span>
                            <span>·</span>
                            <span>Health {health}</span>
                            <span>·</span>
                            <span>Potholes {r.potholes}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedRoute && (
                    <div className="mt-2 glass rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex justify-between"><span className="text-muted-foreground">Base travel</span><span>{selectedRoute.baseMinutes} min</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Traffic + surface delay</span><span>+{selectedRoute.travelMinutes - selectedRoute.baseMinutes} min</span></div>
                      <div className="flex justify-between font-semibold pt-1.5 border-t border-border/60"><span>Estimated arrival</span><span>{selectedRoute.travelMinutes} min</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
  );
}

function comfortToScore(c: ScoredRoute["comfort"]) {
  return c === "Excellent" ? 92 : c === "Good" ? 75 : c === "Fair" ? 55 : 32;
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  icon: typeof Gauge;
  tone: "primary" | "success" | "accent";
  suffix?: string;
}) {
  const color =
    tone === "primary"
      ? "bg-primary"
      : tone === "success"
        ? "bg-success"
        : "bg-accent";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <span className="font-medium">
          {value}
          <span className="text-muted-foreground">{suffix ?? "/100"}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
