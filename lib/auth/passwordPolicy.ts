/**
 * Política mínima de senha (servidor e UI).
 */
export const SENHA_MIN_CARACTERES = 8;

export function mensagemSenhaMinima(): string {
  return `Senha deve ter pelo menos ${SENHA_MIN_CARACTERES} caracteres`;
}
