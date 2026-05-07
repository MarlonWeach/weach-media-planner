# Task 9-6: Trocar upload de arquivo por campo de URL de Drive com validação e instrução ao usuário

## Status
✅ Done

## Descrição
Simplificar o fluxo de anexo para usuários leigos, permitindo upload automático via sistema para uma pasta central no Google Drive, com preenchimento automático do link no formulário da cotação.

## Objetivo
Evitar dependência de permissões manuais de compartilhamento do usuário final e garantir acesso imediato ao anexo pela operação.

## Critérios de Aceite
- [x] O formulário de cotação permite informar link de Drive manualmente.
- [x] O formulário possui opção de upload de arquivo com envio automático ao Drive.
- [x] Após upload, o link do arquivo é preenchido automaticamente no campo da cotação.
- [x] O link é persistido no payload da cotação e pode ser enviado ao Google Sheets (coluna `Z`).

## Implementação
- Atualizado `components/cotacao/WizardStep1.tsx`:
  - novo campo `anexoDriveLink` com validação de URL;
  - botão de upload de arquivo para envio automático ao Drive;
  - feedback de erro e estado de envio no front.
- Criada rota `POST /api/integrations/drive/upload` em `app/api/integrations/drive/upload/route.ts`:
  - autenticação obrigatória por token do usuário;
  - upload para pasta central do Drive via Service Account;
  - opção de link público de leitura (`anyone`) controlada por env;
  - retorno do link para preenchimento automático no formulário.
- Atualizado `components/cotacao/WizardStep4.tsx` para persistir `solicitacao.anexoDriveLink` em `observacoes`.

## Variáveis de Ambiente
- `GOOGLE_DRIVE_FOLDER_ID` (obrigatória)
- `GOOGLE_DRIVE_PUBLIC_LINK_ENABLED` (opcional, padrão `true`)

## Observações
- Limite de upload implementado: 20MB por arquivo.
- O nome do arquivo no Drive recebe prefixo de timestamp para reduzir colisão.
