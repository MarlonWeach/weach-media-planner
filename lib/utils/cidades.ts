const CIDADES_GRANDES_ALIASES: Record<string, string[]> = {
  'sao paulo': ['sao paulo', 'são paulo', 'sao paulo sp', 'são paulo sp', 'sao paulo-sp', 'são paulo-sp', 'sao paulo capital', 'são paulo capital', 'sao capital', 'são capital'],
  'rio de janeiro': ['rio de janeiro', 'rio de janeiro rj', 'rio de janeiro-rj', 'rio rj', 'rio de janeiro capital', 'rio capital'],
  'belo horizonte': ['belo horizonte', 'belo horizonte mg', 'belo horizonte-mg'],
  brasilia: ['brasilia', 'brasília', 'brasilia df', 'brasília df'],
  salvador: ['salvador', 'salvador ba', 'salvador-ba'],
  fortaleza: ['fortaleza', 'fortaleza ce', 'fortaleza-ce'],
  recife: ['recife', 'recife pe', 'recife-pe'],
  'porto alegre': ['porto alegre', 'porto alegre rs', 'porto alegre-rs'],
  curitiba: ['curitiba', 'curitiba pr', 'curitiba-pr'],
  manaus: ['manaus', 'manaus am', 'manaus-am'],
  belem: ['belem', 'belém', 'belem pa', 'belém pa'],
  goiania: ['goiania', 'goiânia', 'goiania go', 'goiânia go'],
  guarulhos: ['guarulhos', 'guarulhos sp', 'guarulhos-sp'],
  campinas: ['campinas', 'campinas sp', 'campinas-sp'],
  'sao luis': ['sao luis', 'são luís', 'sao luis ma'],
  maceio: ['maceio', 'maceió', 'maceio al'],
  natal: ['natal', 'natal rn'],
  'joao pessoa': ['joao pessoa', 'joão pessoa', 'joao pessoa pb'],
  florianopolis: ['florianopolis', 'florianópolis', 'florianopolis sc'],
  vitoria: ['vitoria', 'vitória', 'vitoria es'],
  santos: ['santos', 'santos sp'],
  'sao bernardo do campo': ['sao bernardo do campo', 'são bernardo do campo', 'sbc'],
  'santo andre': ['santo andre', 'santo andré', 'santo andre sp'],
  osasco: ['osasco', 'osasco sp'],
  'ribeirao preto': ['ribeirao preto', 'ribeirão preto', 'ribeirao preto sp'],
  sorocaba: ['sorocaba', 'sorocaba sp'],
  niteroi: ['niteroi', 'niterói', 'niteroi rj'],
  'duque de caxias': ['duque de caxias', 'duque de caxias rj'],
  'nova iguacu': ['nova iguacu', 'nova iguaçu', 'nova iguacu rj'],
  'sao goncalo': ['sao goncalo', 'são gonçalo', 'sao goncalo rj'],
  teresina: ['teresina', 'teresina pi'],
  'campo grande': ['campo grande', 'campo grande ms'],
  'jaboatao dos guararapes': ['jaboatao dos guararapes', 'jaboatão dos guararapes'],
  contagem: ['contagem', 'contagem mg'],
  joinville: ['joinville', 'joinville sc'],
  uberlandia: ['uberlandia', 'uberlândia', 'uberlandia mg'],
  aracaju: ['aracaju', 'aracaju se'],
  'feira de santana': ['feira de santana', 'feira de santana ba'],
  cuiaba: ['cuiaba', 'cuiabá', 'cuiaba mt'],
  'aparecida de goiania': ['aparecida de goiania', 'aparecida de goiânia'],
  londrina: ['londrina', 'londrina pr'],
  'juiz de fora': ['juiz de fora', 'juiz de fora mg'],
  serra: ['serra', 'serra es'],
  'campos dos goytacazes': ['campos dos goytacazes', 'campos rj'],
  'belford roxo': ['belford roxo', 'belford roxo rj'],
  'vila velha': ['vila velha', 'vila velha es'],
  ananindeua: ['ananindeua', 'ananindeua pa'],
  'sao jose dos campos': ['sao jose dos campos', 'são josé dos campos', 'sjc'],
  macapa: ['macapa', 'macapá'],
  'sao joao de meriti': ['sao joao de meriti', 'são joão de meriti'],
};

const VARIACOES_CANONICAS = Object.entries(CIDADES_GRANDES_ALIASES).flatMap(
  ([cidadeCanonica, variacoes]) =>
    variacoes.map((variacao) => ({
      cidadeCanonica,
      variacaoNormalizada: normalizarNomeCidade(variacao),
    }))
);

export function normalizarNomeCidade(cidade: string): string {
  return String(cidade || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + custo
      );
    }
  }
  return dp[m][n];
}

function formatarCidadeCanonica(cidadeCanonica: string): string {
  return cidadeCanonica
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

function identificarCidadeCanonica(nomeCidade: string): string | null {
  const cidadeNormalizada = normalizarNomeCidade(nomeCidade);
  if (!cidadeNormalizada) return null;

  const matchExato = VARIACOES_CANONICAS.find(
    (item) => item.variacaoNormalizada === cidadeNormalizada
  );
  if (matchExato) {
    return matchExato.cidadeCanonica;
  }

  const maxDistancia = cidadeNormalizada.length <= 6 ? 1 : 2;
  let melhor: { cidadeCanonica: string; distancia: number } | null = null;

  for (const item of VARIACOES_CANONICAS) {
    const diffTamanho = Math.abs(item.variacaoNormalizada.length - cidadeNormalizada.length);
    if (diffTamanho > maxDistancia) continue;
    const distancia = distanciaLevenshtein(cidadeNormalizada, item.variacaoNormalizada);
    if (distancia > maxDistancia) continue;
    if (!melhor || distancia < melhor.distancia) {
      melhor = { cidadeCanonica: item.cidadeCanonica, distancia };
      if (distancia === 0) break;
    }
  }

  return melhor?.cidadeCanonica || null;
}

export function ehCidadeGrande(nomeCidade: string): boolean {
  return identificarCidadeCanonica(nomeCidade) !== null;
}

export function identificarCidadesNaoReconhecidas(cidadesTexto: string): string[] {
  return String(cidadesTexto || '')
    .split(',')
    .map((cidade) => cidade.trim())
    .filter(Boolean)
    .filter((cidade) => !ehCidadeGrande(cidade));
}

export function normalizarCidadesParaExibicao(cidadesTexto: string): string {
  const cidades = String(cidadesTexto || '')
    .split(',')
    .map((cidade) => cidade.trim())
    .filter(Boolean);

  const corrigidas = cidades.map((cidadeOriginal) => {
    const canonica = identificarCidadeCanonica(cidadeOriginal);
    if (!canonica) return cidadeOriginal;
    return formatarCidadeCanonica(canonica);
  });

  return corrigidas.join(', ');
}
