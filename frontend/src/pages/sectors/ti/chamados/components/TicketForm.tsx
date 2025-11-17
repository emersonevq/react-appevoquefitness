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
import { useMemo, useState } from "react";

interface TicketFormProps {
  problemas?: {
    id: number;
    nome: string;
    prioridade: string;
    requer_internet: boolean;
  }[];
  unidades?: { id: number; nome: string; cidade: string }[];
  onSubmit: (payload: {
    nome: string;
    cargo: string;
    email: string;
    telefone: string;
    unidade: string;
    problema: string;
    internetItem?: string;
    descricao?: string;
    files?: File[];
  }) => void;
  isLoading?: boolean;
}

export default function TicketForm({
  problemas,
  unidades,
  onSubmit,
  isLoading = false,
}: TicketFormProps) {
  const listaProblemas = Array.isArray(problemas) ? problemas : [];
  const listaUnidades = Array.isArray(unidades) ? unidades : [];
  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    unidade: "",
    problema: "",
    internetItem: "",
    descricao: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const must = [
      form.nome.trim(),
      form.cargo.trim(),
      form.email.trim(),
      form.telefone.trim(),
      form.unidade.trim(),
      form.problema.trim(),
      form.descricao.trim(),
    ];
    if (must.some((v) => !v)) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (selectedProblem?.requer_internet && !form.internetItem.trim()) {
      alert("Selecione o item de Internet.");
      return;
    }
    onSubmit({ ...form, files });
  };

  const selectedProblem = useMemo(
    () => listaProblemas.find((p) => p.nome === form.problema) || null,
    [listaProblemas, form.problema],
  );

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome do solicitante</Label>
        <Input
          id="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Select
            value={form.cargo}
            onValueChange={(v) => setForm({ ...form, cargo: v })}
            disabled={isLoading}
          >
            <SelectTrigger id="cargo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Coordenador">Coordenador</SelectItem>
              <SelectItem value="Funcionário">Funcionário</SelectItem>
              <SelectItem value="Gerente">Gerente</SelectItem>
              <SelectItem value="Gerente regional">Gerente regional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="11987654321"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Selecione a unidade</Label>
          <Select
            value={form.unidade}
            onValueChange={(v) => setForm({ ...form, unidade: v })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {listaUnidades.map((u) => (
                <SelectItem key={u.id} value={u.nome}>
                  {new RegExp(`(\\s*-\\s*${u.id})\\s*$`).test(u.nome)
                    ? u.nome
                    : `${u.nome} - ${u.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Problema Reportado</Label>
          <Select
            value={form.problema}
            onValueChange={(v) => setForm({ ...form, problema: v })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {listaProblemas.map((p) => (
                <SelectItem key={p.id} value={p.nome}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProblem?.requer_internet && (
        <div className="grid gap-2">
          <Label>Selecione o item de Internet</Label>
          <Select
            value={form.internetItem}
            onValueChange={(v) => setForm({ ...form, internetItem: v })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Antenas">Antenas</SelectItem>
              <SelectItem value="Cabo de rede">Cabo de rede</SelectItem>
              <SelectItem value="DVR">DVR</SelectItem>
              <SelectItem value="Roteador/Modem">Roteador/Modem</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
              <SelectItem value="Wi-fi">Wi-fi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="descricao">Descrição do problema</Label>
        <textarea
          id="descricao"
          className="min-h-[100px] rounded-md border border-input bg-background p-3 text-sm"
          placeholder="Descreva o que está acontecendo"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Arquivos (opcional)</Label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
