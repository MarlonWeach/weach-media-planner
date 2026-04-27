# Rules — Development
Weach Pricing and Media Recommender

Estas são as regras de desenvolvimento e engenharia a serem seguidas ao longo do projeto.  
Elas garantem consistência, clareza, rastreabilidade e padronização do código.

============================================================
1. PRINCÍPIOS DE DESENVOLVIMENTO
============================================================

- Simplicidade antes de complexidade.
- Código limpo, curto e direto.
- Componentização sempre que possível.
- Nenhum valor de preço deve ficar hardcoded no frontend ou backend.
- Regras de precificação devem ficar no módulo determinístico.
- Cada feature deve ser entregue com testes manuais validados.
- Documentação mínima obrigatória por módulo.

============================================================
2. REGRAS DE CÓDIGO (BACKEND)
============================================================

- Todo o backend deve estar em TypeScript.
- APIs implementadas apenas com:
  - Next.js API Routes
  - Server Actions (quando fizer sentido)
- Nunca acessar o banco diretamente do frontend.
- Todo endpoint deve validar:
  - formatos de entrada
  - autenticação
  - permissões de role
- O motor determinístico deve ser:
  - puro
  - sem chamadas externas
  - sem dependências de IA
- Logs em tabelas específicas:
  - histórico de IA
  - logs de alterações de preço
  - logs de acesso do admin

============================================================
3. REGRAS DE CÓDIGO (FRONTEND)
============================================================

- Usar apenas componentes funcionais (React).
- Estilos via Tailwind.
- Evitar CSS customizado fora de casos específicos.
- Telas estruturadas em componentes pequenos.
- Todas as validações críticas devem ser repetidas no backend (não confiar no cliente).
- Wizard de cotação deve ser dividido em passos claros.

============================================================
4. PADRÃO DE PASTAS
============================================================

app/
  cotacao/
  admin/
  simulador/
  api/
lib/
  pricing/
  ia/
components/
  ui/
  cotacao/
prisma/
docs/

============================================================
5. REGRAS DE VERSIONAMENTO
============================================================

- Commits pequenos e descritivos.
- Sem commits genéricos tipo: “fix”, “teste”, “ajustes”.
- Branches:
  - main = estável
  - develop = próxima release
  - feature/* = desenvolvimento ativo
- Nunca commitar código sem revisão no Cursor.

============================================================
6. REGRAS DE SEGURANÇA
============================================================

- Nunca expor chaves API no código.
- Sempre usar variáveis ambiente.
- Regras de acesso por role:
  - admin pode tudo
  - comercial só edita cotação
  - usuário externo só simula
- Todo acesso sensível deve ser logado.

============================================================
7. REGRAS PARA PDF
============================================================

- PDF deve ser gerado no backend.
- Nada deve ser processado no cliente.
- Templates devem ser versionados.
- PDF final deve conter:
  - logomarca oficial
  - resumo executivo
  - tabela de mídia
  - estimativas
  - data e vendedor responsável

============================================================
8. TESTES E VALIDAÇÃO
============================================================

- Cada feature deve ter:
  - casos de teste manual
  - validação de fluxo completo no ambiente local
- Erros devem ser tratados:
  - com mensagens amigáveis
  - sem expor stack trace ao usuário

============================================================
9. PROIBIÇÕES
============================================================

- Código duplicado.
- Hardcode de qualquer preço.
- Chamadas diretas à IA sem registro em HistoricoIA.
- Processar lógica de preços no frontend.