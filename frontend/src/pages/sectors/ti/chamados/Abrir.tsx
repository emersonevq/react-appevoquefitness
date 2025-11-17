import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import { CheckCircle, Copy, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TicketForm from "./components/TicketForm";

export default function AbrirChamadoPage() {
  const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE || "/api";
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<
    { id: number; nome: string; cidade: string }[]
  >([]);
  const [problemas, setProblemas] = useState<
    { id: number; nome: string; prioridade: string; requer_internet: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState<{
    codigo: string;
    protocolo: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/unidades`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
        .then((data) =>
          Array.isArray(data) ? setUnidades(data) : setUnidades([]),
        )
        .catch(() => setUnidades([])),
      fetch(`${API_BASE}/problemas`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
        .then((data) =>
          Array.isArray(data) ? setProblemas(data) : setProblemas([]),
        )
        .catch(() => setProblemas([])),
    ]);
  }, []);

  const handleSubmit = async (payload: {
    nome: string;
    cargo: string;
    email: string;
    telefone: string;
    unidade: string;
    problema: string;
    internetItem?: string;
    descricao?: string;
    files?: File[];
  }) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.set("solicitante", payload.nome);
      fd.set("cargo", payload.cargo);
      fd.set("email", payload.email);
      fd.set("telefone", payload.telefone);
      fd.set("unidade", payload.unidade);
      fd.set("problema", payload.problema);
      if (payload.internetItem) fd.set("internetItem", payload.internetItem);
      if (payload.descricao) fd.set("descricao", payload.descricao);
      if (payload.files && payload.files.length > 0) {
        for (const f of payload.files) fd.append("files", f);
      }

      const res = await apiFetch("/chamados/with-attachments", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Falha ao criar chamado");

      const created: {
        id: number;
        codigo: string;
        protocolo: string;
        data_abertura: string;
        problema: string;
        internet_item?: string | null;
        status: string;
      } = await res.json();

      setLastCreated({
        codigo: created.codigo,
        protocolo: created.protocolo,
      });
      setSuccessOpen(true);
    } catch (e) {
      console.error(e);
      alert("Não foi possível abrir o chamado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="w-full">
        <div className="brand-gradient">
          <div className="container py-10 sm:py-14">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/setor/ti")}
                className="text-primary-foreground hover:bg-primary-foreground/15"
              >
                <ChevronLeft className="size-5" />
              </Button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-foreground drop-shadow">
              Abrir novo chamado
            </h1>
            <p className="mt-2 text-primary-foreground/90 max-w-2xl">
              Preencha o formulário abaixo para criar um novo chamado de suporte
              técnico.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-border/60 bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6">
              Informações do chamado
            </h2>
            <TicketForm
              problemas={problemas}
              unidades={unidades}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          </div>
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
                  <Button
                    onClick={() => {
                      setSuccessOpen(false);
                      navigate("/setor/ti");
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
