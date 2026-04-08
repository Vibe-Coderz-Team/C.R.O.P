export type ResourceCategory = "Spatial" | "Consumable" | "Asset";

export type ResourceType =
  | "LibrarySeat"
  | "LibraryBook"
  | "Lab"
  | "NormalClass"
  | "ProjectorClass"
  | "LargeHall"
  | "LPGStation"
  | "WaterPoint";

export type ResourceStatus = "Available" | "Booked" | "Scarce" | "Maintenance";

export type UserRole = "Student" | "Teacher" | "Management";

export interface Resource {
  id: number;
  name: string;
  category: ResourceCategory;
  type: ResourceType;
  capacity: number;
  current_level: number | null;
  status: ResourceStatus;
  allowed_roles: string;
}

export interface BookingRequest {
  resource_id: number;
  time_slot: string;
  role: UserRole;
}

export interface IssueReport {
  resource_id: number;
  description: string;
  reported_by: UserRole;
}

export interface NewResource {
  name: string;
  category: ResourceCategory;
  type: ResourceType;
  capacity: number;
  allowed_roles: string;
}

export interface UserBooking {
  id: number;
  resource_id: number;
  resource_name: string;
  resource_type: ResourceType;
  time_slot: string;
  day: string;
  booked_by: UserRole;
  booked_at: string;
}

export interface WeeklySlot {
  resource_id: number;
  resource_name: string;
  day: string;
  time_slot: string;
  status: "Available" | "Booked" | "Maintenance";
  booked_by?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
];

// Pre-generated weekly booking mock data
const weeklyBookings: Record<string, "Booked" | "Maintenance"> = {
  "1-Monday-08:00 - 09:00": "Booked",
  "1-Tuesday-10:00 - 11:00": "Booked",
  "2-Monday-08:00 - 09:00": "Booked",
  "2-Monday-09:00 - 10:00": "Booked",
  "2-Tuesday-08:00 - 09:00": "Booked",
  "2-Wednesday-08:00 - 09:00": "Booked",
  "2-Thursday-08:00 - 09:00": "Booked",
  "2-Friday-08:00 - 09:00": "Booked",
  "6-Monday-09:00 - 10:00": "Booked",
  "6-Monday-10:00 - 11:00": "Booked",
  "6-Tuesday-09:00 - 10:00": "Booked",
  "6-Wednesday-13:00 - 14:00": "Booked",
  "6-Thursday-09:00 - 10:00": "Booked",
  "7-Monday-08:00 - 09:00": "Maintenance",
  "7-Monday-09:00 - 10:00": "Maintenance",
  "7-Tuesday-08:00 - 09:00": "Maintenance",
  "7-Tuesday-09:00 - 10:00": "Maintenance",
  "7-Wednesday-08:00 - 09:00": "Maintenance",
  "8-Monday-08:00 - 09:00": "Booked",
  "8-Monday-09:00 - 10:00": "Booked",
  "8-Tuesday-10:00 - 11:00": "Booked",
  "8-Wednesday-14:00 - 15:00": "Booked",
  "9-Tuesday-08:00 - 09:00": "Booked",
  "9-Wednesday-10:00 - 11:00": "Booked",
  "9-Thursday-13:00 - 14:00": "Booked",
  "10-Monday-08:00 - 09:00": "Booked",
  "10-Monday-09:00 - 10:00": "Booked",
  "10-Tuesday-08:00 - 09:00": "Booked",
  "10-Tuesday-09:00 - 10:00": "Booked",
  "10-Wednesday-08:00 - 09:00": "Booked",
  "10-Wednesday-09:00 - 10:00": "Booked",
  "10-Thursday-08:00 - 09:00": "Booked",
  "10-Friday-08:00 - 09:00": "Booked",
  "12-Monday-10:00 - 11:00": "Booked",
  "12-Wednesday-14:00 - 15:00": "Booked",
  "13-Monday-08:00 - 09:00": "Booked",
  "13-Tuesday-08:00 - 09:00": "Booked",
  "13-Tuesday-09:00 - 10:00": "Booked",
  "13-Wednesday-08:00 - 09:00": "Booked",
  "13-Thursday-08:00 - 09:00": "Booked",
  "13-Friday-08:00 - 09:00": "Booked",
  "14-Saturday-10:00 - 11:00": "Booked",
  "14-Saturday-11:00 - 12:00": "Booked",
  "15-Monday-09:00 - 10:00": "Booked",
  "15-Tuesday-09:00 - 10:00": "Booked",
  "15-Wednesday-09:00 - 10:00": "Booked",
  "15-Thursday-09:00 - 10:00": "Booked",
  "15-Friday-09:00 - 10:00": "Booked",
  "15-Saturday-09:00 - 10:00": "Booked",
};

const mockResources: Resource[] = [
  { id: 1, name: "Library Seat A1", category: "Spatial", type: "LibrarySeat", capacity: 1, current_level: null, status: "Available", allowed_roles: "Student,Teacher" },
  { id: 2, name: "Library Seat A2", category: "Spatial", type: "LibrarySeat", capacity: 1, current_level: null, status: "Booked", allowed_roles: "Student,Teacher" },
  { id: 3, name: "Library Seat B1", category: "Spatial", type: "LibrarySeat", capacity: 1, current_level: null, status: "Available", allowed_roles: "Student,Teacher" },
  { id: 4, name: "Advanced Physics", category: "Spatial", type: "LibraryBook", capacity: 5, current_level: null, status: "Available", allowed_roles: "Student" },
  { id: 5, name: "Data Structures Textbook", category: "Spatial", type: "LibraryBook", capacity: 3, current_level: null, status: "Scarce", allowed_roles: "Student" },
  { id: 6, name: "CS Lab 1", category: "Spatial", type: "Lab", capacity: 40, current_level: null, status: "Available", allowed_roles: "Teacher" },
  { id: 7, name: "CS Lab 2", category: "Spatial", type: "Lab", capacity: 40, current_level: null, status: "Maintenance", allowed_roles: "Teacher" },
  { id: 8, name: "Physics Lab", category: "Spatial", type: "Lab", capacity: 30, current_level: null, status: "Booked", allowed_roles: "Teacher" },
  { id: 9, name: "Room 101", category: "Spatial", type: "NormalClass", capacity: 60, current_level: null, status: "Available", allowed_roles: "Student,Teacher" },
  { id: 10, name: "Room 102", category: "Spatial", type: "NormalClass", capacity: 60, current_level: null, status: "Booked", allowed_roles: "Student,Teacher" },
  { id: 11, name: "Room 201", category: "Spatial", type: "NormalClass", capacity: 45, current_level: null, status: "Available", allowed_roles: "Student,Teacher" },
  { id: 12, name: "Smart Room A", category: "Spatial", type: "ProjectorClass", capacity: 50, current_level: null, status: "Available", allowed_roles: "Teacher" },
  { id: 13, name: "Smart Room B", category: "Spatial", type: "ProjectorClass", capacity: 50, current_level: null, status: "Booked", allowed_roles: "Teacher" },
  { id: 14, name: "Auditorium", category: "Spatial", type: "LargeHall", capacity: 500, current_level: null, status: "Available", allowed_roles: "Student,Teacher,Management" },
  { id: 15, name: "Convention Hall", category: "Spatial", type: "LargeHall", capacity: 300, current_level: null, status: "Booked", allowed_roles: "Student,Teacher,Management" },
  { id: 16, name: "Main LPG Station", category: "Consumable", type: "LPGStation", capacity: 100, current_level: 72, status: "Available", allowed_roles: "Management" },
  { id: 17, name: "Hostel LPG Station", category: "Consumable", type: "LPGStation", capacity: 100, current_level: 15, status: "Scarce", allowed_roles: "Management" },
  { id: 18, name: "Central Water Tank", category: "Consumable", type: "WaterPoint", capacity: 100, current_level: 45, status: "Available", allowed_roles: "Management" },
  { id: 19, name: "East Wing Water Tank", category: "Consumable", type: "WaterPoint", capacity: 100, current_level: 8, status: "Scarce", allowed_roles: "Management" },
];

// Simulated booked seats for spatial resources
const bookedSeats: Record<number, number> = {
  2: 1, 6: 35, 8: 28, 10: 55, 13: 42, 15: 280,
};

const userBookings: UserBooking[] = [];
let bookingIdCounter = 1;

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let resources = [...mockResources];

export async function fetchResources(): Promise<Resource[]> {
  await delay(300);
  return [...resources];
}

export async function bookResource(req: BookingRequest): Promise<{ success: boolean; message: string; bookedCount?: number; capacity?: number }> {
  await delay(400);
  const r = resources.find((r) => r.id === req.resource_id);
  if (!r) return { success: false, message: "Resource not found" };
  if (r.status === "Maintenance") return { success: false, message: "Resource under maintenance" };

  const current = bookedSeats[r.id] || 0;
  if (current >= r.capacity) return { success: false, message: "Resource is fully booked" };

  bookedSeats[r.id] = current + 1;
  if (bookedSeats[r.id] >= r.capacity) {
    r.status = "Booked";
  }

  // Track user booking
  const day = WEEKDAYS[Math.floor(Math.random() * WEEKDAYS.length)];
  userBookings.push({
    id: bookingIdCounter++,
    resource_id: r.id,
    resource_name: r.name,
    resource_type: r.type,
    time_slot: req.time_slot,
    day,
    booked_by: req.role,
    booked_at: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Booked ${r.name} for ${req.time_slot} (${bookedSeats[r.id]}/${r.capacity} filled)`,
    bookedCount: bookedSeats[r.id],
    capacity: r.capacity,
  };
}

export async function fetchMyBookings(role: UserRole): Promise<UserBooking[]> {
  await delay(200);
  return userBookings.filter((b) => b.booked_by === role);
}

export async function reportIssue(report: IssueReport): Promise<{ success: boolean; message: string }> {
  await delay(400);
  const r = resources.find((r) => r.id === report.resource_id);
  if (!r) return { success: false, message: "Resource not found" };
  r.status = "Maintenance";
  return { success: true, message: `Issue reported for ${r.name}` };
}

export async function addResource(newRes: NewResource): Promise<Resource> {
  await delay(400);
  const created: Resource = {
    id: resources.length + 1,
    name: newRes.name,
    category: newRes.category,
    type: newRes.type,
    capacity: newRes.capacity,
    current_level: null,
    status: "Available",
    allowed_roles: newRes.allowed_roles,
  };
  resources.push(created);
  return created;
}

export function getBookedSeats(resourceId: number): number {
  return bookedSeats[resourceId] || 0;
}

export function getAlerts(resources: Resource[]): string[] {
  const alerts: string[] = [];
  resources.forEach((r) => {
    if (r.status === "Scarce") alerts.push(`⚠ ${r.name} — Supply critically low!`);
    if (r.status === "Maintenance") alerts.push(`🔧 ${r.name} — Under maintenance`);
  });
  return alerts;
}

export async function fetchWeeklySlots(resourceIds: number[]): Promise<WeeklySlot[]> {
  await delay(200);
  const slots: WeeklySlot[] = [];
  const spatialResources = resources.filter((r) => resourceIds.includes(r.id) && r.category === "Spatial");

  for (const res of spatialResources) {
    for (const day of DAYS) {
      for (const ts of TIME_SLOTS) {
        const key = `${res.id}-${day}-${ts}`;
        const bookingStatus = weeklyBookings[key];
        const resInMaintenance = res.status === "Maintenance";

        slots.push({
          resource_id: res.id,
          resource_name: res.name,
          day,
          time_slot: ts,
          status: resInMaintenance ? "Maintenance" : bookingStatus || "Available",
          booked_by: bookingStatus === "Booked" ? "Faculty/Student" : undefined,
        });
      }
    }
  }

  return slots;
}
