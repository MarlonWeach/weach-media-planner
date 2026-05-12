/**
 * Espelho de perguntas/respostas do wizard para e-mail e PDF de briefing.
 * Inclui apenas o bloco correspondente à definição de campanha selecionada
 * (Performance, Programática ou WhatsApp/SMS/PUSH), além de dados comuns
 * (solicitação, objetivo, cobertura).
 * Valores vazios aparecem como "(Em branco)".
 */

export type BriefingLinha = { label: string; value: string };

const EM_BRANCO = '(Em branco)';

function textoOuBranco(value: unknown): string {
  if (value === null || value === undefined) return EM_BRANCO;
  const s = String(value).trim();
  return s.length > 0 ? s : EM_BRANCO;
}

function joinLista(value: unknown, separador = ', '): string {
  if (!Array.isArray(value) || value.length === 0) return EM_BRANCO;
  const s = value.map((x) => String(x).trim()).filter(Boolean).join(separador);
  return s.length > 0 ? s : EM_BRANCO;
}

function formatarSimNao(value: unknown): string {
  if (value === true || value === 'true') return 'Sim';
  if (value === false || value === 'false') return 'Não';
  return EM_BRANCO;
}

const LABELS_OBJETIVO: Record<string, string> = {
  AWARENESS: 'Awareness',
  CONSIDERACAO: 'Consideração',
  LEADS: 'Leads',
  VENDAS: 'Vendas',
};

function textoObjetivo(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return EM_BRANCO;
  return LABELS_OBJETIVO[raw] || raw;
}

function extrairDefinicoesCampanha(est: Record<string, unknown>): Set<string> {
  const raw = est.definicaoCampanha;
  if (!Array.isArray(raw)) return new Set();
  return new Set(
    raw
      .map((item) => String(item || '').trim().toUpperCase())
      .filter((item) => item.length > 0)
  );
}

function montarLinhasDePayload(payload: Record<string, unknown>): BriefingLinha[] {
  const sol = (payload.solicitacao as Record<string, unknown>) || {};
  const est = (payload.estrategia as Record<string, unknown>) || {};
  const perf = (est.performance as Record<string, unknown>) || {};
  const prog = (est.programatica as Record<string, unknown>) || {};
  const cob = (payload.cobertura as Record<string, unknown>) || {};

  const definicoes = extrairDefinicoesCampanha(est);
  const temPerformance = definicoes.has('PERFORMANCE');
  const temProgramatica = definicoes.has('PROGRAMATICA');
  const temMensageria = definicoes.has('WHATSAPP_SMS_PUSH');

  const comum: BriefingLinha[] = [
    { label: 'Data da solicitação', value: textoOuBranco(sol.dataSolicitacao) },
    { label: 'Nome do anunciante / campanha', value: textoOuBranco(sol.anuncianteCampanha) },
    { label: 'URL da campanha / Landing Page', value: textoOuBranco(sol.urlLp) },
    { label: 'Solicitante', value: textoOuBranco(sol.solicitante) },
    { label: 'E-mail do solicitante', value: textoOuBranco(sol.solicitanteEmail) },
    { label: 'Agência', value: textoOuBranco(sol.agencia) },
    {
      label: 'Cotação pró-ativa',
      value:
        sol.cotacaoProativa === true || sol.cotacaoProativa === 'true'
          ? 'Sim'
          : sol.cotacaoProativa === false || sol.cotacaoProativa === 'false'
            ? 'Não'
            : EM_BRANCO,
    },
    { label: 'Link do anexo (Drive)', value: textoOuBranco(sol.anexoDriveLink) },
    { label: 'Observações gerais', value: textoOuBranco(sol.observacoesGerais) },
    { label: 'Objetivo da campanha', value: textoObjetivo(est.objetivo) },
    { label: 'Definição de campanha', value: joinLista(est.definicaoCampanha) },
  ];

  const mensageria: BriefingLinha[] = temMensageria
    ? [
        {
          label: 'Serviços (WhatsApp / SMS / PUSH)',
          value: joinLista(est.servicosMensageria),
        },
      ]
    : [];

  const performance: BriefingLinha[] = temPerformance
    ? [
        { label: 'Modelos de campanha (Performance)', value: joinLista(perf.modelos) },
        { label: 'Outro modelo (Performance)', value: textoOuBranco(perf.modeloOutro) },
        {
          label: 'CPL — campos de cadastro necessários',
          value: textoOuBranco(perf.cplCamposCadastro),
        },
        { label: 'CPL — cliente exigiu filtro?', value: formatarSimNao(perf.cplExigiuFiltro) },
        { label: 'CPL — qual filtro foi exigido?', value: textoOuBranco(perf.cplQualFiltro) },
        {
          label: 'CPL — conversão do lead completa',
          value: textoOuBranco(perf.cplConversaoLeadCompleta),
        },
        {
          label: 'Cliente veicula em outras redes?',
          value: textoOuBranco(perf.veiculaOutrasRedes),
        },
        { label: 'Quais outras redes?', value: textoOuBranco(perf.veiculaQuaisRedes) },
        {
          label: 'Cliente sugeriu valor (CPA/CPL)?',
          value: formatarSimNao(perf.clienteSugeriuValor),
        },
        { label: 'Valor sugerido pelo cliente', value: textoOuBranco(perf.clienteValorSugerido) },
      ]
    : [];

  const programatica: BriefingLinha[] = temProgramatica
    ? [
        { label: 'Modelos de campanha (Programática)', value: joinLista(prog.modelos) },
        { label: 'Outro modelo (Programática)', value: textoOuBranco(prog.modeloOutro) },
        {
          label: 'Formatos de display ou vídeo pretendidos',
          value: textoOuBranco(prog.formatosPretendidos),
        },
        {
          label: 'Segmentação exigida pelo anunciante',
          value: textoOuBranco(prog.segmentacaoExigida),
        },
        { label: 'KPI objetivo', value: textoOuBranco(prog.kpiObjetivo) },
        {
          label: 'Precisa de dados de audiência para a proposta?',
          value: formatarSimNao(prog.precisaDadosAudiencia),
        },
      ]
    : [];

  const cobertura: BriefingLinha[] = [
    { label: 'Tipo de região', value: textoOuBranco(cob.tipoRegiao) },
    { label: 'Estados selecionados', value: joinLista(cob.estadosSelecionados) },
    { label: 'Cidades', value: textoOuBranco(cob.cidades) },
  ];

  return [...comum, ...mensageria, ...performance, ...programatica, ...cobertura];
}

/**
 * Monta as linhas do espelho a partir do JSON em `wp_Cotacao.observacoes`,
 * respeitando o tipo de campanha guardado em `estrategia.definicaoCampanha`.
 */
export function montarLinhasBriefingObservacoes(observacoes?: string | null): BriefingLinha[] {
  if (!observacoes || !String(observacoes).trim()) {
    return montarLinhasDePayload({});
  }

  try {
    const parsed = JSON.parse(observacoes) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [{ label: 'Observações (texto)', value: String(observacoes).trim() }];
    }
    return montarLinhasDePayload(parsed as Record<string, unknown>);
  } catch {
    return [{ label: 'Observações (texto)', value: String(observacoes).trim() }];
  }
}
