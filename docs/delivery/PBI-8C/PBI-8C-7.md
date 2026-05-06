# Task 8C-7: Rotacionar segredos sensíveis no fechamento do projeto

## Status
📌 Pendente

## Descrição
Executar rotação completa de segredos sensíveis do projeto como etapa final de hardening, imediatamente antes do encerramento definitivo do projeto.

## Objetivo
Reduzir risco de segurança no go-live final, invalidando credenciais antigas e consolidando apenas chaves ativas e controladas.

## Regra de Execução
- Esta task deve ser executada **somente como última task do projeto inteiro**.
- Não antecipar durante desenvolvimento ativo, exceto em incidente crítico.

## Escopo de Rotação
- `DATABASE_URL` (pooler/runtime)
- `DIRECT_URL` (conexão direta/migrate)
- `OPENAI_API_KEY`
- `SMTP_PASS` / token SMTP
- `JWT_SECRET`

## Ambientes Alvo
- Ambiente local (`.env`)
- Vercel (Production / Preview / Development)
- GitHub Secrets (apenas se workflows utilizarem os segredos)

## Checklist de Execução
- [ ] Gerar novos segredos em cada provedor.
- [ ] Atualizar variáveis em todos os ambientes alvo.
- [ ] Reiniciar/redeploy serviços para aplicar novos valores.
- [ ] Validar login, consulta de cotações e envio de e-mail após rotação.
- [ ] Invalidar/remover segredos antigos.
- [ ] Registrar conclusão no delivery e evidências básicas de validação.

## Critérios de Aceite
- [ ] Todos os segredos listados rotacionados.
- [ ] Serviços funcionando com credenciais novas.
- [ ] Nenhuma credencial antiga ativa.

