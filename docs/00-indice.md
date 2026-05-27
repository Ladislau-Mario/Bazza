# DOCUMENTAÇÃO COMPLETA DO PROJETO BAZZA
## Explicação Linha por Linha de Cada Ficheiro

**Projeto:** Bazza — Plataforma de Entregas
**Autor:** Ladislau-Mário
**Data:** Maio 2026

---

## ÍNDICE

### Parte 1 — Entidades (Modelo de Dados)
1. `user.entity.ts` — Tabela de Utilizadores
2. `motoqueiro.entity.ts` — Tabela de Entregadores
3. `pedido.entity.ts` — Tabela de Pedidos/Encomendas
4. `upload.entity.ts` — Tabela de Documentos/Ficheiros
5. `notificacao.entity.ts` — Tabela de Notificações
6. `avaliacao.entity.ts` — Tabela de Avaliações
7. `carteira.entity.ts` — Tabela de Carteiras
8. `transacao.entity.ts` — Tabela de Transações
9. `veiculo.entity.ts` — Tabela de Veículos
10. `suporte.entity.ts` — Tabela de Tickets de Suporte
11. `mensagem-suporte.entity.ts` — Tabela de Mensagens de Suporte
12. `rota-salva.entity.ts` — Tabela de Rotas/Endereços Favoritos
13. `mensagem-chat.entity.ts` — Tabela de Mensagens de Chat
14. `preferencia.entity.ts` — Tabela de Preferências do Admin
15. `plano.entity.ts` — Tabela de Planos de Subscrição

### Parte 2 — Autenticação (Backend)
16. `firebase-auth.guard.ts` — Guarda de Autenticação Global
17. `roles.guard.ts` — Guarda de Permissões
18. `auth.service.ts` — Serviço de Autenticação
19. `auth.controller.ts` — Rotas de Autenticação
20. `firebase.module.ts` — Módulo Firebase

### Parte 3 — Serviços do Backend
21. `users.service.ts` — Serviço de Utilizadores
22. `motoqueiros.service.ts` — Serviço de Entregadores
23. `pedidos.service.ts` — Serviço de Pedidos
24. `uploads.service.ts` — Serviço de Upload de Ficheiros
25. `notificacao.service.ts` — Serviço de Notificações
26. `avaliacoes.service.ts` — Serviço de Avaliações
27. `carteira.service.ts` — Serviço de Carteiras
28. `suporte.service.ts` — Serviço de Suporte
29. `rotas.service.ts` — Serviço de Rotas
30. `admin.service.ts` — Serviço de Administração
31. `chat.gateway.ts` — Gateway Socket.io (Chat)

### Parte 4 — Controllers do Backend
32. `auth.controller.ts` — Rotas de Autenticação
33. `users.controller.ts` — Rotas de Utilizadores
34. `motoqueiros.controller.ts` — Rotas de Entregadores
35. `pedidos.controller.ts` — Rotas de Pedidos
36. `uploads.controller.ts` — Rotas de Upload
37. `notificacao.controller.ts` — Rotas de Notificações
38. `admin.controller.ts` — Rotas de Administração
39. `avaliacoes.controller.ts` — Rotas de Avaliações
40. `carteira.controller.ts` — Rotas de Carteiras
41. `suporte.controller.ts` — Rotas de Suporte
42. `chat.controller.ts` — Rotas de Chat
43. `rotas.controller.ts` — Rotas de Rotas
44. `preferencias.controller.ts` — Rotas de Preferências

### Parte 5 — App Module & Seeds
45. `app.module.ts` — Módulo Principal da Aplicação
46. `seed.service.ts` — Dados de Teste

### Parte 6 — Módulo Móvel (React Native)
47. `App.tsx` — Ponto de Entrada
48. `routes/index.routes.tsx` — Navegação Principal
49. `routes/deliver.routes.tsx` — Tabs do Entregador
50. `routes/bottom.routes.tsx` — Drawer do Cliente
51. `api/api.ts` — Configuração do Axios
52. `firebase-token.ts` — Token Firebase
53. `authService.ts` — Serviço de Autenticação Móvel
54. `uploadService.ts` — Serviço de Upload Móvel
55. `socket.ts` — Serviço Socket.io Móvel
56. `splash.tsx` — Tela Splash
57. `withNumber.tsx` — Login com Telefone
58. `verification.tsx` — Verificação OTP
59. `userMode.tsx` — Escolha de Papel
60. `useDelivery.ts` — Hook do Cliente
61. `useDeliverFlow.ts` — Hook do Entregador
62. `useChat.ts` — Hook do Chat
63. `useRealtimeNotifications.ts` — Hook de Notificações em Tempo Real
64. `documents/index.tsx` — Tela de Documentos
65. `plans/index.tsx` — Tela de Planos
66. `editProfileSheet.tsx` — Edição de Perfil

### Parte 7 — Módulo Admin (Next.js)
67. `dashboard/index.tsx` — Dashboard
68. `DashboardCard.tsx` — Card do Dashboard
69. `riders/viewMore/page.tsx` — Detalhes do Entregador
70. `notifications/index.tsx` — Lista de Notificações
71. `notifications/send/index.tsx` — Enviar Notificação
72. `earnings/index.tsx` — Receitas
73. `LoginContext.tsx` — Contexto de Login
74. `DashboardContext.tsx` — Contexto do Dashboard
75. `RidersContext.tsx` — Contexto de Entregadores
76. `EarningsContext.tsx` — Contexto de Receitas
77. `PreferencesContext.tsx` — Contexto de Preferências
78. `AuthImage.tsx` — Imagem com Autenticação
79. `Sidebar/index.tsx` — Barra Lateral
80. `api.ts` — Configuração do Axios Admin

### Parte 8 — Fluxos Completos
81. Fluxo de Registo de Utilizador
82. Fluxo de Entrega Completa
83. Fluxo de Documentos
84. Fluxo de Chat
85. Fluxo de Pagamentos

---

## NOTA SOBRE A ESTRUTURA

Cada secção contém:
- **Código original** com comentários explicativos
- **Explicação detalhada** de cada linha
- **Porquê** cada decisão foi tomada

Os ficheiros estão organizados por camada:
1. **Entidades** = modelo de dados (o que existe na BD)
2. **Serviços** = lógica de negócio (o que acontece quando...)
3. **Controllers** = rotas HTTP (os endpoints da API)
4. **Guards** = segurança (quem pode aceder ao quê)
5. **Módulo Móvel** = app do cliente e entregador
6. **Módulo Admin** = painel de gestão
