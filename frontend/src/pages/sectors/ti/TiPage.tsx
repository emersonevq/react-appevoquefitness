import Layout from "@/components/layout/Layout";
import { sectors } from "@/data/sectors";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth-context";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const sector = sectors.find((s) => s.slug === "ti")!;

interface Ticket {
  id: string;
  codigo: string;
  protocolo: string;
  data: string;
  problema: string;
  status: string;
}

export default function TiPage() {
  const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE || "/api";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastCreated, setLastCreated] = useState<{
    codigo: string;
    protocolo: string;
  } | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chamado_criado")) {
      const codigo = params.get("codigo");
      const protocolo = params.get("protocolo");
      if (codigo && protocolo) {
        setLastCreated({ codigo, protocolo });
        setSuccessOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <Layout>
      <section className="w-full">
        <div className="brand-gradient">
          <div className="container py-10 sm:py-14">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-foreground drop-shadow">
              {sector.title}
            </h1>
            <p className="mt-2 text-primary-foreground/90 max-w-2xl">
              {sector.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {lastCreated && (
          <div className="mb-4 rounded-lg border border-border/60 bg-card p-4 text-sm">
            <div className="font-semibold mb-1">Chamado criado com sucesso</div>
            <div>
              Código <span className="font-semibold">{lastCreated.codigo}</span>{" "}
              e Protocolo{" "}
              <span className="font-semibold">{lastCreated.protocolo}</span>{" "}
              gerados e salvos.
            </div>
            <div className="text-muted-foreground mt-1">
              Guarde essas informações para futuras consultas.
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          {/** show admin shortcut only to Administrador */}
          {(() => {
            const { user } = useAuthContext();
            return user?.nivel_acesso === "Administrador" ? (
              <div className="md:hidden">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/setor/ti/admin">Painel administrativo</Link>
                </Button>
              </div>
            ) : null;
          })()}
          <h2 className="text-lg sm:text-xl font-semibold">
            Histórico de chamados
          </h2>
          {(() => {
            const { user } = useAuthContext();
            return user?.nivel_acesso === "Administrador" ? (
              <div className="hidden md:block">
                <Button asChild className="mr-2 rounded-full">
                  <Link to="/setor/ti/admin">Painel administrativo</Link>
                </Button>
              </div>
            ) : null;
          })()}
          <Button asChild className="rounded-full">
            <Link to="/setor/ti/chamados/abrir">Abrir novo chamado</Link>
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Protocolo</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Problema</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    Você ainda não abriu nenhum chamado.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="px-4 py-3">{t.codigo}</td>
                    <td className="px-4 py-3">{t.protocolo}</td>
                    <td className="px-4 py-3">
                      {new Date(t.data).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{t.problema}</td>
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {lastCreated && (
            <div className="w-full">
              <div className="brand-gradient px-5 py-4 flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2">
                  <CheckCircle className="size-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm/5 text-primary-foreground/90">
                    Chamado aberto
                  </div>
                  <div className="text-xl font-extrabold text-primary-foreground drop-shadow">
                    Sucesso!
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Guarde as informações abaixo:
                </div>

                <div className="grid gap-3">
                  <div className="text-xs text-muted-foreground">Código</div>
                  <div className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2">
                    <div className="font-mono font-semibold text-base break-all">
                      {lastCreated.codigo}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            lastCreated.codigo,
                          );
                        } catch {}
                      }}
                    >
                      <Copy className="size-4 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="text-xs text-muted-foreground">Protocolo</div>
                  <div className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2">
                    <div className="font-mono font-semibold text-base break-all">
                      {lastCreated.protocolo}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            lastCreated.protocolo,
                          );
                        } catch {}
                      }}
                    >
                      <Copy className="size-4 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `Código: ${lastCreated.codigo} | Protocolo: ${lastCreated.protocolo}`,
                        );
                      } catch {}
                    }}
                  >
                    <Copy className="size-4 mr-1" /> Copiar tudo
                  </Button>
                  <Button onClick={() => setSuccessOpen(false)}>Fechar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
