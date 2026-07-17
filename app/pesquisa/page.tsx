"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import StepProgress from "@/components/StepProgress";
import {
  UNIDADES,
  EQUIPAMENTO_PRINCIPAL_OPTIONS,
  EQUIPAMENTO_PRINCIPAL_NENHUM,
  EQUIPAMENTOS_COM_NOTEBOOK,
  ACESSORIOS_NOTEBOOK_OPTIONS,
  RESOLUCAO_TEMPO_OPTIONS,
  ITENS_MELHORIA_OPTIONS,
  MAX_ITENS_MELHORIA,
  NPS_MIN,
  NPS_MAX,
  LIMITE_ESTRELA_COMENTARIO,
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
  equipamentoPrincipal: EquipamentoPrincipal[];
  avaliacaoEquipamento: number | null;
  comentarioEquipamento: string;
  acessoriosNotebook: AcessoriosNotebook | "";
  usaCelularCorp: boolean | null;
  celularRespondido: boolean;
  avaliacaoCelular: number | null;
  comentarioCelular: string;
  avaliacaoAtendimento: number | null;
  comentarioAtendimento: string;
  avaliacaoPresenca: number | null;
  comentarioPresenca: string;
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
  equipamentoPrincipal: [],
  avaliacaoEquipamento: null,
  comentarioEquipamento: "",
  acessoriosNotebook: "",
  usaCelularCorp: null,
  celularRespondido: false,
  avaliacaoCelular: null,
  comentarioCelular: "",
  avaliacaoAtendimento: null,
  comentarioAtendimento: "",
  avaliacaoPresenca: null,
  comentarioPresenca: "",
  resolucaoTempo: "",
  itensMelhoria: [],
  itemMelhoriaOutro: "",
  equipamentoPrejudica: "",
  nps: null,
  tiFazBem: "",
  principalMelhoria: "",
  sugestao: "",
};

function podeTerNotebook(equipamentos: EquipamentoPrincipal[]): boolean {
  return equipamentos.some((e) => (EQUIPAMENTOS_COM_NOTEBOOK as string[]).includes(e));
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
      return s.equipamentoPrincipal.length > 0;
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
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    // `enviado` evita corrida com o redirect para /obrigado: sem ele, o
    // re-render disparado por limpar o token (submissão OK) poderia fazer
    // este efeito mandar de volta para "/" antes do router.push concluir.
    if (!token && !enviado) {
      router.replace("/");
    }
  }, [token, enviado, router]);

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
      comentario_avaliacao_equipamento:
        form.avaliacaoEquipamento !== null &&
        form.avaliacaoEquipamento <= LIMITE_ESTRELA_COMENTARIO
          ? form.comentarioEquipamento.trim() || null
          : null,
      acessorios_notebook: podeTerNotebook(form.equipamentoPrincipal)
        ? form.acessoriosNotebook
        : "nao_utiliza",
      usa_celular_corp: form.usaCelularCorp,
      avaliacao_celular: form.usaCelularCorp ? form.avaliacaoCelular : null,
      comentario_avaliacao_celular:
        form.usaCelularCorp &&
        form.avaliacaoCelular !== null &&
        form.avaliacaoCelular <= LIMITE_ESTRELA_COMENTARIO
          ? form.comentarioCelular.trim() || null
          : null,
      avaliacao_atendimento: form.avaliacaoAtendimento,
      comentario_avaliacao_atendimento:
        form.avaliacaoAtendimento !== null &&
        form.avaliacaoAtendimento <= LIMITE_ESTRELA_COMENTARIO
          ? form.comentarioAtendimento.trim() || null
          : null,
      avaliacao_presenca: form.avaliacaoPresenca,
      comentario_avaliacao_presenca:
        form.avaliacaoPresenca !== null &&
        form.avaliacaoPresenca <= LIMITE_ESTRELA_COMENTARIO
          ? form.comentarioPresenca.trim() || null
          : null,
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

      setEnviado(true);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      router.push("/obrigado");
    } catch {
      setErroEnvio("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token && !enviado) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4 sm:p-6 md:py-10 justify-center min-h-screen">
      
      {/* Header Branded Section */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-base">Revalle</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Pesquisa TI
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Totalmente Anônimo
        </div>
      </div>

      <div className="mb-6">
        <StepProgress atual={indiceAtual + 1} total={visiveis.length} />
      </div>

      <div className="flex-1 rounded-3xl bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 transition-all duration-300">
        <div className="animate-fade-in duration-300">
          {renderStep(stepId, form, atualizar)}
        </div>

        {erroEnvio && (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 border border-red-100 text-sm text-red-700 animate-fade-in"
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
            <span className="font-medium">{erroEnvio}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <button
          type="button"
          onClick={irParaAnterior}
          disabled={indiceAtual === 0 || enviando}
          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>

        <button
          type="button"
          onClick={ehUltimo ? enviar : irParaProxima}
          disabled={!stepPodeAvancar(stepId, form) || enviando}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </span>
          ) : ehUltimo ? (
            <span className="flex items-center gap-1">
              Finalizar Pesquisa
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Próxima
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          )}
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
  // SVG Icon definitions
  const pinIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const monitorIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const starIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.385-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );

  const giftIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const phoneIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const chatIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );

  const wrenchIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const thumbsUpIcon = (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );

  switch (id) {
    case "unidade":
      return (
        <Pergunta icone={pinIcon} titulo="Qual é a sua unidade?">
          <OpcoesRadio
            opcoes={UNIDADES.map((u) => ({ value: u, label: u }))}
            valor={form.unidade}
            onChange={(v) => atualizar("unidade", v as Unidade)}
          />
        </Pergunta>
      );

    case "equipamento_principal": {
      const toggleEquipamento = (valor: EquipamentoPrincipal) => {
        if (valor === EQUIPAMENTO_PRINCIPAL_NENHUM) {
          const novoEstado = form.equipamentoPrincipal.includes(
            EQUIPAMENTO_PRINCIPAL_NENHUM
          )
            ? []
            : [EQUIPAMENTO_PRINCIPAL_NENHUM];
          atualizar("equipamentoPrincipal", novoEstado);
          return;
        }
        const semNenhum = form.equipamentoPrincipal.filter(
          (e) => e !== EQUIPAMENTO_PRINCIPAL_NENHUM
        );
        const marcado = semNenhum.includes(valor);
        atualizar(
          "equipamentoPrincipal",
          marcado ? semNenhum.filter((e) => e !== valor) : [...semNenhum, valor]
        );
      };

      return (
        <Pergunta
          icone={monitorIcon}
          titulo="Qual é o seu equipamento principal de trabalho?"
          subtitulo="Pode selecionar mais de uma opção."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {EQUIPAMENTO_PRINCIPAL_OPTIONS.map((opcao) => {
              const marcado = form.equipamentoPrincipal.includes(opcao.value);
              return (
                <label
                  key={opcao.value}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4.5 transition-all duration-200 select-none ${
                    marcado
                      ? "border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/30"
                  }`}
                >
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={marcado}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                      onChange={() => toggleEquipamento(opcao.value)}
                    />
                  </div>
                  <span className="text-sm font-medium leading-none">{opcao.label}</span>
                </label>
              );
            })}
          </div>
        </Pergunta>
      );
    }

    case "avaliacao_equipamento":
      return (
        <Pergunta icone={starIcon} titulo="Como você avalia o seu equipamento?">
          <div className="space-y-4 py-2">
            <StarRating
              value={form.avaliacaoEquipamento}
              onChange={(v) => atualizar("avaliacaoEquipamento", v)}
            />
            {form.avaliacaoEquipamento !== null &&
              form.avaliacaoEquipamento <= LIMITE_ESTRELA_COMENTARIO && (
                <ComentarioNotaBaixa
                  valor={form.comentarioEquipamento}
                  onChange={(v) => atualizar("comentarioEquipamento", v)}
                />
              )}
          </div>
        </Pergunta>
      );

    case "acessorios_notebook":
      return (
        <Pergunta icone={giftIcon} titulo="Você recebeu os acessórios necessários para o notebook (mochila, mouse, carregador, etc.)?">
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
        <Pergunta icone={phoneIcon} titulo="Você usa celular corporativo?">
          <OpcoesRadio
            opcoes={[
              { value: "sim", label: "Sim, utilizo celular da empresa" },
              { value: "nao", label: "Não utilizo" },
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
        <Pergunta icone={starIcon} titulo="Como você avalia o celular corporativo?">
          <div className="space-y-6 py-2">
            <StarRating
              value={form.avaliacaoCelular}
              onChange={(v) => {
                atualizar("avaliacaoCelular", v);
                atualizar("celularRespondido", true);
              }}
            />
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  atualizar("avaliacaoCelular", null);
                  atualizar("celularRespondido", true);
                }}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                  form.celularRespondido && form.avaliacaoCelular === null
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/10"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Não utilizo este recurso
              </button>
            </div>
            {form.avaliacaoCelular !== null &&
              form.avaliacaoCelular <= LIMITE_ESTRELA_COMENTARIO && (
                <ComentarioNotaBaixa
                  valor={form.comentarioCelular}
                  onChange={(v) => atualizar("comentarioCelular", v)}
                />
              )}
          </div>
        </Pergunta>
      );

    case "avaliacao_atendimento":
      return (
        <Pergunta icone={starIcon} titulo="Como você avalia o atendimento da TI?">
          <div className="space-y-4 py-2">
            <StarRating
              value={form.avaliacaoAtendimento}
              onChange={(v) => atualizar("avaliacaoAtendimento", v)}
            />
            {form.avaliacaoAtendimento !== null &&
              form.avaliacaoAtendimento <= LIMITE_ESTRELA_COMENTARIO && (
                <ComentarioNotaBaixa
                  valor={form.comentarioAtendimento}
                  onChange={(v) => atualizar("comentarioAtendimento", v)}
                />
              )}
          </div>
        </Pergunta>
      );

    case "avaliacao_presenca":
      return (
        <Pergunta icone={starIcon} titulo="Como você avalia a presença/disponibilidade da TI?">
          <div className="space-y-4 py-2">
            <StarRating
              value={form.avaliacaoPresenca}
              onChange={(v) => atualizar("avaliacaoPresenca", v)}
            />
            {form.avaliacaoPresenca !== null &&
              form.avaliacaoPresenca <= LIMITE_ESTRELA_COMENTARIO && (
                <ComentarioNotaBaixa
                  valor={form.comentarioPresenca}
                  onChange={(v) => atualizar("comentarioPresenca", v)}
                />
              )}
          </div>
        </Pergunta>
      );

    case "resolucao_tempo":
      return (
        <Pergunta icone={wrenchIcon} titulo="A TI resolve seus problemas em tempo adequado?">
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
        <Pergunta
          icone={wrenchIcon}
          titulo="Quais itens mais precisam de melhoria?"
          subtitulo={`Escolha no máximo ${MAX_ITENS_MELHORIA} opções.`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {ITENS_MELHORIA_OPTIONS.map((opcao) => {
              const marcado = form.itensMelhoria.includes(opcao.value);
              const desabilitado = !marcado && limiteAtingido;
              return (
                <label
                  key={opcao.value}
                  className={`relative flex items-center gap-3.5 rounded-2xl border p-4.5 transition-all duration-200 select-none ${
                    desabilitado 
                      ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50/50" 
                      : "cursor-pointer hover:border-slate-300 hover:bg-slate-50/30"
                  } ${marcado ? "border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm" : "border-slate-200 text-slate-700"}`}
                >
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={marcado}
                      disabled={desabilitado}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
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
                  </div>
                  <span className="text-sm font-medium leading-none">{opcao.label}</span>
                </label>
              );
            })}
          </div>

          {outroSelecionado && (
            <div className="mt-4 animate-fade-in">
              <input
                type="text"
                placeholder="Qual item precisa de melhoria? Por favor, descreva..."
                value={form.itemMelhoriaOutro}
                onChange={(e) => atualizar("itemMelhoriaOutro", e.target.value)}
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          )}
        </Pergunta>
      );
    }

    case "equipamento_prejudica":
      return (
        <Pergunta icone={monitorIcon} titulo="Algum equipamento ou recurso atrapalha o seu trabalho? (opcional)">
          <TextoAberto
            valor={form.equipamentoPrejudica}
            placeholder="Ex: Computador lento no carregamento de planilhas, sinal de Wi-Fi fraco na sala de reuniões..."
            onChange={(v) => atualizar("equipamentoPrejudica", v)}
          />
        </Pergunta>
      );

    case "nps":
      return (
        <Pergunta
          icone={thumbsUpIcon}
          titulo="Em uma escala de 0 a 10, o quanto você recomendaria a TI para um colega?"
          subtitulo="Sendo 0 = 'De forma alguma recomendaria' e 10 = 'Recomendaria com certeza'."
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-wrap gap-2 justify-between">
              {Array.from({ length: NPS_MAX - NPS_MIN + 1 }, (_, i) => NPS_MIN + i).map(
                (n) => {
                  const active = form.nps === n;
                  // Color scale classes depending on value
                  let btnStyle = "border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50";
                  if (active) {
                    if (n <= 6) btnStyle = "border-red-600 bg-red-600 text-white shadow-md shadow-red-500/10";
                    else if (n <= 8) btnStyle = "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/10";
                    else btnStyle = "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/10";
                  }
                  
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => atualizar("nps", n)}
                      className={`h-11 w-11 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-90 flex items-center justify-center ${btnStyle}`}
                    >
                      {n}
                    </button>
                  );
                }
              )}
            </div>
            
            {/* NPS Extremes Indicator */}
            <div className="flex justify-between text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
              <span>0 - Pouco provável</span>
              <span>10 - Muito provável</span>
            </div>
          </div>
        </Pergunta>
      );

    case "ti_faz_bem":
      return (
        <Pergunta icone={thumbsUpIcon} titulo="O que a TI faz muito bem? (opcional)">
          <TextoAberto
            valor={form.tiFazBem}
            placeholder="Descreva pontos positivos no atendimento, sistemas, suporte, etc..."
            onChange={(v) => atualizar("tiFazBem", v)}
          />
        </Pergunta>
      );

    case "principal_melhoria":
      return (
        <Pergunta icone={wrenchIcon} titulo="Qual a principal melhoria que a TI poderia trazer para sua unidade? (opcional)">
          <TextoAberto
            valor={form.principalMelhoria}
            placeholder="Qual seria o ajuste mais urgente ou benéfico para a rotina de trabalho na sua unidade?"
            onChange={(v) => atualizar("principalMelhoria", v)}
          />
        </Pergunta>
      );

    case "sugestao":
      return (
        <Pergunta icone={chatIcon} titulo="Alguma sugestão, crítica ou elogio? (opcional)">
          <TextoAberto
            valor={form.sugestao}
            placeholder="Deixe seu feedback final para a nossa equipe..."
            onChange={(v) => atualizar("sugestao", v)}
          />
        </Pergunta>
      );
  }
}

function Pergunta({
  titulo,
  subtitulo,
  icone,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {icone && (
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icone}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
            {titulo}
          </h2>
          {subtitulo && <p className="text-xs text-slate-400 leading-relaxed">{subtitulo}</p>}
        </div>
      </div>
      <div className="pt-1">{children}</div>
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
    <div className="space-y-3">
      {opcoes.map((opcao) => {
        const selected = valor === opcao.value;
        return (
          <label
            key={opcao.value}
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all duration-200 select-none ${
              selected
                ? "border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm"
                : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/30"
            }`}
          >
            <span className="text-sm font-semibold">{opcao.label}</span>
            <div className="flex h-5 items-center">
              <input
                type="radio"
                checked={selected}
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 focus:ring-blue-500/20"
                onChange={() => onChange(opcao.value)}
              />
            </div>
          </label>
        );
      })}
    </div>
  );
}

function TextoAberto({
  valor,
  placeholder,
  onChange,
}: {
  valor: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const charLimit = 2000;
  const currentCount = valor.length;

  return (
    <div className="relative space-y-1">
      <textarea
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={charLimit}
        rows={5}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
      />
      <div className="flex justify-end text-xs font-semibold text-slate-400 pr-1 select-none">
        {currentCount} / {charLimit}
      </div>
    </div>
  );
}

function ComentarioNotaBaixa({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="animate-fade-in space-y-1.5">
      <label className="text-xs font-semibold text-slate-500">
        Quer nos contar o que pegou? (opcional)
      </label>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Conte um pouco mais sobre o que não funcionou bem..."
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

