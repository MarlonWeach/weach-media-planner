/**
 * Agente IA - Validator
 * 
 * Valida consistência do plano de mídia gerado, apontando inconsistências e sugerindo melhorias.
 * Baseado em: docs/10-plano-de-IA.md - Seção 3.4
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParametrosValidator {
  objetivo: string;
  segmento: string;
  regiao: string;
  budget: number;
  mix: Array<{ canal: string; percentual: number }>;
  estimativas?: any;
}

export interface AvisoValidacao {
  tipo: 'erro' | 'aviso' | 'sugestao';
  mensagem: string;
  campo?: string;
  severidade: 'baixa' | 'media' | 'alta';
}

export interface RespostaValidator {
  avisos: AvisoValidacao[];
  valido: boolean;
}

/**
 * Valida plano de mídia usando IA
 */
export async function validarPlanoMidia(
  parametros: ParametrosValidator
): Promise<RespostaValidator> {
  // Validação determinística primeiro (soma = 100%)
  const somaPercentuais = parametros.mix.reduce(
    (acc, item) => acc + item.percentual,
    0
  );

  const avisos: AvisoValidacao[] = [];

  if (Math.abs(somaPercentuais - 100) > 0.01) {
    avisos.push({
      tipo: 'erro',
      mensagem: `A soma dos percentuais do mix é ${somaPercentuais.toFixed(2)}%, mas deve ser exatamente 100%`,
      campo: 'mix',
      severidade: 'alta',
    });
  }

  // Validações básicas
  if (parametros.mix.length === 0) {
    avisos.push({
      tipo: 'erro',
      mensagem: 'Nenhum canal foi selecionado no mix de mídia',
      campo: 'mix',
      severidade: 'alta',
    });
  }

  // Validação com IA
  try {
    const avisosIA = await validarComIA(parametros);
    avisos.push(...avisosIA);
  } catch (error) {
    console.error('Erro ao validar com IA:', error);
    // Continua mesmo se a IA falhar
  }

  return {
    avisos,
    valido: avisos.filter((a) => a.tipo === 'erro').length === 0,
  };
}

/**
 * Valida usando IA
 */
async function validarComIA(
  parametros: ParametrosValidator
): Promise<AvisoValidacao[]> {
  const prompt = construirPromptValidator(parametros);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um validador de planos de mídia da Weach.

Sua função é:
- Verificar inconsistências no plano ou no mix
- Apontar problemas como:
  - canal subutilizado ou superestimado
  - estratégia desalinhada ao objetivo
  - distribuição de budget incoerente com tamanho da região
- Emitir AVISOS, nunca erros bloqueadores
- Ser construtivo e sugerir melhorias

REGRAS:
- Não bloquear a criação da cotação
- Retornar apenas avisos e sugestões
- Ser específico e acionável
- Retornar JSON válido

FORMATO DE RESPOSTA:
{
  "avisos": [
    {
      "tipo": "aviso" | "sugestao",
      "mensagem": "Texto do aviso",
      "campo": "campo relacionado (opcional)",
      "severidade": "baixa" | "media" | "alta"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Mais determinístico para validação
    });

    const conteudo = response.choices[0]?.message?.content;
    if (!conteudo) {
      return [];
    }

    const resultado = JSON.parse(conteudo) as { avisos: AvisoValidacao[] };
    return resultado.avisos || [];
  } catch (error) {
    console.error('Erro ao validar com IA:', error);
    return [];
  }
}

/**
 * Constrói prompt para o Validator
 */
function construirPromptValidator(
  parametros: ParametrosValidator
): string {
  const mixTexto = parametros.mix
    .map((item) => `- ${item.canal}: ${item.percentual}%`)
    .join('\n');

  return `Valide o seguinte plano de mídia:

OBJETIVO: ${parametros.objetivo}
SEGMENTO: ${parametros.segmento}
REGIÃO: ${parametros.regiao}
BUDGET: R$ ${parametros.budget.toLocaleString('pt-BR')}

MIX DE CANAIS:
${mixTexto}

ESTIMATIVAS:
${parametros.estimativas ? JSON.stringify(parametros.estimativas, null, 2) : 'Não disponíveis'}

Verifique:
1. Se o mix está alinhado com o objetivo ${parametros.objetivo}
2. Se algum canal está subutilizado (< 5%) ou superestimado (> 50%)
3. Se a distribuição faz sentido para a região ${parametros.regiao}
4. Se há canais faltando que seriam importantes para o objetivo
5. Se o budget está bem distribuído entre os canais

Retorne apenas avisos e sugestões, nunca erros bloqueadores.`;
}

