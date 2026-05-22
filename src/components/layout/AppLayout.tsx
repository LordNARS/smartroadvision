import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Route as RouteIcon,
  MessageSquareWarning,
  Map,
  BarChart3,
  Rocket,
  Bell,
  LogOut,
  Search,
  Activity,
  Navigation,
} from "lucide-react";
import { useAuth, useApp, priorityLevel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/roads", label: "Road Management", icon: RouteIcon, exact: false },
  { to: "/routing", label: "Route Optimizer", icon: Navigation, exact: false },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning, exact: false },
  { to: "/map", label: "City Map", icon: Map, exact: false },
  { to: "/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/future", label: "Future Modules", icon: Rocket, exact: false },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const { roads, complaints } = useApp();
  const navigate = useNavigate();

  const alerts = roads.filter((r) => priorityLevel(r) === "High");
  const pendingComplaints = complaints.filter((c) => c.status === "Pending").length;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="relative h-9 w-9 rounded-xl gradient-primary grid place-items-center glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">SMARTROAD</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Municipal Ops</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{n.label}</span>
                {n.to === "/complaints" && pendingComplaints > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning border-warning/30">
                    {pendingComplaints}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              All systems nominal
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              v2.4 · Smart City Cell
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 md:px-6 h-16">
            <div className="md:hidden font-bold gradient-text">SMARTROAD</div>
            <div className="hidden md:flex relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roads, areas, complaints…"
                className="pl-9 bg-secondary/60 border-border/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate({ to: "/roads", search: { q: (e.target as HTMLInputElement).value } as never });
                }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 glass-strong">
                  <DropdownMenuLabel>Emergency alerts</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {alerts.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">No active alerts.</div>
                  )}
                  {alerts.slice(0, 5).map((a) => (
                    <DropdownMenuItem key={a.id} onClick={() => navigate({ to: "/roads" })} className="flex-col items-start gap-0.5">
                      <div className="flex items-center gap-2 w-full">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        <span className="font-medium text-sm">{a.name}</span>
                        <Badge className="ml-auto bg-destructive/20 text-destructive border-destructive/30">High</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.area} · urgent maintenance required</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl glass px-2.5 py-1.5">
                    <div className="h-7 w-7 rounded-lg gradient-primary grid place-items-center text-xs font-bold text-primary-foreground">
                      {user?.name?.[0] ?? "A"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-medium leading-tight">{user?.name}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{user?.email}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-2 border-b border-border/60">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${active ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground/80"}`}>
                {n.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 px-4 md:px-6 py-6 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
