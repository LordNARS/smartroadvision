import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("srm_user")) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@smartcity.gov");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    await login(email, password);
    toast.success("Authenticated. Welcome back.");
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-4">
      {/* animated background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl gradient-primary grid place-items-center glow">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-wide">SMARTROAD</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Municipal Control Center</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-1">Administrator access</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Secure sign-in for authorized city personnel.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Government email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 bg-secondary/50" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground glow hover:opacity-90">
              {loading ? "Authenticating…" : "Sign in securely"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            End-to-end encrypted · ISO 27001 compliant
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Demo credentials prefilled · For authorized use only
        </div>
      </div>
    </div>
  );
}
