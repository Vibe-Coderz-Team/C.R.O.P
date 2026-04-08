import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  alerts: string[];
}

const AlertBanner = ({ alerts }: AlertBannerProps) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          {alerts.map((alert, i) => (
            <p key={i} className="text-sm text-destructive font-medium">{alert}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
