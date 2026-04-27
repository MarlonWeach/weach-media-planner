# Task 2-2: Criar tela de login

## Status
✅ Done

## Descrição
Criar página de login com formulário de email e senha, integrada com o sistema de autenticação JWT.

## Critérios de Aceite
- [x] Página de login acessível em `/login`
- [x] Formulário com campos email e senha
- [x] Validação de campos (email válido, senha obrigatória)
- [x] Integração com API `/api/auth/login`
- [x] Exibição de erros de autenticação
- [x] Redirecionamento após login bem-sucedido
- [x] Suporte a redirecionamento após login (query param `redirect`)
- [x] Design moderno e responsivo
- [x] Loading state durante autenticação
- [x] Usuários autenticados são redirecionados automaticamente

## Arquivos a Criar/Modificar
- `app/login/page.tsx` (criar)
- `components/auth/LoginForm.tsx` (criar - opcional, se quiser componente separado)

## Dependências
- Task 2-1 (Autenticação e autorização)

## Estimativa
3 horas

## Referências
- `docs/09-ui-ux-wireframes.md`
- `lib/contexts/AuthContext.tsx`

## Notas Técnicas
- Usar React Hook Form para formulário
- Usar Zod para validação
- Integrar com AuthContext para gerenciar estado
- Redirecionar para `/dashboard` por padrão ou para `redirect` query param

