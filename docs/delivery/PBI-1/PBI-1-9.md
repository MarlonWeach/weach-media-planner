# Task 1-9: Implementar geração de PDF com branding Weach

## Status
✅ Done

## Descrição
Criar funcionalidade de geração de PDF comercial com identidade visual Weach, incluindo resumo executivo, plano de mídia, estimativas e dados do vendedor.

## Critérios de Aceite
- [x] PDF gerado com PDFKit ou @react-pdf
- [x] Logo Weach no cabeçalho (estrutura pronta, logo pode ser adicionado depois)
- [x] Resumo executivo gerado pela IA
- [x] Tabela de plano de mídia completa
- [x] Estimativas (impressões, cliques, leads)
- [x] Dados do vendedor no rodapé
- [x] Data de geração
- [x] Design profissional e legível
- [x] Cores conforme identidade visual (#2E5FF2, #1B2F59)
- [x] PDF salvo no servidor e URL retornada

## Arquivos a Criar/Modificar
- `lib/pdf/geradorPDF.ts` (criar)
- `app/api/cotacao/[id]/pdf/route.ts` (criar)
- `public/logo-weach.png` (adicionar logo)

## Dependências
- Task 1-5 (Wizard completo)
- Task 1-1 (Endpoint GET cotação)

## Estimativa
8 horas

## Referências
- `docs/08-fluxos-de-usuario.md` - Seção 1, passo 10
- `docs/samples/exemplo-pdf.md`
- `docs/prompts/prompt-exportacao-pdf.md`

## Notas Técnicas
- Usar PDFKit para geração server-side
- Template deve ser reutilizável
- Salvar PDFs em storage (S3, Supabase Storage, ou filesystem)
- Retornar URL do PDF para download

