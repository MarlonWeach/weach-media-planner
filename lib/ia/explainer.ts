/**
 * Agente IA - Explainer
 * 
 * Responsável por gerar texto comercial explicativo do plano de mídia.
 * Baseado em: docs/prompts/prompt-explicacao-comercial.md
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParametrosExplainer {
  clienteNome: string;
  segmento: string;
  objetivo: string;
  regiao: string;
  mix: Array<{ canal: string; percentual: number }>;
  modelosCompra: Record<string, string>;
  estimativas: {
    impressoes?: number;
    cliques?: number;
    leads?: number;
  };
}

/**
 * Gera explicação comercial do plano de mídia
 */
export async function gerarExplicacaoComercial(
  parametros: ParametrosExplainer
): Promise<string> {
  const prompt = construirPromptExplainer(parametros);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você atua como redator comercial da Weach.

Sua função:
- explicar o plano de mídia aprovado
- destacar benefícios do mix de canais
- reforçar alinhamento com o objetivo do cliente
- fazer isso em linguagem acessível, profissional e direta

REGRAS OBRIGATÓRIAS:
- Não invente números diferentes dos informados
- Não prometa resultados garantidos (sempre fale em estimativas)
- Não mencione fórmulas internas ou termos técnicos demais
- Não exponha lógica de pricing interna para o cliente

FORMATO:
- 3 a 6 parágrafos curtos
- Tom profissional, mas próximo
- Escrever em primeira pessoa do plural (ex: "recomendamos", "vamos acompanhar")`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? gerarExplicacaoPadrao(parametros);
  } catch (error) {
    console.error('Erro ao gerar explicação comercial:', error);
    return gerarExplicacaoPadrao(parametros);
  }
}

/**
 * Constrói prompt para o Explainer
 */
function construirPromptExplainer(parametros: ParametrosExplainer): string {
  const mixTexto = parametros.mix
    .map(item => `- ${item.canal}: ${item.percentual}% do budget`)
    .join('\n');

  const estimativasTexto = [
    parametros.estimativas.impressoes ? `Impressões estimadas: ${parametros.estimativas.impressoes.toLocaleString('pt-BR')}` : '',
    parametros.estimativas.cliques ? `Cliques estimados: ${parametros.estimativas.cliques.toLocaleString('pt-BR')}` : '',
    parametros.estimativas.leads ? `Leads estimados: ${parametros.estimativas.leads.toLocaleString('pt-BR')}` : '',
  ].filter(Boolean).join('\n');

  return `Gere um texto comercial explicativo para a seguinte proposta:

CLIENTE: ${parametros.clienteNome}
SEGMENTO: ${parametros.segmento}
OBJETIVO: ${parametros.objetivo}
REGIÃO: ${parametros.regiao}

MIX DE CANAIS:
${mixTexto}

ESTIMATIVAS:
${estimativasTexto}

O texto deve:
1. Começar com 1 parágrafo resumindo o objetivo e a estratégia geral
2. Trazer 1 ou 2 parágrafos explicando canais principais e papéis no funil
3. Destacar benefícios de usar a Weach (curadoria, inventário premium, controle, otimização)
4. Encerrar com 1 parágrafo mostrando que o plano é flexível e pode ser otimizado durante a campanha`;
}

/**
 * Gera explicação padrão quando a IA falha
 */
function gerarExplicacaoPadrao(parametros: ParametrosExplainer): string {
  const canaisPrincipais = parametros.mix
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 3)
    .map(item => item.canal.replace('_', ' '))
    .join(', ');

  return `Recomendamos um plano de mídia multicanal alinhado ao objetivo de ${parametros.objetivo} para ${parametros.clienteNome} no segmento ${parametros.segmento}.

O mix proposto prioriza ${canaisPrincipais}, garantindo uma distribuição estratégica do investimento que maximiza o alcance e a performance da campanha na região ${parametros.regiao}.

A Weach oferece curadoria de inventário premium, governança rigorosa de mídia e experiência comprovada em campanhas de performance, garantindo que cada real investido seja otimizado continuamente.

Este plano é flexível e pode ser ajustado durante a execução com base nos resultados em tempo real, permitindo otimizações que maximizam o ROI da campanha.`;
}

