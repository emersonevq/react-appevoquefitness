import { Dashboard, DashboardCategory } from "../data/dashboards";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface DashboardSidebarProps {
  categories: DashboardCategory[];
  selectedDashboard: Dashboard | null;
  onSelectDashboard: (dashboard: Dashboard) => void;
}

export default function DashboardSidebar({
  categories,
  selectedDashboard,
  onSelectDashboard,
}: DashboardSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id)),
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <aside className="bi-sidebar">
      <div className="bi-sidebar-header">
        <div className="bi-sidebar-logo" aria-hidden>
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="20" rx="3" fill="hsl(var(--sidebar-primary))" />
          </svg>
        </div>
        <h2 className="bi-sidebar-title">Dashboards</h2>
      </div>

      <nav className="bi-nav" aria-label="Dashboards navigation">
        {categories.map((category) => (
          <div key={category.id} className="sidebar-group">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-transparent transition text-sm font-medium text-[color:var(--sidebar-foreground)]"
            >
              <span>{category.name}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedCategories.has(category.id) ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedCategories.has(category.id) && (
              <div className="pl-2 space-y-1">
                {category.dashboards.map((dashboard) => (
                  <button
                    key={dashboard.id}
                    onClick={() => onSelectDashboard(dashboard)}
                    className={`bi-item ${
                      selectedDashboard?.id === dashboard.id ? "active" : ""
                    }`}
                  >
                    {dashboard.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
