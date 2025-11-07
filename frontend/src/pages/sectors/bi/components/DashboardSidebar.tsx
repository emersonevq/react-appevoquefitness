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
        <img
          src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
          alt="Evoque"
          className="bi-logo"
        />
        <h2 className="bi-sidebar-title">Dashboards</h2>
      </div>

      <nav className="bi-nav" aria-label="Dashboards navigation">
        {categories.map((category) => (
          <div key={category.id} className="sidebar-group">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-transparent transition text-sm font-medium"
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
                    title={dashboard.title}
                  >
                    <span className="bi-item-icon">●</span>
                    <span className="bi-item-label">{dashboard.title}</span>
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
