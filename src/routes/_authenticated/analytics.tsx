import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp, calcHealth } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

const monthlyTrend = [
  { m: "Dec", c: 32 }, { m: "Jan", c: 41 }, { m: "Feb", c: 38 },
  { m: "Mar", c: 55 }, { m: "Apr", c: 62 }, { m: "May", c: 48 },
];

function AnalyticsPage() {
  const { roads, complaints } = useApp();

  const damaged = useMemo(() =>
    [...roads].map((r) => ({ name: r.name, score: 100 - calcHealth(r) })).sort((a, b) => b.score - a.score).slice(0, 6),
  [roads]);

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    complaints.forEach((c) => map.set(c.area, (map.get(c.area) ?? 0) + 1));
    return Array.from(map.entries()).map(([area, count]) => ({ area, count }));
  }, [complaints]);

  const trafficImpact = roads.map((r) => ({ name: r.name.split(" ")[0], traffic: r.traffic, accidents: r.accidents * 10 }));

  const radar = ["Central", "East Zone", "West Zone", "North Zone", "South Zone"].map((z) => {
    const inZone = roads.filter((r) => r.area === z);
    const avgHealth = inZone.length ? Math.round(inZone.reduce((a, r) => a + calcHealth(r), 0) / inZone.length) : 0;
    return { zone: z, health: avgHealth };
  });

  const tooltipStyle = { background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.3 0.03 250)", borderRadius: 12 };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights across the city road network and complaint pipeline.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">Most damaged roads</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer><BarChart data={damaged}>
                <CartesianGrid stroke="oklch(0.3 0.03 250 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                <YAxis stroke="oklch(0.68 0.03 250)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" fill="oklch(0.78 0.16 200)" radius={[8, 8, 0, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">Area-wise complaint analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer><BarChart data={byArea}>
                <CartesianGrid stroke="oklch(0.3 0.03 250 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="area" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                <YAxis stroke="oklch(0.68 0.03 250)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="oklch(0.68 0.2 290)" radius={[8, 8, 0, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">Traffic impact vs accidents</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer><LineChart data={trafficImpact}>
                <CartesianGrid stroke="oklch(0.3 0.03 250 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                <YAxis stroke="oklch(0.68 0.03 250)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="traffic" stroke="oklch(0.78 0.16 200)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="accidents" stroke="oklch(0.65 0.24 25)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">Monthly complaint trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer><LineChart data={monthlyTrend}>
                <CartesianGrid stroke="oklch(0.3 0.03 250 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="oklch(0.68 0.03 250)" />
                <YAxis stroke="oklch(0.68 0.03 250)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="c" stroke="oklch(0.72 0.18 155)" strokeWidth={2} />
              </LineChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Zone-wise road health comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer><RadarChart data={radar}>
                <PolarGrid stroke="oklch(0.3 0.03 250 / 0.4)" />
                <PolarAngleAxis dataKey="zone" stroke="oklch(0.78 0.03 250)" />
                <PolarRadiusAxis stroke="oklch(0.5 0.03 250)" />
                <Radar dataKey="health" stroke="oklch(0.78 0.16 200)" fill="oklch(0.78 0.16 200)" fillOpacity={0.35} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
