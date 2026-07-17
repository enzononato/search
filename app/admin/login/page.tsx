"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const MENSAGENS_ERRO: Record<string, string> = {
  senha_invalida: "Senha incorreta. Verifique os caracteres informados.",
  muitas_tentativas: "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!senha || carregando) return;

    setCarregando(true);
    setErro(null);

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErro(MENSAGENS_ERRO[data.error] ?? "Erro inesperado. Tente novamente.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-10 min-h-screen">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top brand decoration bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        {/* Header Icon & Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            {/* Custom Modern Lock SVG */}
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Acesso Restrito
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Dashboard de TI Revalle
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="senha" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Senha de Administrador
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                {/* Key SVG Icon */}
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
                    d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 012-2m0 0h2v2h2v2h-4v-4zM9 15l-3 3m0 0l-3-3m3 3V9a3 3 0 013-3h3"
                  />
                </svg>
              </div>
              <input
                id="senha"
                type={verSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Informe a chave de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                autoFocus
                required
              />
              {/* Show/Hide password toggle */}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setVerSenha(!verSenha)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition"
              >
                {verSenha ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
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
            disabled={!senha || carregando}
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
                Autenticando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Entrar no Painel
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
