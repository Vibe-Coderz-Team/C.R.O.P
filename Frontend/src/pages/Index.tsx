import { useEffect, useState, useCallback } from "react";
import { fetchResources, getAlerts, type Resource } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import Header from "@/components/Header";
import AlertBanner from "@/components/AlertBanner";
import ResourceCard from "@/components/ResourceCard";
import BookingPanel from "@/components/BookingPanel";
import ReportIssueModal from "@/components/ReportIssueModal";
import AddResourceModal from "@/components/AddResourceModal";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import MyBookings from "@/components/MyBookings";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  const { role, selectedResource, setSelectedResource, setShowAddModal } = useAppStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadResources = useCallback(async () => {
    setLoading(true);
    const data = await fetchResources();
    setResources(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleRefresh = useCallback(() => {
    loadResources();
    setRefreshKey((k) => k + 1);
  }, [loadResources]);

  // Filter resources by role
  const filtered = resources.filter((r) => r.allowed_roles.includes(role));
  const alerts = getAlerts(filtered);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <AlertBanner alerts={alerts} />

        {/* Role description + actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {role} Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "Student" && "Browse and book library seats, books, classrooms, and halls."}
              {role === "Teacher" && "Manage labs, classrooms, projector rooms, and more."}
              {role === "Management" && "Monitor campus resources, consumables, and analytics."}
            </p>
          </div>
          {role === "Teacher" && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          )}
        </div>

        {/* Analytics overview for all roles */}
        <AnalyticsDashboard resources={filtered} role={role} />

        {/* My Bookings (Student & Teacher) */}
        {role !== "Management" && <MyBookings refreshKey={refreshKey} />}

        {/* Weekly calendar for Student & Teacher */}
        {role !== "Management" && <WeeklyCalendar resources={filtered} />}

        {/* Resource grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No resources available for your role.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onClick={() => setSelectedResource(r)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Panels & Modals */}
      <BookingPanel
        resource={selectedResource}
        open={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        onRefresh={handleRefresh}
      />
      <ReportIssueModal onRefresh={handleRefresh} />
      <AddResourceModal onRefresh={handleRefresh} />
    </div>
  );
};

export default Index;
