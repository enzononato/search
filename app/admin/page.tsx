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
  nunca: "bg-red-700",
  raramente: "bg-red-400",
  as_vezes: "bg-gray-300",
  maioria: "bg-blue-400",
  sempre: "bg-blue-700",
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
    // Busca assíncrona dependente de `unidade` (sincroniza com a API, não é
    // um setState em cascata síncrono) — caso legítimo para useEffect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar(unidade);
  }, [unidade, carregar]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard — Pesquisa de TI</h1>
        <div className="flex items-center gap-3">
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todas as unidades</option>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <a
            href={`/api/admin/export${unidade ? `?unidade=${encodeURIComponent(unidade)}` : ""}`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Exportar CSV
          </a>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Sair
          </button>
        </div>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}
      {carregando && !dados && <p className="text-sm text-gray-500">Carregando...</p>}

      {dados && (
        <div className="space-y-8">
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatTile label="Respostas" value={String(dados.totalRespostas)} />
            <StatTile
              label="NPS"
              value={dados.nps.percentual === null ? "—" : String(dados.nps.percentual)}
              corValor={
                dados.nps.percentual === null
                  ? "text-gray-900"
                  : dados.nps.percentual >= 0
                    ? "text-green-700"
                    : "text-red-700"
              }
              sublabel={`${dados.nps.promotores} promotores · ${dados.nps.neutros} neutros · ${dados.nps.detratores} detratores`}
            />
          </section>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MedidorEstrelas label="Equipamento" valor={dados.medias.avaliacao_equipamento} />
            <MedidorEstrelas label="Celular corporativo" valor={dados.medias.avaliacao_celular} />
            <MedidorEstrelas label="Atendimento da TI" valor={dados.medias.avaliacao_atendimento} />
            <MedidorEstrelas label="Presença da TI" valor={dados.medias.avaliacao_presenca} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Resolução em tempo adequado
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

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Itens que mais precisam de melhoria
            </h2>
            <ListaBarras itens={dados.topItensMelhoria} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Respostas por unidade</h2>
            <ListaBarras
              itens={dados.porUnidade.map((u) => ({ valor: u.unidade, label: u.unidade, total: u.total }))}
            />
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <ListaTextos titulo="O que a TI faz muito bem" itens={dados.textosAbertos.ti_faz_bem} />
            <ListaTextos
              titulo="Principal melhoria na unidade"
              itens={dados.textosAbertos.principal_melhoria}
            />
            <ListaTextos
              titulo="Equipamento/recurso que atrapalha"
              itens={dados.textosAbertos.equipamento_prejudica}
            />
            <ListaTextos titulo="Sugestão, crítica ou elogio" itens={dados.textosAbertos.sugestao} />
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
}: {
  label: string;
  value: string;
  sublabel?: string;
  corValor?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${corValor ?? "text-gray-900"}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}

function MedidorEstrelas({ label, valor }: { label: string; valor: number | null }) {
  const percentual = valor === null ? 0 : Math.max(0, Math.min(100, (valor / 5) * 100));
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">
        {valor === null ? "—" : valor.toFixed(1)}
        <span className="text-sm font-normal text-gray-400"> / 5</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

function ListaBarras({ itens }: { itens: { valor: string; label: string; total: number }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  if (itens.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados.</p>;
  }
  return (
    <div className="space-y-2">
      {itens.map((item) => (
        <div key={item.valor} className="flex items-center gap-3">
          <span className="w-48 shrink-0 truncate text-sm text-gray-700">{item.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-sm bg-gray-100">
            <div
              className="h-full rounded-sm bg-blue-600"
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-gray-500">
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
    return <p className="text-sm text-gray-400">Sem dados.</p>;
  }
  return (
    <div>
      <div className="flex h-5 gap-0.5 overflow-hidden rounded-sm">
        {segmentos.map((s, i) => {
          if (s.total === 0) return null;
          const arredondamento =
            i === 0 ? "rounded-l-sm" : i === segmentos.length - 1 ? "rounded-r-sm" : "";
          return (
            <div
              key={s.valor}
              className={`h-full ${s.cor} ${arredondamento}`}
              style={{ width: `${(s.total / total) * 100}%` }}
              title={`${s.label}: ${s.total}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {segmentos.map((s) => (
          <span key={s.valor} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${s.cor}`} />
            {s.label} ({s.total})
          </span>
        ))}
      </div>
    </div>
  );
}

function ListaTextos({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { unidade: string; texto: string; criado_em: string }[];
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        {titulo} <span className="font-normal text-gray-400">({itens.length})</span>
      </h3>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-400">Sem respostas.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {itens.map((item, i) => (
            <li key={i} className="border-b border-gray-100 pb-2 last:border-0">
              <p className="text-gray-800">{item.texto}</p>
              <p className="mt-0.5 text-xs text-gray-400">{item.unidade}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
