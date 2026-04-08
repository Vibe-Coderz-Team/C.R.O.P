import { useState, useEffect } from "react";
import { fetchMyBookings, type UserBooking } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, ChevronDown, Clock, MapPin } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
];

interface MyBookingsProps {
  refreshKey: number;
}

const MyBookings = ({ refreshKey }: MyBookingsProps) => {
  const role = useAppStore((s) => s.role);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMyBookings(role);
      setBookings(data);
    };
    load();
  }, [role, refreshKey]);

  // Build lookup: day+slot -> booking
  const bookingMap = new Map<string, UserBooking>();
  bookings.forEach((b) => {
    bookingMap.set(`${b.day}-${b.time_slot}`, b);
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-8">
      <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-lg px-5 py-4 hover:border-primary/40 transition-all group">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">My Bookings</h3>
            <p className="text-xs text-muted-foreground">
              {bookings.length === 0 ? "No bookings yet" : `${bookings.length} active booking${bookings.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        {bookings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No bookings yet. Book a resource to see it here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      {b.resource_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{b.day}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-card-foreground mb-1">{b.resource_name}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{b.time_slot}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly calendar grid */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">Weekly Schedule</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-xs font-medium text-muted-foreground p-2 text-left w-[110px]">Time</th>
                      {DAYS.map((day) => (
                        <th key={day} className="text-xs font-medium text-muted-foreground p-2 text-center">{day.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((ts) => (
                      <tr key={ts} className="border-b border-border/50 last:border-0">
                        <td className="text-[11px] text-muted-foreground p-2 font-mono whitespace-nowrap">{ts}</td>
                        {DAYS.map((day) => {
                          const booking = bookingMap.get(`${day}-${ts}`);
                          return (
                            <td key={day} className="p-1">
                              {booking ? (
                                <div className="bg-primary/15 border border-primary/30 rounded-md px-1.5 py-1 text-center">
                                  <span className="text-[10px] text-primary font-medium leading-tight block truncate">
                                    {booking.resource_name}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-7 rounded-md bg-secondary/30" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MyBookings;
