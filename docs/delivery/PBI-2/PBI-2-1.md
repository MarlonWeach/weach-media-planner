# Task 2-1: Implementar autenticação e autorização

## Status
✅ Done

## Descrição
Implementar sistema completo de autenticação e autorização com suporte a roles (ADMIN, COMERCIAL, EXTERNO), sessões e proteção de rotas.

## Critérios de Aceite
- [x] Sistema de login com email e senha
- [x] Hash de senha com bcrypt
- [x] Geração de tokens JWT ou sessões
- [x] Middleware de autenticação para rotas protegidas
- [x] Middleware de autorização por role
- [x] Proteção de rotas API
- [x] Proteção de rotas do frontend
- [x] Context/Provider para estado de autenticação
- [x] Logout funcional
- [ ] Recuperação de senha (opcional - deixado para futuro)

## Arquivos a Criar/Modificar
- `lib/auth/session.ts` (criar)
- `lib/auth/password.ts` (criar)
- `middleware.ts` (criar)
- `app/api/auth/login/route.ts` (criar)
- `app/api/auth/logout/route.ts` (criar)
- `app/api/auth/me/route.ts` (criar)
- `lib/contexts/AuthContext.tsx` (criar)
- `lib/utils/auth.ts` (modificar)

## Dependências
- PBI-1 (MVP Funcional)

## Estimativa
6 horas

## Referências
- `docs/11-arquitetura-tecnica.md` - Seção 3.6
- `prisma/schema.prisma` - Model wp_Usuario

## Notas Técnicas
- Usar NextAuth.js ou implementação custom com JWT
- Senhas devem ser hasheadas com bcrypt
- Tokens devem expirar após período determinado
- Middleware deve verificar autenticação em todas as rotas protegidas

