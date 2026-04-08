import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportIssue } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

interface ReportIssueModalProps {
  onRefresh: () => void;
}

const ReportIssueModal = ({ onRefresh }: ReportIssueModalProps) => {
  const { showReportModal, setShowReportModal, selectedResource, role } = useAppStore();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!selectedResource) return null;

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    const res = await reportIssue({
      resource_id: selectedResource.id,
      description,
      reported_by: role,
    });
    if (res.success) {
      toast.success(res.message);
      onRefresh();
      setShowReportModal(false);
      setDescription("");
    } else {
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Report Issue</DialogTitle>
          <DialogDescription>
            Report a problem with {selectedResource.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Textarea
            placeholder="Describe the issue (e.g., AC broken, projector not working...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] bg-secondary border-border"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!description.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Report Issue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueModal;
