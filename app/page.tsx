"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeCpf } from "@/lib/cpf";

const TOKEN_STORAGE_KEY = "pesquisa_ti_token";

function formatarCpf(valor: string): string {
  const digitos = normalizeCpf(valor).slice(0, 11);
  const partes = [
    digitos.slice(0, 3),
    digitos.slice(3, 6),
    digitos.slice(6, 9),
    digitos.slice(9, 11),
  ].filter(Boolean);
  if (partes.length <= 1) return partes[0] ?? "";
  if (partes.length === 2) return `${partes[0]}.${partes[1]}`;
  if (partes.length === 3) return `${partes[0]}.${partes[1]}.${partes[2]}`;
  return `${partes[0]}.${partes[1]}.${partes[2]}-${partes[3]}`;
}

const MENSAGENS_ERRO: Record<string, string> = {
  cpf_invalido: "CPF inválido. Confira os números digitados.",
  nao_encontrado:
    "Não foi possível validar este CPF. Verifique se digitou corretamente.",
  ja_respondida: "Este CPF já respondeu à pesquisa. Obrigado!",
  muitas_tentativas:
    "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  erro_interno: "Erro interno. Tente novamente em instantes.",
};

export default function CpfPage() {
  const router = useRouter();
  const [cpfExibido, setCpfExibido] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const cpfNormalizado = normalizeCpf(cpfExibido);
  const podeEnviar = cpfNormalizado.length === 11 && !carregando;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;

    setCarregando(true);
    setErro(null);

    try {
      const resp = await fetch("/api/validar-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfNormalizado }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErro(MENSAGENS_ERRO[data.error] ?? "Erro inesperado. Tente novamente.");
        return;
      }

      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      router.push("/pesquisa");
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Pesquisa de Percepção da TI
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Suas respostas são totalmente anônimas. O CPF é usado apenas para
          garantir uma resposta por colaborador e não fica associado às suas
          respostas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="cpf"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpfExibido}
              onChange={(e) => setCpfExibido(formatarCpf(e.target.value))}
              maxLength={14}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-lg tracking-wide focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={!podeEnviar}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "Verificando..." : "Continuar"}
          </button>
        </form>
      </div>
    </main>
  );
}
