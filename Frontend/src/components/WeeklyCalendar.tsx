import { useState, useMemo } from "react";
import type { Resource, WeeklySlot } from "@/services/api";
import { fetchWeeklySlots } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
];

interface WeeklyCalendarProps {
  resources: Resource[];
}

const slotColor: Record<string, string> = {
  Available: "bg-status-available/15 border-status-available/30 hover:bg-status-available/25",
  Booked: "bg-status-booked/15 border-status-booked/30",
  Maintenance: "bg-status-maintenance/15 border-status-maintenance/30",
};

const slotDot: Record<string, string> = {
  Available: "bg-status-available",
  Booked: "bg-status-booked",
  Maintenance: "bg-status-maintenance",
};

const WeeklyCalendar = ({ resources }: WeeklyCalendarProps) => {
  const role = useAppStore((s) => s.role);
  const setSelectedResource = useAppStore((s) => s.setSelectedResource);

  // Filter only spatial (bookable) resources
  const spatialResources = useMemo(
    () => resources.filter((r) => r.category === "Spatial"),
    [resources]
  );

  const [selectedResourceId, setSelectedResourceId] = useState<number | "all">("all");
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Week navigation (mock - just label)
  const [weekOffset, setWeekOffset] = useState(0);
  const weekLabel = weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : `Week +${weekOffset}`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const resourceIds = selectedResourceId === "all"
        ? spatialResources.map((r) => r.id)
        : [selectedResourceId];
      const data = await fetchWeeklySlots(resourceIds);
      setSlots(data);
      setLoading(false);
    };
    load();
  }, [selectedResourceId, spatialResources]);

  // Build grid: for "all" show summary per day/slot; for single resource show detailed
  const getSlotStatus = (day: string, timeSlot: string): { status: string; count: { available: number; booked: number; maintenance: number }; resources: WeeklySlot[] } => {
    const matching = slots.filter((s) => s.day === day && s.time_slot === timeSlot);
    const available = matching.filter((s) => s.status === "Available").length;
    const booked = matching.filter((s) => s.status === "Booked").length;
    const maintenance = matching.filter((s) => s.status === "Maintenance").length;

    let status = "Available";
    if (maintenance > 0 && available === 0 && booked === 0) status = "Maintenance";
    else if (booked > available) status = "Booked";

    return { status, count: { available, booked, maintenance }, resources: matching };
  };

  if (spatialResources.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Weekly Availability</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Week nav */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[80px] text-center">{weekLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Resource filter */}
          <Select
            value={String(selectedResourceId)}
            onValueChange={(v) => setSelectedResourceId(v === "all" ? "all" : Number(v))}
          >
            <SelectTrigger className="w-[180px] bg-secondary border-border h-9 text-sm">
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {spatialResources.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-status-available" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-status-booked" />
          <span className="text-xs text-muted-foreground">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-status-maintenance" />
          <span className="text-xs text-muted-foreground">Maintenance</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Loading schedule...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-xs font-medium text-muted-foreground p-2 text-left w-[120px]">Time</th>
                  {DAYS.map((day) => (
                    <th key={day} className="text-xs font-medium text-muted-foreground p-2 text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot) => (
                  <tr key={timeSlot} className="border-b border-border/50 last:border-0">
                    <td className="text-xs text-muted-foreground p-2 font-mono whitespace-nowrap">{timeSlot}</td>
                    {DAYS.map((day) => {
                      const { status, count } = getSlotStatus(day, timeSlot);
                      const isAll = selectedResourceId === "all";
                      const totalShown = count.available + count.booked + count.maintenance;

                      return (
                        <td key={day} className="p-1">
                          <button
                            className={`w-full rounded-md border p-1.5 transition-all text-center ${slotColor[status]} ${
                              status === "Available" ? "cursor-pointer" : "cursor-default"
                            }`}
                            onClick={() => {
                              if (status === "Available" && !isAll) {
                                const r = resources.find((r) => r.id === selectedResourceId);
                                if (r) setSelectedResource(r);
                              }
                            }}
                          >
                            {isAll ? (
                              <div className="flex items-center justify-center gap-1">
                                {count.available > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${slotDot.Available}`} />
                                    <span className="text-[10px] text-status-available font-medium">{count.available}</span>
                                  </span>
                                )}
                                {count.booked > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${slotDot.Booked}`} />
                                    <span className="text-[10px] text-status-booked font-medium">{count.booked}</span>
                                  </span>
                                )}
                                {count.maintenance > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${slotDot.Maintenance}`} />
                                    <span className="text-[10px] text-status-maintenance font-medium">{count.maintenance}</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className={`h-2 w-2 rounded-full ${slotDot[status]}`} />
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
