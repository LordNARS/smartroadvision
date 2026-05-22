import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Trash2, Waves, Lightbulb, Cpu, Brain, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/future")({ component: FuturePage });

const modules = [
  { icon: Droplets, title: "Flood Monitoring", desc: "Real-time water level sensors across stormwater drains and underpasses with predictive flood alerts.", color: "from-info to-primary" },
  { icon: Trash2, title: "Waste Management", desc: "Smart bin fill-level tracking, route optimization, and complaint-driven collection scheduling.", color: "from-success to-primary" },
  { icon: Waves, title: "Water Leakage Detection", desc: "Pressure-anomaly detection in municipal pipelines with automated isolation valve triggers.", color: "from-primary to-accent" },
  { icon: Lightbulb, title: "Streetlight Monitoring", desc: "Per-pole uptime telemetry, energy analytics, and citizen-reported outage triage.", color: "from-warning to-accent" },
  { icon: Cpu, title: "IoT Integration", desc: "Unified MQTT/LoRaWAN gateway for traffic, environment, and infrastructure sensor fleets.", color: "from-accent to-primary" },
  { icon: Brain, title: "AI Road Prediction", desc: "ML-driven deterioration forecasts and preventive maintenance scheduling using historical data.", color: "from-primary to-accent" },
];

function FuturePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" /> Roadmap · Q3 onwards
          </div>
          <h1 className="mt-1 text-2xl font-bold">Future expansion modules</h1>
          <p className="text-sm text-muted-foreground">Pluggable subsystems prepared for the next smart-city release wave.</p>
        </div>
        <Badge className="bg-accent/20 text-accent border-accent/30">6 modules planned</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ icon: Icon, title, desc, color }) => (
          <Card key={title} className="glass border-border/60 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
            <CardHeader className="flex flex-row items-center gap-3">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${color} grid place-items-center glow`}>
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge variant="secondary" className="mt-1 bg-secondary/60 text-muted-foreground text-[10px]">PLANNED</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{desc}</p>
              <Button variant="ghost" className="px-0 hover:bg-transparent text-primary group/btn">
                Request early access <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
