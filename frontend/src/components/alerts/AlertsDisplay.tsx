import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { shouldShowAlertOnPage } from "@/config/alert-pages";

interface Alert {
  id: number;
  title?: string;
  message?: string;
  description?: string;
  severity?: string;
  ativo?: boolean;
  imagem_blob?: string;
  imagem_mime_type?: string;
  pages?: string[];
  show_on_home?: boolean;
  viewed?: boolean;
}

interface AlertsDisplayProps {
  alerts: Alert[];
  onDismiss: (id: number) => void;
  dismissed: number[];
  userId?: number;
}

export function AlertsDisplay({
  alerts,
  onDismiss,
  dismissed,
  userId,
}: AlertsDisplayProps) {
  const location = useLocation();
  const [visibleAlerts, setVisibleAlerts] = useState<number[]>([]);

  const markAlertAsViewed = async (alertId: number) => {
    if (!userId) return;
    try {
      await apiFetch(`/alerts/${alertId}/view?user_id=${userId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Erro ao marcar alerta como visto:", error);
    }
  };

  useEffect(() => {
    const newVisibleAlerts = alerts
      .filter((a) => a && a.ativo)
      .filter((a) => !dismissed.includes(a.id))
      .filter((a) => {
        // Mostrar apenas em página inicial se show_on_home estiver ativado
        if (location.pathname === "/" && a.show_on_home) {
          return true;
        }
        // Mostrar em páginas específicas se houver configuração
        if (shouldShowAlertOnPage(a.pages, location.pathname)) {
          // Se não tem páginas específicas, mostrar em todas menos na home
          if (!a.pages || a.pages.length === 0) {
            return location.pathname !== "/";
          }
          return true;
        }
        return false;
      })
      .map((a) => {
        // Marcar como visto quando renderizar
        if (!a.viewed && userId) {
          markAlertAsViewed(a.id);
        }
        return a.id;
      });
    setVisibleAlerts(newVisibleAlerts);
  }, [alerts, dismissed, location.pathname, userId]);

  const activeAlerts = alerts.filter(
    (a) => a && a.ativo && visibleAlerts.includes(a.id),
  );

  if (!activeAlerts.length) return null;

  return (
    <div className="fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">
      {activeAlerts.map((a) => (
        <div
          key={a.id}
          className="pointer-events-auto w-full max-w-4xl rounded-lg shadow-lg overflow-hidden"
        >
          {/* Com imagem */}
          {a.imagem_blob ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg">
              <div className="relative">
                <img
                  src={`data:${a.imagem_mime_type || "image/jpeg"};base64,${a.imagem_blob}`}
                  alt="Alerta"
                  className="w-full max-h-96 object-cover"
                />
                <button
                  onClick={() => onDismiss(a.id)}
                  className="absolute top-3 right-3 bg-background/90 hover:bg-background rounded-full p-2 text-foreground shadow-md transition"
                  aria-label="Fechar alerta"
                >
                  <X size={20} />
                </button>
              </div>
              {a.message && (
                <div
                  className={`px-4 py-3 text-sm font-medium ${
                    a.severity === "critical"
                      ? "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-100"
                      : a.severity === "high"
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-100"
                        : a.severity === "medium"
                          ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-100"
                          : "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-100"
                  }`}
                >
                  {a.title && <div className="font-semibold">{a.title}</div>}
                  <div>{a.message}</div>
                  {a.description && (
                    <div className="mt-1 opacity-90">{a.description}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Sem imagem - estilo original */
            <div
              className={`rounded-lg px-4 py-3 shadow-md text-sm ${
                a.severity === "critical"
                  ? "bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-100"
                  : a.severity === "high"
                    ? "bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-100"
                    : a.severity === "medium"
                      ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100"
                      : "bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold">{a.title || "Aviso"}</div>
                  <div className="mt-1">{a.message}</div>
                  {a.description && (
                    <div className="mt-2 opacity-90 text-xs italic">
                      {a.description}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => onDismiss(a.id)}
                    className="px-3 py-1 rounded-md bg-background text-foreground hover:opacity-80 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
