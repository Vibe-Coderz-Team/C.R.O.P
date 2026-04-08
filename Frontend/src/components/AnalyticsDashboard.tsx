import type { Resource, UserRole } from "@/services/api";
import { getBookedSeats } from "@/services/api";
import { BarChart3, AlertTriangle, Wrench, TrendingUp, Armchair, BookOpen, School, Fuel, Droplets } from "lucide-react";

interface AnalyticsDashboardProps {
  resources: Resource[];
  role: UserRole;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const AnalyticsDashboard = ({ resources, role }: AnalyticsDashboardProps) => {
  const total = resources.length;
  const available = resources.filter((r) => r.status === "Available").length;
  const booked = resources.filter((r) => r.status === "Booked").length;
  const scarce = resources.filter((r) => r.status === "Scarce").length;
  const maintenance = resources.filter((r) => r.status === "Maintenance").length;
  const utilization = total > 0 ? Math.round(((booked + maintenance) / total) * 100) : 0;

  // Seat stats
  const seatResources = resources.filter((r) => ["LibrarySeat", "NormalClass", "LargeHall", "Lab", "ProjectorClass"].includes(r.type));
  const totalSeats = seatResources.reduce((sum, r) => sum + r.capacity, 0);
  const bookedSeats = seatResources.reduce((sum, r) => sum + (r.status === "Booked" ? getBookedSeats(r.id) : 0), 0);
  const remainingSeats = totalSeats - bookedSeats;

  // Books & classrooms
  const availableBooks = resources.filter((r) => r.type === "LibraryBook" && r.status === "Available").length;
  const totalBooks = resources.filter((r) => r.type === "LibraryBook").length;
  const availableClassrooms = resources.filter((r) => ["NormalClass", "ProjectorClass", "Lab", "LargeHall"].includes(r.type) && r.status === "Available").length;
  const totalClassrooms = resources.filter((r) => ["NormalClass", "ProjectorClass", "Lab", "LargeHall"].includes(r.type)).length;

  const getStats = (): StatCard[] => {
    if (role === "Management") {
      return [
        { label: "Total Resources", value: total, icon: BarChart3, color: "text-primary" },
        { label: "Available", value: available, icon: TrendingUp, color: "text-status-available" },
        { label: "Scarcity Alerts", value: scarce, icon: AlertTriangle, color: "text-status-scarce" },
        { label: "Under Maintenance", value: maintenance, icon: Wrench, color: "text-status-maintenance" },
      ];
    }

    return [
      { label: "Seats Available", value: `${remainingSeats}/${totalSeats}`, icon: Armchair, color: "text-primary" },
      { label: "Books & Rooms", value: `${availableBooks}B · ${availableClassrooms}R`, icon: BookOpen, color: "text-status-available" },
      { label: "Scarcity Alerts", value: scarce, icon: AlertTriangle, color: "text-status-scarce" },
      { label: "Under Maintenance", value: maintenance, icon: Wrench, color: "text-status-maintenance" },
    ];
  };

  const stats = getStats();

  const title = role === "Management" ? "Campus Overview" : role === "Teacher" ? "Teaching Resources Overview" : "Student Resources Overview";

  // Maintenance items list
  const maintenanceItems = resources.filter((r) => r.status === "Maintenance");
  const scarceItems = resources.filter((r) => r.status === "Scarce");

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Scarcity alerts detail */}
        {scarceItems.length > 0 && (
          <div className="bg-card border border-status-scarce/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-status-scarce" />
              <span className="text-sm font-semibold text-status-scarce">Scarcity Alerts</span>
            </div>
            <div className="space-y-2">
              {scarceItems.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance detail */}
        {maintenanceItems.length > 0 && (
          <div className="bg-card border border-status-maintenance/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-status-maintenance" />
              <span className="text-sm font-semibold text-status-maintenance">Under Maintenance</span>
            </div>
            <div className="space-y-2">
              {maintenanceItems.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Utilization bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {role === "Management" ? "Campus Utilization" : "Resource Utilization"}
          </span>
          <span className="text-sm font-semibold text-foreground">{utilization}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
