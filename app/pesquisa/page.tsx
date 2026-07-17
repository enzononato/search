"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import StepProgress from "@/components/StepProgress";
import {
  UNIDADES,
  EQUIPAMENTO_PRINCIPAL_OPTIONS,
  EQUIPAMENTOS_COM_NOTEBOOK,
  ACESSORIOS_NOTEBOOK_OPTIONS,
  RESOLUCAO_TEMPO_OPTIONS,
  ITENS_MELHORIA_OPTIONS,
  MAX_ITENS_MELHORIA,
  NPS_MIN,
  NPS_MAX,
  type EquipamentoPrincipal,
  type AcessoriosNotebook,
  type ResolucaoTempo,
  type ItemMelhoria,
  type Unidade,
} from "@/lib/perguntas";

const TOKEN_STORAGE_KEY = "pesquisa_ti_token";

function subscribeNoop() {
  return () => {};
}
function lerTokenArmazenado() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}
function tokenNoServidor() {
  return null;
}

const ALL_STEPS = [
  "unidade",
  "equipamento_principal",
  "avaliacao_equipamento",
  "acessorios_notebook",
  "usa_celular_corp",
  "avaliacao_celular",
  "avaliacao_atendimento",
  "avaliacao_presenca",
  "resolucao_tempo",
  "itens_melhoria",
  "equipamento_prejudica",
  "nps",
  "ti_faz_bem",
  "principal_melhoria",
  "sugestao",
] as const;

type StepId = (typeof ALL_STEPS)[number];

interface FormState {
  unidade: Unidade | "";
  equipamentoPrincipal: EquipamentoPrincipal | "";
  avaliacaoEquipamento: number | null;
  acessoriosNotebook: AcessoriosNotebook | "";
  usaCelularCorp: boolean | null;
  celularRespondido: boolean;
  avaliacaoCelular: number | null;
  avaliacaoAtendimento: number | null;
  avaliacaoPresenca: number | null;
  resolucaoTempo: ResolucaoTempo | "";
  itensMelhoria: ItemMelhoria[];
  itemMelhoriaOutro: string;
  equipamentoPrejudica: string;
  nps: number | null;
  tiFazBem: string;
  principalMelhoria: string;
  sugestao: string;
}

const ESTADO_INICIAL: FormState = {
  unidade: "",
  equipamentoPrincipal: "",
  avaliacaoEquipamento: null,
  acessoriosNotebook: "",
  usaCelularCorp: null,
  celularRespondido: false,
  avaliacaoCelular: null,
  avaliacaoAtendimento: null,
  avaliacaoPresenca: null,
  resolucaoTempo: "",
  itensMelhoria: [],
  itemMelhoriaOutro: "",
  equipamentoPrejudica: "",
  nps: null,
  tiFazBem: "",
  principalMelhoria: "",
  sugestao: "",
};

function podeTerNotebook(equipamento: EquipamentoPrincipal | ""): boolean {
  return (EQUIPAMENTOS_COM_NOTEBOOK as string[]).includes(equipamento);
}

function stepVisivel(id: StepId, s: FormState): boolean {
  if (id === "acessorios_notebook") return podeTerNotebook(s.equipamentoPrincipal);
  if (id === "avaliacao_celular") return s.usaCelularCorp === true;
  return true;
}

function stepPodeAvancar(id: StepId, s: FormState): boolean {
  switch (id) {
    case "unidade":
      return s.unidade !== "";
    case "equipamento_principal":
      return s.equipamentoPrincipal !== "";
    case "avaliacao_equipamento":
      return s.avaliacaoEquipamento !== null;
    case "acessorios_notebook":
      return s.acessoriosNotebook !== "";
    case "usa_celular_corp":
      return s.usaCelularCorp !== null;
    case "avaliacao_celular":
      return s.celularRespondido;
    case "avaliacao_atendimento":
      return s.avaliacaoAtendimento !== null;
    case "avaliacao_presenca":
      return s.avaliacaoPresenca !== null;
    case "resolucao_tempo":
      return s.resolucaoTempo !== "";
    case "itens_melhoria":
      if (s.itensMelhoria.length < 1 || s.itensMelhoria.length > MAX_ITENS_MELHORIA)
        return false;
      if (s.itensMelhoria.includes("outro") && s.itemMelhoriaOutro.trim() === "")
        return false;
      return true;
    case "nps":
      return s.nps !== null;
    default:
      return true;
  }
}

const MENSAGENS_ERRO_ENVIO: Record<string, string> = {
  token_invalido: "Sua sessão expirou. Volte e informe o CPF novamente.",
  ja_respondida: "Este CPF já respondeu à pesquisa.",
  validacao: "Alguns dados estão inválidos. Revise as respostas e tente novamente.",
  erro_interno: "Erro interno. Tente novamente em instantes.",
};

export default function PesquisaPage() {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeNoop,
    lerTokenArmazenado,
    tokenNoServidor
  );
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [stepId, setStepId] = useState<StepId>("unidade");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  const visiveis = useMemo(
    () => ALL_STEPS.filter((id) => stepVisivel(id, form)),
    [form]
  );
  const indiceAtual = visiveis.indexOf(stepId);
  const ehUltimo = indiceAtual === visiveis.length - 1;

  function atualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((s) => ({ ...s, [campo]: valor }));
  }

  function irParaProxima() {
    if (!stepPodeAvancar(stepId, form)) return;
    const idx = visiveis.indexOf(stepId);
    if (idx < visiveis.length - 1) {
      setStepId(visiveis[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function irParaAnterior() {
    const idx = visiveis.indexOf(stepId);
    if (idx > 0) {
      setStepId(visiveis[idx - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function enviar() {
    if (!token || !stepPodeAvancar(stepId, form)) return;
    setEnviando(true);
    setErroEnvio(null);

    const payload = {
      unidade: form.unidade,
      equipamento_principal: form.equipamentoPrincipal,
      avaliacao_equipamento: form.avaliacaoEquipamento,
      acessorios_notebook: podeTerNotebook(form.equipamentoPrincipal)
        ? form.acessoriosNotebook
        : "nao_utiliza",
      usa_celular_corp: form.usaCelularCorp,
      avaliacao_celular: form.usaCelularCorp ? form.avaliacaoCelular : null,
      avaliacao_atendimento: form.avaliacaoAtendimento,
      avaliacao_presenca: form.avaliacaoPresenca,
      resolucao_tempo: form.resolucaoTempo,
      itens_melhoria: form.itensMelhoria,
      item_melhoria_outro: form.itensMelhoria.includes("outro")
        ? form.itemMelhoriaOutro.trim()
        : null,
      equipamento_prejudica: form.equipamentoPrejudica.trim() || null,
      nps: form.nps,
      ti_faz_bem: form.tiFazBem.trim() || null,
      principal_melhoria: form.principalMelhoria.trim() || null,
      sugestao: form.sugestao.trim() || null,
    };

    try {
      const resp = await fetch("/api/enviar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErroEnvio(
          MENSAGENS_ERRO_ENVIO[data.error] ?? "Erro inesperado. Tente novamente."
        );
        if (data.error === "token_invalido" || data.error === "ja_respondida") {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        return;
      }

      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      router.push("/obrigado");
    } catch {
      setErroEnvio("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6">
      <div className="mb-6">
        <StepProgress atual={indiceAtual + 1} total={visiveis.length} />
      </div>

      <div className="flex-1 rounded-xl bg-white p-8 shadow-sm">
        {renderStep(stepId, form, atualizar)}

        {erroEnvio && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {erroEnvio}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={irParaAnterior}
          disabled={indiceAtual === 0 || enviando}
          className="rounded-lg px-4 py-2.5 font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={ehUltimo ? enviar : irParaProxima}
          disabled={!stepPodeAvancar(stepId, form) || enviando}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Enviando..." : ehUltimo ? "Enviar" : "Próxima"}
        </button>
      </div>
    </main>
  );
}

function renderStep(
  id: StepId,
  form: FormState,
  atualizar: <K extends keyof FormState>(campo: K, valor: FormState[K]) => void
) {
  switch (id) {
    case "unidade":
      return (
        <Pergunta titulo="Qual é a sua unidade?">
          <OpcoesRadio
            opcoes={UNIDADES.map((u) => ({ value: u, label: u }))}
            valor={form.unidade}
            onChange={(v) => atualizar("unidade", v as Unidade)}
          />
        </Pergunta>
      );

    case "equipamento_principal":
      return (
        <Pergunta titulo="Qual é o seu equipamento principal de trabalho?">
          <OpcoesRadio
            opcoes={EQUIPAMENTO_PRINCIPAL_OPTIONS}
            valor={form.equipamentoPrincipal}
            onChange={(v) =>
              atualizar("equipamentoPrincipal", v as EquipamentoPrincipal)
            }
          />
        </Pergunta>
      );

    case "avaliacao_equipamento":
      return (
        <Pergunta titulo="Como você avalia o seu equipamento?">
          <StarRating
            value={form.avaliacaoEquipamento}
            onChange={(v) => atualizar("avaliacaoEquipamento", v)}
          />
        </Pergunta>
      );

    case "acessorios_notebook":
      return (
        <Pergunta titulo="Você recebeu os acessórios necessários para o notebook (mochila, mouse, carregador, etc.)?">
          <OpcoesRadio
            opcoes={ACESSORIOS_NOTEBOOK_OPTIONS}
            valor={form.acessoriosNotebook}
            onChange={(v) =>
              atualizar("acessoriosNotebook", v as AcessoriosNotebook)
            }
          />
        </Pergunta>
      );

    case "usa_celular_corp":
      return (
        <Pergunta titulo="Você usa celular corporativo?">
          <OpcoesRadio
            opcoes={[
              { value: "sim", label: "Sim" },
              { value: "nao", label: "Não" },
            ]}
            valor={
              form.usaCelularCorp === null ? "" : form.usaCelularCorp ? "sim" : "nao"
            }
            onChange={(v) => atualizar("usaCelularCorp", v === "sim")}
          />
        </Pergunta>
      );

    case "avaliacao_celular":
      return (
        <Pergunta titulo="Como você avalia o celular corporativo?">
          <div className="space-y-4">
            <StarRating
              value={form.avaliacaoCelular}
              onChange={(v) => {
                atualizar("avaliacaoCelular", v);
                atualizar("celularRespondido", true);
              }}
            />
            <button
              type="button"
              onClick={() => {
                atualizar("avaliacaoCelular", null);
                atualizar("celularRespondido", true);
              }}
              className={`rounded-lg border px-4 py-2 text-sm ${
                form.celularRespondido && form.avaliacaoCelular === null
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              Não utilizo
            </button>
          </div>
        </Pergunta>
      );

    case "avaliacao_atendimento":
      return (
        <Pergunta titulo="Como você avalia o atendimento da TI?">
          <StarRating
            value={form.avaliacaoAtendimento}
            onChange={(v) => atualizar("avaliacaoAtendimento", v)}
          />
        </Pergunta>
      );

    case "avaliacao_presenca":
      return (
        <Pergunta titulo="Como você avalia a presença/disponibilidade da TI?">
          <StarRating
            value={form.avaliacaoPresenca}
            onChange={(v) => atualizar("avaliacaoPresenca", v)}
          />
        </Pergunta>
      );

    case "resolucao_tempo":
      return (
        <Pergunta titulo="A TI resolve seus problemas em tempo adequado?">
          <OpcoesRadio
            opcoes={RESOLUCAO_TEMPO_OPTIONS}
            valor={form.resolucaoTempo}
            onChange={(v) => atualizar("resolucaoTempo", v as ResolucaoTempo)}
          />
        </Pergunta>
      );

    case "itens_melhoria": {
      const outroSelecionado = form.itensMelhoria.includes("outro");
      const limiteAtingido = form.itensMelhoria.length >= MAX_ITENS_MELHORIA;
      return (
        <Pergunta titulo={`Quais itens mais precisam de melhoria? (máx. ${MAX_ITENS_MELHORIA})`}>
          <div className="space-y-2">
            {ITENS_MELHORIA_OPTIONS.map((opcao) => {
              const marcado = form.itensMelhoria.includes(opcao.value);
              const desabilitado = !marcado && limiteAtingido;
              return (
                <label
                  key={opcao.value}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${
                    desabilitado ? "opacity-40" : "cursor-pointer"
                  } ${marcado ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    disabled={desabilitado}
                    onChange={() => {
                      const novos = marcado
                        ? form.itensMelhoria.filter((v) => v !== opcao.value)
                        : [...form.itensMelhoria, opcao.value];
                      atualizar("itensMelhoria", novos);
                      if (opcao.value === "outro" && marcado) {
                        atualizar("itemMelhoriaOutro", "");
                      }
                    }}
                  />
                  {opcao.label}
                </label>
              );
            })}
          </div>

          {outroSelecionado && (
            <input
              type="text"
              placeholder="Descreva o item"
              value={form.itemMelhoriaOutro}
              onChange={(e) => atualizar("itemMelhoriaOutro", e.target.value)}
              maxLength={2000}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </Pergunta>
      );
    }

    case "equipamento_prejudica":
      return (
        <Pergunta titulo="Algum equipamento ou recurso atrapalha o seu trabalho? (opcional)">
          <TextoAberto
            valor={form.equipamentoPrejudica}
            onChange={(v) => atualizar("equipamentoPrejudica", v)}
          />
        </Pergunta>
      );

    case "nps":
      return (
        <Pergunta titulo="Em uma escala de 0 a 10, o quanto você recomendaria a TI para um colega?">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: NPS_MAX - NPS_MIN + 1 }, (_, i) => NPS_MIN + i).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => atualizar("nps", n)}
                  className={`h-11 w-11 rounded-lg border font-medium ${
                    form.nps === n
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {n}
                </button>
              )
            )}
          </div>
        </Pergunta>
      );

    case "ti_faz_bem":
      return (
        <Pergunta titulo="O que a TI faz muito bem? (opcional)">
          <TextoAberto
            valor={form.tiFazBem}
            onChange={(v) => atualizar("tiFazBem", v)}
          />
        </Pergunta>
      );

    case "principal_melhoria":
      return (
        <Pergunta titulo="Qual a principal melhoria que a TI poderia trazer para sua unidade? (opcional)">
          <TextoAberto
            valor={form.principalMelhoria}
            onChange={(v) => atualizar("principalMelhoria", v)}
          />
        </Pergunta>
      );

    case "sugestao":
      return (
        <Pergunta titulo="Alguma sugestão, crítica ou elogio? (opcional)">
          <TextoAberto
            valor={form.sugestao}
            onChange={(v) => atualizar("sugestao", v)}
          />
        </Pergunta>
      );
  }
}

function Pergunta({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-5 text-lg font-medium text-gray-900">{titulo}</h2>
      {children}
    </div>
  );
}

function OpcoesRadio({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: readonly { value: string; label: string }[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {opcoes.map((opcao) => (
        <label
          key={opcao.value}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 ${
            valor === opcao.value
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300"
          }`}
        >
          <input
            type="radio"
            checked={valor === opcao.value}
            onChange={() => onChange(opcao.value)}
          />
          {opcao.label}
        </label>
      ))}
    </div>
  );
}

function TextoAberto({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      maxLength={2000}
      rows={4}
      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}
