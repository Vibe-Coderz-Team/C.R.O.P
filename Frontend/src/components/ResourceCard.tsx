import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Resource } from "@/services/api";
import { getBookedSeats } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import { Users, BookOpen, FlaskConical, Monitor, Building, Fuel, Droplets } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  LibrarySeat: <BookOpen className="h-5 w-5" />,
  LibraryBook: <BookOpen className="h-5 w-5" />,
  Lab: <FlaskConical className="h-5 w-5" />,
  NormalClass: <Users className="h-5 w-5" />,
  ProjectorClass: <Monitor className="h-5 w-5" />,
  LargeHall: <Building className="h-5 w-5" />,
  LPGStation: <Fuel className="h-5 w-5" />,
  WaterPoint: <Droplets className="h-5 w-5" />,
};

const statusColors: Record<string, string> = {
  Available: "bg-status-available/20 text-status-available border-status-available/30",
  Booked: "bg-status-booked/20 text-status-booked border-status-booked/30",
  Scarce: "bg-status-scarce/20 text-status-scarce border-status-scarce/30",
  Maintenance: "bg-status-maintenance/20 text-status-maintenance border-status-maintenance/30",
};

interface ResourceCardProps {
  resource: Resource;
  onClick: () => void;
}

const ResourceCard = ({ resource, onClick }: ResourceCardProps) => {
  const role = useAppStore((s) => s.role);
  const isConsumable = resource.category === "Consumable";
  const booked = getBookedSeats(resource.id);
  const fillPercent = isConsumable
    ? resource.current_level ?? 0
    : resource.status === "Booked"
    ? Math.round((booked / resource.capacity) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-5 text-left hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          {typeIcons[resource.type]}
          <span className="text-xs font-medium uppercase tracking-wider">{resource.type}</span>
        </div>
        <Badge variant="outline" className={statusColors[resource.status]}>
          {resource.status}
        </Badge>
      </div>

      <h3 className="font-semibold text-card-foreground mb-1">{resource.name}</h3>

      {isConsumable ? (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Level</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fillPercent < 20 ? "bg-status-scarce" : fillPercent < 50 ? "bg-status-maintenance" : "bg-status-available"
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Capacity</span>
            <span>
              {resource.status === "Booked" ? `${booked}/${resource.capacity}` : `0/${resource.capacity}`}
            </span>
          </div>
          <Progress
            value={resource.status === "Booked" ? (booked / resource.capacity) * 100 : 0}
            className="h-2"
          />
        </div>
      )}

      {role === "Management" && isConsumable && fillPercent < 20 && (
        <p className="text-xs text-destructive mt-2 animate-pulse-slow font-medium">⚠ Critical — Restock needed</p>
      )}
    </button>
  );
};

export default ResourceCard;
