import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addResource, type ResourceType } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

const spatialTypes: ResourceType[] = ["Lab", "ProjectorClass", "NormalClass", "LargeHall"];

const AddResourceModal = ({ onRefresh }: { onRefresh: () => void }) => {
  const { showAddModal, setShowAddModal } = useAppStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<ResourceType>("Lab");
  const [capacity, setCapacity] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    await addResource({
      name,
      category: "Spatial",
      type,
      capacity: parseInt(capacity) || 30,
      allowed_roles: "Student,Teacher,Management",
    });
    toast.success(`${name} added successfully`);
    onRefresh();
    setShowAddModal(false);
    setName("");
    setSubmitting(false);
  };

  return (
    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add New Resource</DialogTitle>
          <DialogDescription>Create a new classroom or lab resource</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., AI Lab 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spatialTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button disabled={!name.trim() || submitting} onClick={handleSubmit}>
              {submitting ? "Adding..." : "Add Resource"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceModal;
