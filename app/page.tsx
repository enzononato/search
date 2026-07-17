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
  ja_respondida: "Este CPF já respondeu à pesquisa. Agradecemos sua participação!",
  muitas_tentativas:
    "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
  erro_interno: "Ocorreu um erro interno. Tente novamente em instantes.",
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
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-10 min-h-screen">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top brand decoration bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        {/* Branding & Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            {/* Custom Modern Security Shield SVG */}
            <svg
              className="h-7 w-7"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Revalle <span className="font-light text-slate-500">Pesquisa TI</span>
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-widest text-blue-600 uppercase">
            Percepção da TI 2026
          </p>
        </div>

        {/* Privacy Note */}
        <div className="mb-8 rounded-2xl bg-slate-50/80 p-4 border border-slate-100 text-center">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            Esta pesquisa é <span className="font-semibold text-slate-900">100% anônima</span>. 
            O CPF é coletado exclusivamente para evitar respostas duplicadas e 
            <span className="font-semibold text-slate-900"> não será vinculado</span> aos seus feedbacks.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="cpf"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              CPF do Colaborador
            </label>
            <div className="relative rounded-2xl transition-all duration-300">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                {/* User SVG Icon */}
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                id="cpf"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpfExibido}
                onChange={(e) => setCpfExibido(formatarCpf(e.target.value))}
                maxLength={14}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base sm:text-lg tracking-wider text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>
          </div>

          {/* Styled Error Alert */}
          {erro && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl bg-red-50 p-4 border border-red-100 text-sm text-red-700 animate-fade-in"
            >
              <svg
                className="h-5 w-5 shrink-0 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!podeEnviar}
            className="group relative flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-base font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Validando credenciais...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Iniciar Pesquisa
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
