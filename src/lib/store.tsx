import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type RoadStatus = "Pending" | "Under Repair" | "Completed";
export type Priority = "High" | "Medium" | "Low";
export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

export interface Road {
  id: string;
  name: string;
  area: string;
  traffic: number; // 0-100
  potholes: number; // 0-100
  accidents: number; // raw count
  costEstimate: number; // INR thousands
  status: RoadStatus;
  lat: number;
  lng: number;
}

export interface Complaint {
  id: string;
  roadId: string;
  citizen: string;
  description: string;
  imageUrl?: string;
  status: ComplaintStatus;
  createdAt: string;
  area: string;
}

export const calcPriorityScore = (r: Road) =>
  r.traffic * 0.4 + r.potholes * 0.4 + Math.min(r.accidents * 10, 100) * 0.2;

export const calcHealth = (r: Road) => Math.max(0, Math.round(100 - calcPriorityScore(r)));

export const priorityLevel = (r: Road): Priority => {
  const s = calcPriorityScore(r);
  if (s >= 65) return "High";
  if (s >= 40) return "Medium";
  return "Low";
};

const seedRoads: Road[] = [
  { id: "R-001", name: "MG Road", area: "Central", traffic: 92, potholes: 78, accidents: 6, costEstimate: 1200, status: "Pending", lat: 28, lng: 30 },
  { id: "R-002", name: "Ring Road East", area: "East Zone", traffic: 86, potholes: 64, accidents: 4, costEstimate: 980, status: "Under Repair", lat: 55, lng: 62 },
  { id: "R-003", name: "Lake View Avenue", area: "North Zone", traffic: 45, potholes: 30, accidents: 1, costEstimate: 320, status: "Completed", lat: 22, lng: 70 },
  { id: "R-004", name: "Industrial Highway", area: "West Zone", traffic: 88, potholes: 82, accidents: 7, costEstimate: 1450, status: "Pending", lat: 70, lng: 28 },
  { id: "R-005", name: "Park Street", area: "Central", traffic: 60, potholes: 42, accidents: 2, costEstimate: 420, status: "Under Repair", lat: 40, lng: 45 },
  { id: "R-006", name: "Tech Park Link", area: "South Zone", traffic: 74, potholes: 55, accidents: 3, costEstimate: 690, status: "Pending", lat: 80, lng: 78 },
  { id: "R-007", name: "Riverside Lane", area: "North Zone", traffic: 35, potholes: 22, accidents: 0, costEstimate: 180, status: "Completed", lat: 15, lng: 50 },
  { id: "R-008", name: "Airport Expressway", area: "South Zone", traffic: 95, potholes: 70, accidents: 5, costEstimate: 1600, status: "Under Repair", lat: 88, lng: 18 },
];

const seedComplaints: Complaint[] = [
  { id: "C-1001", roadId: "R-001", citizen: "Anita R.", description: "Massive pothole near the metro entrance, two-wheelers skidding.", status: "Pending", createdAt: "2026-05-18", area: "Central" },
  { id: "C-1002", roadId: "R-004", citizen: "Vikram S.", description: "Truck damaged the divider, debris on the road.", status: "In Progress", createdAt: "2026-05-19", area: "West Zone" },
  { id: "C-1003", roadId: "R-002", citizen: "Priya M.", description: "Drainage overflow after rain, water clogging.", status: "Resolved", createdAt: "2026-05-15", area: "East Zone" },
  { id: "C-1004", roadId: "R-008", citizen: "Rahul K.", description: "Streetlights non-functional for 400m stretch.", status: "Pending", createdAt: "2026-05-20", area: "South Zone" },
  { id: "C-1005", roadId: "R-006", citizen: "Sneha T.", description: "Cracked asphalt creating bumps near junction.", status: "In Progress", createdAt: "2026-05-17", area: "South Zone" },
];

interface AppState {
  roads: Road[];
  complaints: Complaint[];
  addRoad: (r: Omit<Road, "id" | "lat" | "lng">) => void;
  updateRoad: (id: string, patch: Partial<Road>) => void;
  deleteRoad: (id: string) => void;
  addComplaint: (c: Omit<Complaint, "id" | "createdAt" | "status">) => void;
  updateComplaint: (id: string, status: ComplaintStatus) => void;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [roads, setRoads] = useState<Road[]>(() => {
    if (typeof window === "undefined") return seedRoads;
    const s = localStorage.getItem("srm_roads");
    return s ? JSON.parse(s) : seedRoads;
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    if (typeof window === "undefined") return seedComplaints;
    const s = localStorage.getItem("srm_complaints");
    return s ? JSON.parse(s) : seedComplaints;
  });

  useEffect(() => { localStorage.setItem("srm_roads", JSON.stringify(roads)); }, [roads]);
  useEffect(() => { localStorage.setItem("srm_complaints", JSON.stringify(complaints)); }, [complaints]);

  const addRoad: AppState["addRoad"] = (r) => {
    const id = `R-${String(Date.now()).slice(-4)}`;
    setRoads((prev) => [
      ...prev,
      { ...r, id, lat: 20 + Math.random() * 70, lng: 20 + Math.random() * 70 },
    ]);
  };
  const updateRoad: AppState["updateRoad"] = (id, patch) =>
    setRoads((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const deleteRoad: AppState["deleteRoad"] = (id) =>
    setRoads((prev) => prev.filter((r) => r.id !== id));
  const addComplaint: AppState["addComplaint"] = (c) => {
    const id = `C-${Math.floor(1000 + Math.random() * 9000)}`;
    setComplaints((prev) => [
      { ...c, id, status: "Pending", createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
  };
  const updateComplaint: AppState["updateComplaint"] = (id, status) =>
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

  return (
    <AppCtx.Provider value={{ roads, complaints, addRoad, updateRoad, deleteRoad, addComplaint, updateComplaint }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}

// Auth
interface AuthState {
  isAuthed: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(() => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("srm_user");
    return s ? JSON.parse(s) : null;
  });
  const login: AuthState["login"] = async (email, _password) => {
    const u = { name: "Municipal Admin", email };
    localStorage.setItem("srm_user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("srm_user");
    setUser(null);
  };
  return (
    <AuthCtx.Provider value={{ isAuthed: !!user, user, login, logout }}>{children}</AuthCtx.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
