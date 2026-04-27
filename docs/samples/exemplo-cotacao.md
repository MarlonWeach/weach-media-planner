# Sample — Request de Cotação (JSON enviado pelo frontend)

Este é um exemplo de corpo enviado pelo frontend para o endpoint:
POST /api/cotacao/criar

Serve como referência para devs e testes.

============================================================
1. REQUEST DE EXEMPLO
============================================================

{
  "cliente": "Concessionária Alfa Motors",
  "segmento": "automotivo",
  "objetivo": "leads",
  "budget_total": 45000,
  "regiao": "SP_Capital",
  "periodo": {
    "inicio": "2025-02-01",
    "fim": "2025-02-28"
  },
  "maturidade_digital": "media",
  "tolerancia_risco": "baixa",
  "preferencias_cliente": {
    "evitar_canais": ["in_live"],
    "preferir_canais": ["social_programatico"]
  },
  "inventarios_disponiveis": [
    "display_programatico",
    "video_programatico",
    "ctv",
    "audio_digital",
    "social_programatico",
    "cpl_cpi",
    "crm_media"
  ],
  "usuario_responsavel": "marlon.nogueira"
}

============================================================
2. ITENS IMPORTANTES
============================================================

- `inventarios_disponiveis` sempre deve ser enviado pelo backend (não pelo cliente).
- Campo `preferencias_cliente` é opcional.
- Campo `tolerancia_risco` afeta a recomendação da IA.
- Segmento e objetivo são obrigatórios.