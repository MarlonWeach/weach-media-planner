/** Intervalo de datas em calendário Brasil (UTC−3, sem horário de verão). */

export function periodoMesAnteriorStrings(): { dataInicio: string; dataFim: string } {
  const agora = new Date();
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  let ano = br.getUTCFullYear();
  let mes = br.getUTCMonth();
  if (mes === 0) {
    mes = 11;
    ano -= 1;
  } else {
    mes -= 1;
  }
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const mm = String(mes + 1).padStart(2, '0');
  return {
    dataInicio: `${ano}-${mm}-01`,
    dataFim: `${ano}-${mm}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

/** Início do dia (00:00:00.000) — alinhado à listagem do dashboard. */
export function inicioDiaBr(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000`);
}

/** Fim do dia (23:59:59.999) — inclui o dia inteiro no filtro. */
export function fimDiaBr(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999`);
}
