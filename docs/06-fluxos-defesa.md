# FLUXOS COMPLETOS & PERGUNTAS DE DEFESA

---

## FLUXO 1: Registo de um Utilizador (Telefone)

```
1. App abre → SplashScreen (splash.tsx)
   └─ auth.onAuthStateChanged() → sem user → Onboarding

2. Tela Login (withNumber.tsx)
   └─ Utilizador digita: "912345678"
   └─ Valida: /^9\d{8}$/
   └─ POST /auth/telefone/enviar-otp
   └─ Backend (auth.service.ts):
      ├─ Limpa número: "912345678"
      ├─ Gera código: "1234" (dev) ou aleatório (prod)
      ├─ Guarda no Map: otpStore.set("912345678", { codigo: "1234", tentativas: 5, expiraEm: +10min })
      └─ Retorna: { message: "Código enviado", codigoTeste: "1234" }

3. Tela Verificação (verification.tsx)
   └─ Utilizador digita: "1234"
   └─ POST /auth/telefone/verificar-otp { telefone: "912345678", codigo: "1234" }
   └─ Backend:
      ├─ Verifica código no Map → OK
      ├─ findByPhone("912345678") → null (novo utilizador)
      ├─ criar({ firebaseUid: "phone_912345678_1716...", telefone: "912345678" })
      │  └─ Tabela users: INSERT (id=UUID, telefone="912345678", role="client", status="active")
      │  └─ Tabela carteiras: INSERT (userId=UUID, saldo=0)
      ├─ Sincroniza firebaseUid com user.id
      ├─ Firebase: createCustomToken(user.id) → "eyJhbGc..."
      └─ Retorna: { user, firebaseCustomToken: "eyJhbGc...", isNewUser: true }

4. App: firebase.auth().signInWithCustomToken("eyJhbGc...")
   └─ Firebase cria sessão → onAuthStateChanged dispara
   └─ Navega para: UserMode

5. Tela Escolha (userMode.tsx)
   └─ Utilizador clica "Cliente"
   └─ PATCH /auth/escolher-role { role: "cliente" }
   └─ Backend: usersService.atualizar(id, { role: "client" })
   └─ Navega para: ClientHome

6. NUNCA MAIS precisa de login (Firebase guarda sessão)
   └─ SplashScreen restaura automaticamente
```

**Pergunta típica:** "Como funciona a autenticação?"
**Resposta:** "O utilizador digita o telefone, o backend gera um código OTP e guarda em memória. O utilizador verifica o código, o backend cria um utilizador na BD e gera um Firebase custom token. O frontend faz signInWithCustomToken para obter um Firebase ID token JWT que é enviado em todos os pedidos HTTP via o header Authorization Bearer."

---

## FLUXO 2: Registo como Entregador

```
1. Tela Escolha → clica "Entregador"
   └─ PATCH /auth/escolher-role { role: "motoqueiro" }
   └─ Backend: se autoAprovacao=false → status="pending"

2. Tela Completar Perfil (4 etapas)
   └─ Dados pessoais: nome, sobrenome, BI
   └─ Dados da carta: numeroCartaConducao, validade
   └─ Veículo: modelo, matrícula, cor
   └─ POST /motoqueiros/completar-perfil
   └─ Backend:
      ├─ usersService.atualizar(id, { nome, sobrenome, numeroDocumento })
      ├─ motoqueirosService.criar({ userId, status: "pendente_aprovacao" })
      ├─ veiculoService.criar({ deliverId, modelo, matricula })
      └─ Retorna: { motoqueiro, veiculo }

3. Tela Documentos
   └─ 7 tipos: foto_perfil, bi_frente, bi_verso, carta_frente, carta_verso, foto_veiculo, foto_placa
   └─ POST /uploads/documento-bi-frente (multipart/form-data)
   └─ Backend: uploadsService.fazer() → INSERT na tabela uploads (ficheiro=longblob, status="pendente")

4. Tela PendingApproval
   └─ Mostra: "Aguarda aprovação do administrador"
   └─ App verifica periodicamente: GET /motoqueiros/meu-perfil
   └─ Quando status="activo" → DeliverHomeTab

5. Admin vê no painel:
   └─ GET /admin/motoqueiros/:id → { motoqueiro, uploads, todosDocumentosAprovados }
   └─ Admin aprova documentos: PATCH /admin/documentos/:id/aprovar
   └─ Admin aprova entregador: PATCH /admin/motoqueiros/:id/aprovar
      └─ Verifica: uploads aprovados >= 5
      └─ Atualiza: delivers.status = "activo", users.status = "active"
```

**Pergunta típica:** "Como os entregadores são aprovados?"
**Resposta:** "O entregador completa o perfil e envia 7 documentos. O admin vê os documentos no painel via AuthImage (que faz fetch autenticado). Cada documento é aprovado individualmente. Quando há pelo menos 5 documentos aprovados, o admin pode ativar o entregador, que passa de pendente_aprovacao para activo."

---

## FLUXO 3: Um Pedido Completo

```
1. Cliente abre app → Home (mapa com Google Maps)
   └─ Seleciona endereço de recolha (GPS ou manual)
   └─ Seleciona endereço de entrega (pesquisa ou toque no mapa)

2. App calcula distância
   └─ Google Directions API: getRoute(origem, destino)
   └─ Retorna: distância em km

3. Cliente preenche detalhes
   └─ Tipo: documento/comida/pacote/etc.
   └─ Peso: leve/normal/pesado
   └─ Observações: texto livre

4. App calcula preço
   └─ preco = max(distancia × 350, 500) + surcharge_peso
   └─ Surcharge: leve=0, normal=200, pesado=500
   └─ Ex: 2km, normal → max(700, 500) + 200 = 900 Kz

5. Confirmação
   └─ POST /pedidos { origemLat, origemLng, destinoLat, destinoLng, tipo, peso, distanciaKm }
   └─ Backend (pedidosService.criar()):
      ├─ Calcula preço final
      ├─ Gera numeroPedido: "BZ-1716543210000"
      ├─ Gera codigoNumerico: "482916" (6 dígitos)
      ├─ Gera codigoQr: "BIKO:BZ-1716543210000:482916"
      ├─ INSERT pedidos (status="a_procurar_motoqueiro")
      ├─ Socket: emite "pedido:novo" para todos os motoqueiros online
      └─ Notifica motoqueiros via FCM

6. Motoqueiro recebe pedido
   └─ Socket: "order:new" → vibra o telemóvel
   └─ Motoqueiro aceita: PATCH /pedidos/:id/aceitar
   └─ Backend: status = "a_caminho_recolha", motoqueiroId = deliver.id
   └─ Socket: "order:status_update" → cliente vê motoqueiro

7. Motoqueiro a caminho da recolha
   └─ Cliente vê motoqueiro no mapa (tracking GPS via socket)
   └─ Motoqueiro chega → PATCH /pedidos/:id/status { status: "recolhido" }

8. Motoqueiro entrega
   └─ PATCH /pedidos/:id/status { status: "entregando" }
   └─ Motoqueiro chega ao destino

9. Cliente confirma
   └─ Mostra código "482916" ao motoqueiro
   └─ Motoqueiro: PATCH /pedidos/:id/confirmar-entrega { codigo: "482916" }
   └─ Backend:
      ├─ Verifica codigoNumerico → OK
      ├─ status = "entregue"
      ├─ Creditar motoqueiro: valorEntrega × 0.85 (85%)
      └─ Notifica cliente: "Entrega concluída!"

10. Cliente avalia
    └─ POST /avaliacoes { pedidoId, nota: 5, comentario: "Ótimo serviço" }
    └─ Backend: recalcula classificaçãoMedia do motoqueiro
```

**Pergunta típica:** "Descreve o ciclo de vida de um pedido."
**Resposta:** "O cliente cria o pedido com origem e destino. O backend calcula o preço com a fórmula max(distância×350, 500) e gera um código numérico de confirmação. O pedido fica com status 'à procura de motoqueiro'. Os motoqueiros online recebem via socket. Quando um aceita, o status muda para 'a caminho da recolha'. Depois passa por 'recolhido', 'entregando' e finalmente 'entregue' quando o cliente confirma com o código. O motoqueiro recebe 85% do valor."

---

## FLUXO 4: Chat em Tempo Real

```
1. Socket connection (socket.ts)
   └─ io(SOCKET_URL, { auth: { token, userId } })
   └─ Backend: chat.gateway.ts handleConnection()
      └─ client.join(`user_${userId}`) — sala pessoal

2. Cliente abre chat de um pedido
   └─ Socket: emit("order:join", { pedidoId })
   └─ Backend: client.join(`pedido_${pedidoId}`)

3. Cliente envia mensagem
   └─ Socket: emit("chat:send", { pedidoId, texto })
   └─ Backend:
      ├─ INSERT mensagem_chat (pedidoId, remetenteId, texto)
      └─ server.to(`pedido_${pedidoId}`).emit("chat:received", mensagem)

4. Motoqueiro recebe
   └─ Socket: on("chat:received") → atualiza UI

5. Motoqueiro lê
   └─ Socket: emit("chat:read", { pedidoId, ids: [...] })
   └─ Backend: UPDATE mensagem_chat SET lida=true WHERE id IN (...)
```

---

## PERGUNTAS TÍPICAS DE DEFESA

### Arquitetura
| Pergunta | Resposta |
|----------|----------|
| Porquê NestJS? | Framework TypeScript modular com guards nativos, dependency injection, decorators — ideal para APIs REST organizadas |
| Porquê React Native? | Cross-platform (Android + iOS com um único código), Expo simplifica builds e hot reload |
| Porquê MySQL? | Relacional, fiável, TypeORM mapeia automaticamente classes para tabelas |
| Porquê Socket.io? | Comunicação bidirecional em tempo real (chat + tracking + notificações) |

### Segurança
| Pergunta | Resposta |
|----------|----------|
| Como garantes segurança? | 2 guards globais: FirebaseAuthGuard (verifica token JWT/Firebase) + RolesGuard (verifica permissões). Rotas públicas têm @Public() |
| O que acontece se o token expira? | Firebase tokens expiram em ~1h e renovam automaticamente. Admin JWT expira em 7 dias e precisa re-login |
| Como proteges contra acesso indevido? | RolesGuard verifica se o role do user (ex: admin) corresponde ao decorator @Roles('admin') na rota |

### Dados
| Pergunta | Resposta |
|----------|----------|
| Porque ficheiros na BD? | longblob no MySQL simplifica deploy. Para produção seria melhor S3/Cloudinary |
| O que é soft delete? | Em vez de apagar o registo (delete), marca deletadoEm com a data. Preserva dados para referência |
| Como funciona o pagamento? | 85% para o motoqueiro, 15% para a plataforma. Transações registadas na tabela transacoes |

### Fluxos
| Pergunta | Resposta |
|----------|----------|
| Como calculas o preço? | max(distância_km × 350, 500) + surcharge_peso. Mínimo 500 Kz |
| Como o cliente confirma entrega? | Código de 6 dígitos gerado no momento do pedido. Cliente mostra ao motoqueiro que envia via API |
| Como o admin aprova entregadores? | Precisa de ≥5 documentos aprovados. Admin vê via AuthImage (fetch autenticado), aprova cada um |
| Como funciona o chat? | Socket.io com namespace /chat. Utilizadores entram em salas pedido_{id}. Mensagens persistidas na BD |

---

## DIAGRAMA DA ARQUITETURA

```
┌──────────────────────────────────────────────────────────────┐
│                        UTILIZADORES                          │
├──────────────────────┬───────────────────────────────────────┤
│  App Móvel (Expo)    │  Painel Admin (Next.js)              │
│  React Native        │  Chakra UI                           │
│                      │                                       │
│  ├─ Cliente          │  ├─ Dashboard (gráficos)              │
│  │  ├─ Criar pedido  │  ├─ Entregadores (aprovar)            │
│  │  ├─ Chat          │  ├─ Pedidos (listar/filtrar)          │
│  │  ├─ Avaliar       │  ├─ Notificações (enviar)             │
│  │  └─ Perfil        │  ├─ Suporte (responder)               │
│  │                   │  ├─ Receitas (subscrições)            │
│  └─ Entregador       │  └─ Preferências (config)             │
│     ├─ Ver pedidos   │                                       │
│     ├─ Aceitar       │  Token: baza_admin_token (JWT)        │
│     ├─ Documentos    │                                       │
│     ├─ Planos        │                                       │
│     └─ Perfil        │                                       │
│                      │                                       │
│  Token: Firebase ID  │                                       │
└──────────┬───────────┴────────────────┬──────────────────────┘
           │                            │
           │    HTTP REST + Socket.io    │
           │    Authorization: Bearer    │
           └─────────────┬──────────────┘
                         │
              ┌──────────▼──────────┐
              │      NESTJS          │
              │      BACKEND         │
              │                      │
              │  Guards:             │
              │  ├─ FirebaseAuthGate  │
              │  └─ RolesGuard       │
              │                      │
              │  Módulos (16):       │
              │  ├─ Auth (OTP/JWT)   │
              │  ├─ Users            │
              │  ├─ Motoqueiros      │
              │  ├─ Pedidos          │
              │  ├─ Uploads          │
              │  ├─ Chat (Socket.io) │
              │  ├─ Notificações     │
              │  ├─ Carteira         │
              │  ├─ Avaliações       │
              │  ├─ Suporte          │
              │  ├─ Rotas            │
              │  ├─ Admin            │
              │  ├─ Firebase         │
              │  └─ ...              │
              │                      │
              │  Firebase Admin SDK  │
              │  ├─ Auth (verify)    │
              │  └─ Cloud Messaging  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │       MYSQL          │
              │                      │
              │  17 tabelas:         │
              │  users, delivers,    │
              │  pedidos, uploads,   │
              │  notificacoes,       │
              │  avaliacoes,         │
              │  carteiras,          │
              │  transacoes,         │
              │  mensagens_chat,     │
              │  suportes,           │
              │  rotas_salvas,       │
              │  ...                 │
              └──────────────────────┘
```
