import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/services/api";
import { GraduationCap, BookOpen, Building2, Sun, Moon } from "lucide-react";

const roles: { role: UserRole; icon: React.ReactNode; label: string }[] = [
  { role: "Student", icon: <GraduationCap className="h-4 w-4" />, label: "Student" },
  { role: "Teacher", icon: <BookOpen className="h-4 w-4" />, label: "Teacher" },
  { role: "Management", icon: <Building2 className="h-4 w-4" />, label: "Management" },
];

const Header = () => {
  const { role, setRole, isDark, toggleTheme } = useAppStore();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground hidden sm:block">Campus Resource Optimizer</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => setRole(r.role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  role === r.role
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
