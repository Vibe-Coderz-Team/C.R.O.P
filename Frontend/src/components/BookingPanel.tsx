import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Resource } from "@/services/api";
import { bookResource, getBookedSeats } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Clock, Brain, AlertTriangle, Users } from "lucide-react";

const timeSlots = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
];

const predictions = [
  "Predicted Busyness: 85% — Book well in advance!",
  "Predicted Busyness: 40% — Good availability expected.",
  "Predicted Busyness: 92% — Peak hours, plan accordingly!",
  "Predicted Busyness: 25% — Low demand, great time to book.",
  "Predicted Busyness: 70% — Moderate demand expected.",
];

interface BookingPanelProps {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const BookingPanel = ({ resource, open, onClose, onRefresh }: BookingPanelProps) => {
  const role = useAppStore((s) => s.role);
  const setShowReportModal = useAppStore((s) => s.setShowReportModal);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [liveBooked, setLiveBooked] = useState<number | null>(null);

  if (!resource) return null;

  const prediction = predictions[resource.id % predictions.length];
  const isConsumable = resource.category === "Consumable";
  const initialBooked = getBookedSeats(resource.id);
  const currentBooked = liveBooked ?? initialBooked;
  const fillPercent = resource.capacity > 0 ? Math.round((currentBooked / resource.capacity) * 100) : 0;
  const remaining = resource.capacity - currentBooked;

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    const res = await bookResource({ resource_id: resource.id, time_slot: selectedSlot, role });
    if (res.success) {
      toast.success(res.message);
      if (res.bookedCount !== undefined) {
        setLiveBooked(res.bookedCount);
      }
      onRefresh();
    } else {
      toast.error(res.message);
    }
    setBooking(false);
    setSelectedSlot(null);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleClose = () => {
    setLiveBooked(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-card-foreground">{resource.name}</SheetTitle>
          <SheetDescription>
            {resource.type} · {resource.category}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Smart Insight */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Smart Insight</span>
            </div>
            <p className="text-sm text-muted-foreground">{prediction}</p>
          </div>

          {/* Live seat counter */}
          {!isConsumable && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-card-foreground">Live Seat Tracker</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold text-foreground">{remaining}</span>
                  <span className="text-sm text-muted-foreground ml-1">seats left</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentBooked}/{resource.capacity} filled
                </span>
              </div>
              <Progress value={fillPercent} className="h-3" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">0%</span>
                <span className={`text-[10px] font-medium ${fillPercent > 80 ? "text-destructive" : fillPercent > 50 ? "text-status-maintenance" : "text-status-available"}`}>
                  {fillPercent}% occupied
                </span>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-xs">
                {remaining <= 0 ? "Full" : resource.status}
              </Badge>
            </div>
            {isConsumable && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Level</span>
                <span className="text-card-foreground font-medium">{resource.current_level}%</span>
              </div>
            )}
          </div>

          {/* Time slots */}
          {!isConsumable && role !== "Management" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">Select Time Slot</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-xs px-3 py-2 rounded-md border transition-all ${
                      selectedSlot === slot
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {!isConsumable && role !== "Management" && (
              <Button
                className="w-full"
                disabled={!selectedSlot || booking || resource.status === "Maintenance" || remaining <= 0}
                onClick={handleBook}
              >
                {booking ? "Booking..." : remaining <= 0 ? "Fully Booked" : "Confirm Booking"}
              </Button>
            )}
            {role !== "Management" && (
              <Button variant="outline" className="w-full gap-2" onClick={handleReport}>
                <AlertTriangle className="h-4 w-4" />
                Report Issue
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingPanel;
