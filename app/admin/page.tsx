"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UNIDADES } from "@/lib/perguntas";

interface Resultados {
  unidadeFiltro: string | null;
  totalRespostas: number;
  porUnidade: { unidade: string; total: number }[];
  nps: {
    total: number;
    promotores: number;
    neutros: number;
    detratores: number;
    percentual: number | null;
  };
  medias: {
    avaliacao_equipamento: number | null;
    avaliacao_celular: number | null;
    avaliacao_atendimento: number | null;
    avaliacao_presenca: number | null;
  };
  distribuicaoResolucaoTempo: { valor: string; label: string; total: number }[];
  topItensMelhoria: { valor: string; label: string; total: number }[];
  textosAbertos: {
    equipamento_prejudica: { unidade: string; texto: string; criado_em: string }[];
    ti_faz_bem: { unidade: string; texto: string; criado_em: string }[];
    principal_melhoria: { unidade: string; texto: string; criado_em: string }[];
    sugestao: { unidade: string; texto: string; criado_em: string }[];
  };
}

const CORES_RESOLUCAO: Record<string, string> = {
  nunca: "bg-red-500",
  raramente: "bg-orange-400",
  as_vezes: "bg-slate-300",
  maioria: "bg-blue-400",
  sempre: "bg-blue-600",
};
const ORDEM_DIVERGENTE_RESOLUCAO = ["nunca", "raramente", "as_vezes", "maioria", "sempre"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [unidade, setUnidade] = useState<string>("");
  const [dados, setDados] = useState<Resultados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (unidadeAtual: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const qs = unidadeAtual ? `?unidade=${encodeURIComponent(unidadeAtual)}` : "";
      const resp = await fetch(`/api/admin/resultados${qs}`);
      if (resp.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!resp.ok) {
        setErro("Não foi possível carregar os resultados.");
        return;
      }
      setDados(await resp.json());
    } catch {
      setErro("Falha de conexão ao carregar os resultados.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    carregar(unidade);
  }, [unidade, carregar]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // Icons for statistics tiles
  const feedbackIcon = (
    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const npsIcon = (
    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 md:p-8 min-h-screen">
      
      {/* Top action header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Revalle <span className="font-light text-slate-500">Dashboard TI</span>
          </h1>
          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mt-0.5">
            Resultados da Pesquisa de Percepção
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
            >
              <option value="">Todas as unidades</option>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <a
            href={`/api/admin/export${unidade ? `?unidade=${encodeURIComponent(unidade)}` : ""}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          >
            <svg className="h-4.5 w-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </a>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition duration-200 active:scale-95"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-6 flex gap-3 rounded-2xl bg-red-50 p-4 border border-red-100 text-sm text-red-700 animate-fade-in">
          <svg className="h-5 w-5 shrink-0 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{erro}</span>
        </div>
      )}

      {carregando && !dados && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <svg className="h-10 w-10 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide uppercase">Carregando painel analítico...</span>
        </div>
      )}

      {dados && (
        <div className="space-y-8 animate-fade-in duration-300">
          
          {/* Key statistical totals grid */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile 
              label="Total de Participantes" 
              value={String(dados.totalRespostas)} 
              icone={feedbackIcon}
              sublabel="Colaboradores que concluíram a pesquisa"
            />
            <StatTile
              label="Net Promoter Score (NPS)"
              value={dados.nps.percentual === null ? "—" : String(dados.nps.percentual)}
              icone={npsIcon}
              corValor={
                dados.nps.percentual === null
                  ? "text-slate-900"
                  : dados.nps.percentual >= 50
                    ? "text-emerald-600"
                    : dados.nps.percentual >= 0
                      ? "text-amber-500"
                      : "text-red-500"
              }
              sublabel={
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{dados.nps.promotores} Promotores</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{dados.nps.neutros} Neutros</span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{dados.nps.detratores} Detratores</span>
                </div>
              }
            />
          </section>

          {/* Average ratings panel */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Médias de Avaliação Geral</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <MedidorEstrelas label="Equipamento de Trabalho" valor={dados.medias.avaliacao_equipamento} />
              <MedidorEstrelas label="Celular Corporativo" valor={dados.medias.avaliacao_celular} />
              <MedidorEstrelas label="Atendimento da Equipe TI" valor={dados.medias.avaliacao_atendimento} />
              <MedidorEstrelas label="Presença e Disponibilidade" valor={dados.medias.avaliacao_presenca} />
            </div>
          </section>

          {/* Resolution time divergence bar */}
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              A TI resolve seus problemas em tempo adequado?
            </h2>
            <BarraDivergente
              segmentos={ORDEM_DIVERGENTE_RESOLUCAO.map((valor) => {
                const item = dados.distribuicaoResolucaoTempo.find((d) => d.valor === valor);
                return {
                  valor,
                  label: item?.label ?? valor,
                  total: item?.total ?? 0,
                  cor: CORES_RESOLUCAO[valor],
                };
              })}
            />
          </section>

          {/* Double column details: Improvements & Answers by Unit */}
          <div className="grid gap-6 md:grid-cols-2">
            
            <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens que mais precisam de melhoria
              </h2>
              <div className="flex-1">
                <ListaBarras itens={dados.topItensMelhoria} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400">Respostas por unidade</h2>
              <div className="flex-1">
                <ListaBarras
                  itens={dados.porUnidade.map((u) => ({ valor: u.unidade, label: u.unidade, total: u.total }))}
                />
              </div>
            </section>

          </div>

          {/* Written Feedbacks Masonry grid */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Comentários e Feedbacks Textuais</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <ListaTextos titulo="O que a TI faz muito bem" itens={dados.textosAbertos.ti_faz_bem} borderCor="border-t-emerald-500" />
              <ListaTextos
                titulo="Principal melhoria na unidade"
                itens={dados.textosAbertos.principal_melhoria}
                borderCor="border-t-blue-500"
              />
              <ListaTextos
                titulo="Equipamento/recurso que atrapalha"
                itens={dados.textosAbertos.equipamento_prejudica}
                borderCor="border-t-orange-500"
              />
              <ListaTextos titulo="Sugestões, críticas ou elogios" itens={dados.textosAbertos.sugestao} borderCor="border-t-indigo-500" />
            </div>
          </section>

        </div>
      )}
    </main>
  );
}

function StatTile({
  label,
  value,
  sublabel,
  corValor,
  icone,
}: {
  label: string;
  value: string;
  sublabel?: React.ReactNode;
  corValor?: string;
  icone?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 flex items-start gap-4">
      {icone && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
          {icone}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-3xl font-extrabold tracking-tight ${corValor ?? "text-slate-900"}`}>{value}</p>
        {sublabel && (
          typeof sublabel === "string" 
            ? <p className="text-xs font-semibold text-slate-500 leading-normal">{sublabel}</p>
            : sublabel
        )}
      </div>
    </div>
  );
}

function MedidorEstrelas({ label, valor }: { label: string; valor: number | null }) {
  const percentual = valor === null ? 0 : Math.max(0, Math.min(100, (valor / 5) * 100));
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{label}</p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {valor === null ? "—" : valor.toFixed(1)}
          {valor !== null && (
            <span className="text-xs font-medium text-slate-400"> / 5.0</span>
          )}
        </p>
      </div>
      <div className="mt-3">
        {/* Render horizontal visual mini rating bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${percentual}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

function ListaBarras({ itens }: { itens: { valor: string; label: string; total: number }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  if (itens.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-400">
        Nenhum registro encontrado
      </div>
    );
  }
  return (
    <div className="space-y-3.5">
      {itens.map((item) => (
        <div key={item.valor} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm font-semibold text-slate-700 leading-tight" title={item.label}>
            {item.label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
            {item.total}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarraDivergente({
  segmentos,
}: {
  segmentos: { valor: string; label: string; total: number; cor: string }[];
}) {
  const total = segmentos.reduce((acc, s) => acc + s.total, 0);
  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-400">
        Nenhum registro encontrado
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Visual divergency segmented bar */}
      <div className="flex h-5 gap-1 overflow-hidden rounded-full bg-slate-100">
        {segmentos.map((s, i) => {
          if (s.total === 0) return null;
          return (
            <div
              key={s.valor}
              className={`h-full ${s.cor} transition-all duration-300`}
              style={{ width: `${(s.total / total) * 100}%` }}
              title={`${s.label}: ${s.total} (${Math.round((s.total / total) * 100)}%)`}
            />
          );
        })}
      </div>
      
      {/* Legend list */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
        {segmentos.map((s) => (
          <span key={s.valor} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full ${s.cor}`} />
            <span className="text-slate-700">{s.label}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-bold tabular-nums">
              {s.total}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ListaTextos({
  titulo,
  itens,
  borderCor = "border-t-slate-200",
}: {
  titulo: string;
  itens: { unidade: string; texto: string; criado_em: string }[];
  borderCor?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 border-t-4 ${borderCor} flex flex-col max-h-[360px]`}>
      <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-50">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {titulo}
        </h3>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 tabular-nums">
          {itens.length}
        </span>
      </div>
      
      {itens.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10 text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Sem respostas escritas
        </div>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm scrollbar-thin">
          {itens.map((item, i) => (
            <li key={i} className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100/50 space-y-2">
              <p className="text-slate-700 leading-relaxed text-sm font-medium">{item.texto}</p>
              <div className="flex justify-between items-center">
                <span className="inline-block rounded-full bg-white border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                  {item.unidade}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

