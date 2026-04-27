# Estrutura de Delivery - Weach Pricing & Media Recommender

Este diretório contém toda a estrutura de Product Backlog Items (PBIs) e Tasks organizadas conforme o roadmap do projeto.

## Estrutura

```
docs/delivery/
├── backlog.md              # Product backlog principal
├── PBI-0/                  # Fase 0 - Preparação (✅ Concluído)
│   ├── prd.md
│   └── tasks.md
├── PBI-1/                  # Fase 1 - MVP Funcional (🔄 Em andamento)
│   ├── prd.md
│   ├── tasks.md
│   └── PBI-1-[TASK-ID].md  # Tasks individuais
├── PBI-2/                  # Fase 2 - Admin e Regras
├── PBI-3/                  # Fase 3 - Relatórios
├── PBI-4/                  # Fase 4 - Simulador Público
└── ...
```

## Convenções

### Formato de Task ID
- Formato: `[PBI-ID]-[TASK-ID]`
- Exemplo: `1-2` = Task 2 do PBI-1

### Status de Tasks
- 📌 **Pendente** - Aguardando início
- 🔄 **InProgress** - Em desenvolvimento
- ✅ **Done** - Concluído
- ⏸️ **Paused** - Pausado
- ❌ **Rejected** - Rejeitado

### Prioridades
- 🚨 **Crítica** - Bloqueador para outras tasks
- ⚠️ **Alta** - Importante para o produto
- 📌 **Média** - Melhoria significativa
- 📎 **Baixa** - Nice to have

## Como Usar

1. **Verificar backlog**: Consulte `backlog.md` para ver o status geral
2. **Selecionar PBI**: Escolha um PBI do backlog
3. **Ver tasks**: Consulte `tasks.md` do PBI selecionado
4. **Ler task específica**: Abra o arquivo `PBI-[ID]-[TASK-ID].md`
5. **Iniciar trabalho**: Siga os critérios de aceite e dependências

## Regras de Desenvolvimento

- **SEMPRE** verificar task ID antes de fazer alterações
- **SEMPRE** atualizar status da task ao iniciar/concluir
- **SEMPRE** seguir critérios de aceite
- **SEMPRE** verificar dependências antes de começar
- **NUNCA** modificar código sem task ID associada

## Ordem Recomendada de Execução

### Fase 1 (MVP) - Ordem Crítica
1. Task 1-1: Endpoint GET cotação
2. Task 1-2: Wizard Passo 1
3. Task 1-3: Wizard Passo 2
4. Task 1-4: Wizard Passo 3
5. Task 1-6: Tabela de preços
6. Task 1-7: Validações
7. Task 1-5: Wizard Passo 4 (depende de 1-6 e 1-7)
8. Task 1-9: Geração de PDF
9. Task 1-8: Dashboard
10. Tasks 1-10, 1-11, 1-12: Melhorias

## Atualizações

Ao concluir uma task:
1. Marcar como ✅ Done no arquivo da task
2. Atualizar status no `tasks.md` do PBI
3. Atualizar status no `backlog.md` se necessário
4. Documentar qualquer decisão técnica importante

