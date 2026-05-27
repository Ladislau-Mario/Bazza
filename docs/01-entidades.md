# ENTIDADES — Modelo de Dados (Linha por Linha)

As entidades são classes TypeScript que o TypeORM converte automaticamente em tabelas MySQL.
Cada propriedade com `@Column` vira uma coluna na tabela. Cada `@ManyToOne`/`@OneToMany` vira uma foreign key.

---

## 1. user.entity.ts — Tabela `users`

Guarda TODOS os utilizadores: clientes, entregadores e administradores.

```typescript
// ═══════════════════════════════════════════════════════════════
// IMPORTS DO TYPEORM
// ═══════════════════════════════════════════════════════════════
import {
  Entity,              // Marca esta classe como uma tabela na BD
  Column,              // Marca como uma coluna na tabela
  PrimaryGeneratedColumn, // Chave primária auto-gerada
  CreateDateColumn,    // Coluna preenchida automaticamente na criação
  UpdateDateColumn,    // Coluna atualizada automaticamente em cada UPDATE
  OneToOne,            // Relação 1:1 (um user tem um deliver)
  OneToMany,           // Relação 1:N (um user tem muitos pedidos)
  DeleteDateColumn,    // Soft delete — marca a data em vez de apagar
} from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// ENUMS — Valores fixos que uma coluna pode ter
// ═══════════════════════════════════════════════════════════════

// Papel do utilizador no sistema
export enum UserRole {
  CLIENT = 'client',    // Cliente — faz pedidos de entrega
  DELIVER = 'deliver',  // Entregador — aceita e realiza entregas
  ADMIN = 'admin',      // Administrador — gere o sistema pelo painel web
}

// Estado da conta do utilizador
export enum UserStatus {
  ACTIVE = 'active',       // Conta ativa e funcional
  PENDING = 'pending',     // Novo utilizador, ainda não completou o registo
  SUSPENDED = 'suspended', // Conta bloqueada pelo administrador
  ELIMINADO = 'eliminado', // Conta eliminada (soft delete — dados preservados na BD)
}

// ═══════════════════════════════════════════════════════════════
// A ENTIDADE USER
// ═══════════════════════════════════════════════════════════════

// @Entity('users') → Diz ao TypeORM: "cria uma tabela chamada 'users'"
@Entity('users')
export class User {

  // @PrimaryGeneratedColumn('uuid') → Chave primária gerada como UUID
  // UUID = Universally Unique Identifier, ex: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  // É gerado automaticamente pelo TypeORM quando se cria um novo registo
  @PrimaryGeneratedColumn('uuid') id: string;

  // unique: true → Cria um índice único no MySQL (não pode haver dois users com o mesmo firebaseUid)
  // nullable: true → A coluna aceita NULL (ex: admin que nunca usou a app móvel)
  @Column({ unique: true, nullable: true }) firebaseUid: string;

  // Telefone do utilizador no formato angolano: 9XXXXXXXX
  // unique → Não pode haver dois users com o mesmo telefone
  @Column({ unique: true, nullable: true }) telefone: string;

  // default: false → Quando se cria um user, começa como false
  // Só fica true depois de verificar o código OTP
  @Column({ default: false }) telefoneVerificado: boolean;

  // Primeiro nome do utilizador
  // nullable → Pode ser NULL (ex: user recém-criado pelo OTP que ainda não completou perfil)
  @Column({ nullable: true }) nome: string;

  // Apelido / sobrenome
  @Column({ nullable: true }) sobrenome: string;

  // Email do utilizador
  // unique → Se existir, deve ser único na BD
  @Column({ unique: true, nullable: true }) email: string;

  // type: 'date' → Armazena só a data (YYYY-MM-DD), sem hora
  // Usado para calcular idade, validar documentos, etc.
  @Column({ nullable: true, type: 'date' }) dataNascimento: Date;

  // Número do bilhete de identidade ou outro documento
  @Column({ nullable: true }) numeroDocumento: string;

  // Tipo de documento (BI, Passaporte, etc.)
  // default: 'BI' → Bilhete de Identidade
  @Column({ default: 'BI', nullable: true }) tipoDocumento: string;

  // type: 'longblob' → Armazena dados binários diretamente na BD
  // Pode ter até 4GB. Usado para a foto de perfil em formato binário
  // Buffer = tipo do Node.js para dados binários
  @Column({ nullable: true, type: 'longblob' }) fotoPerfil: Buffer;

  // URL externa da foto (ex: foto do perfil do Google)
  // Diferente de fotoPerfil que armazena o binário na BD
  @Column({ nullable: true }) fotoPerfilUrl: string;

  // type: 'enum' → O MySQL cria uma coluna ENUM com os valores: 'client', 'deliver', 'admin'
  // default: UserRole.CLIENT → Novos utilizadores começam como cliente
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT }) role: UserRole;

  // Estado da conta
  // default: ACTIVE → Por defeito a conta está ativa
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE }) status: UserStatus;

  // Firebase Cloud Messaging token
  // Gerado pelo Firebase no telemóvel do utilizador
  // Usado para enviar push notifications para o dispositivo
  @Column({ nullable: true }) fcmToken: string;

  // Nome do plano de subscrição ativo: 'diario', 'semanal', 'mensal'
  // Só relevante para entregadores
  @Column({ nullable: true }) planoAtivo: string;

  // type: 'timestamp' → Data + hora (YYYY-MM-DD HH:MM:SS)
  // Quando o plano expira
  @Column({ nullable: true, type: 'timestamp' }) planoExpiraEm: Date;

  // @CreateDateColumn → Preenchido automaticamente pelo TypeORM quando o registo é criado
  // Não precisa passar valor — é gerado pelo MySQL
  @CreateDateColumn() criadoEm: Date;

  // @UpdateDateColumn → Atualizado automaticamente pelo TypeORM a cada UPDATE
  @UpdateDateColumn() atualizadoEm: Date;

  // @DeleteDateColumn → Soft delete
  // Quando se chama repo.softDelete(id), esta coluna recebe a data/hora atual
  // O registo continua na BD mas as queries normais (find, findOne) ignoram-no
  // Diferente de hard delete (repo.delete) que remove permanentemente
  @DeleteDateColumn({ nullable: true }) deletadoEm: Date;

  // ═══════════════════════════════════════════════════════════════
  // RELAÇÕES — Como as tabelas se ligam entre si
  // ═══════════════════════════════════════════════════════════════

  // OneToOne → Cada User tem NO MÁXIMO UM Deliver
  // 'Deliver' → Nome da classe da entidade relacionada
  // (d: any) => d.user → Função que retorna o campo inverso no Deliver
  // nullable: true → Nem todo utilizador é entregador
  @OneToOne('Deliver', (d: any) => d.user, { nullable: true }) deliver: any;

  // OneToMany → Um User pode ter MUITOS Pedidos como cliente
  // 'Pedido' → Entidade relacionada
  // (p: any) => p.cliente → Campo no Pedido que aponta para este User
  @OneToMany('Pedido', (p: any) => p.cliente) pedidosCliente: any[];

  // Um User (entregador) pode ter MUITOS Pedidos como motoqueiro
  @OneToMany('Pedido', (p: any) => p.motoqueiro) pedidosMotoqueiro: any[];

  // OneToOne → Cada User tem UMA Carteira (saldo de dinheiro)
  // nullable: true → Pode não ter carteira ainda
  @OneToOne('Carteira', (c: any) => c.user, { nullable: true }) carteira: any;

  // OneToMany → Um User pode ter MUITAS Notificações
  @OneToMany('Notificacao', (n: any) => n.user) notificacoes: any[];
}
```

### Resumo da tabela `users`:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| firebaseUid | string | ID do Firebase (único) |
| telefone | string | Número de telefone (único) |
| telefoneVerificado | boolean | Se o OTP foi verificado |
| nome | string | Primeiro nome |
| sobrenome | string | Apelido |
| email | string | Email (único) |
| dataNascimento | date | Data de nascimento |
| numeroDocumento | string | Nº do BI/Passaporte |
| tipoDocumento | string | Tipo de documento |
| fotoPerfil | longblob | Foto em binário |
| fotoPerfilUrl | string | URL da foto (Google) |
| role | enum | client/deliver/admin |
| status | enum | active/pending/suspended/eliminado |
| fcmToken | string | Token para push notifications |
| planoAtivo | string | Nome do plano ativo |
| planoExpiraEm | timestamp | Expiração do plano |
| criadoEm | timestamp | Data de criação |
| atualizadoEm | timestamp | Última atualização |
| deletadoEm | timestamp | Soft delete |

---

## 2. motoqueiro.entity.ts — Tabela `delivers`

Guarda os dados específicos dos entregadores (motoqueiros).
Um entregador é um User com role=deliver + um registo nesta tabela.

```typescript
import {
  Entity, Column, PrimaryGeneratedColumn, OneToOne,
  OneToMany, JoinColumn, CreateDateColumn,
} from 'typeorm';

// Estado do entregador no sistema (aprovação pelo admin)
export enum DeliverStatus {
  PENDENTE = 'pendente_aprovacao', // Aguardando aprovação do admin
  ACTIVO = 'activo',               // Aprovado e pode aceitar pedidos
  SUSPENSO = 'suspenso',           // Bloqueado pelo admin
}

// Disponibilidade atual (controlo pelo próprio entregador)
export enum DeliverDisponibilidade {
  ONLINE = 'online',   // Disponível para aceitar pedidos
  OFFLINE = 'offline', // Não disponível (desligado)
  OCUPADO = 'ocupado', // A realizar uma entrega
}

// @Entity('delivers') → Tabela chamada 'delivers' no MySQL
@Entity('delivers')
export class Deliver {

  @PrimaryGeneratedColumn('uuid') id: string;

  // Chave estrangeira para o User
  // unique: true → Cada User só pode ter UM Deliver (relação 1:1)
  @Column({ unique: true }) userId: string;

  // @OneToOne → Relação 1:1 com User
  // @JoinColumn → Diz ao TypeORM que a coluna 'userId' é a foreign key
  @OneToOne('User', (u: any) => u.deliver)
  @JoinColumn({ name: 'userId' })
  user: any;

  // Número da carta de condução
  @Column({ nullable: true }) numeroCartaConducao: string;

  // type: 'date' → Só a data, sem hora
  // Quando a carta de condução expira
  @Column({ type: 'date', nullable: true }) validadeCartaConducao: Date;

  // Morada/residência do entregador
  @Column({ nullable: true }) morada: string;

  // type: 'decimal' → Número decimal no MySQL
  // precision: 10, scale: 8 → Até 10 dígitos total, 8 casas decimais
  // Ex: -8.83745000 (latitude de Luanda)
  @Column('decimal', { precision: 10, scale: 8, nullable: true }) latitudeAtual: number;

  // Longitude atual do entregador (atualizada via GPS)
  @Column('decimal', { precision: 10, scale: 8, nullable: true }) longitudeAtual: number;

  // Quando a localização foi atualizada pela última vez
  @Column({ type: 'timestamp', nullable: true }) localizacaoAtualizadaEm: Date;

  // Se o entregador está online, offline ou ocupado
  // default: OFFLINE → Começa desligado
  @Column({ type: 'enum', enum: DeliverDisponibilidade, default: DeliverDisponibilidade.OFFLINE })
  statusDisponibilidade: DeliverDisponibilidade;

  // Se o entregador foi aprovado pelo admin
  // default: PENDENTE → Começa como pendente de aprovação
  @Column({ type: 'enum', enum: DeliverStatus, default: DeliverStatus.PENDENTE })
  status: DeliverStatus;

  // precision: 3, scale: 2 → Formato: X.XX (ex: 4.75)
  // Média das avaliações dos clientes
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  classificacaoMedia: number;

  // Quantas avaliações recebeu
  @Column({ default: 0 }) totalAvaliacoes: number;

  // Quando foi aprovado pelo admin
  @Column({ nullable: true, type: 'timestamp' }) aprovadoEm: Date;

  // Motivo da rejeição (se o admin rejeitou)
  @Column({ nullable: true }) motivoRejeicao: string;

  @CreateDateColumn() criadoEm: Date;

  // OneToMany → Um Deliver pode ter MUITOS Veículos
  // { eager: true } → Quando se busca um Deliver, os Veículos vêm automaticamente
  // Sem eager, teria que usar relations: ['veiculos'] na query
  @OneToMany('Veiculo', (v: any) => v.deliver, { eager: true }) veiculos: any[];

  // Documentos enviados pelo entregador (BI, carta, etc.)
  @OneToMany('Documento', (d: any) => d.deliver) documentos: any[];
}

// Alias para compatibilidade
// Alguns ficheiros antigos usam "Motoqueiro" em vez de "Deliver"
export { Deliver as Motoqueiro };
```

### Resumo da tabela `delivers`:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| userId | UUID (FK) | Ligação ao User |
| numeroCartaConducao | string | Nº da carta de condução |
| validadeCartaConducao | date | Validade da carta |
| morada | string | Morada do entregador |
| latitudeAtual | decimal | Latitude GPS |
| longitudeAtual | decimal | Longitude GPS |
| localizacaoAtualizadaEm | timestamp | Último update GPS |
| statusDisponibilidade | enum | online/offline/ocupado |
| status | enum | pendente/activo/suspenso |
| classificacaoMedia | decimal | Média de avaliações |
| totalAvaliacoes | int | Total de avaliações |
| aprovadoEm | timestamp | Data de aprovação |
| motivoRejeicao | string | Motivo se rejeitado |

---

## 3. pedido.entity.ts — Tabela `pedidos`

Guarda todos os pedidos/encomendas feitos pelos clientes.

```typescript
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

// Ciclo de vida de um pedido (8 estados possíveis)
export enum StatusPedido {
  A_PROCURAR_MOTOQUEIRO = 'a_procurar_motoqueiro', // Pedido criado, à procura de entregador
  MOTOQUEIRO_ATRIBUIDO  = 'motoqueiro_atribuido',  // Entregador atribuído (usado internamente)
  A_CAMINHO_RECOLHA     = 'a_caminho_recolha',      // Entregador a caminho do local de recolha
  EM_PAUSA              = 'em_pausa',               // Entregador pausou a entrega
  RECOLHIDO             = 'recolhido',              // Entregador recolheu a encomenda
  ENTREGANDO            = 'entregando',             // Entregador a caminho do destino
  ENTREGUE              = 'entregue',               // Entrega concluída
  CANCELADO             = 'cancelado',              // Pedido cancelado
}

// Formas de pagamento disponíveis
export enum TipoPagamento {
  NUMERARIO   = 'numerario', // Dinheiro (cash)
  CARTEIRA    = 'carteira',  // Saldo da carteira digital
  STRIPE      = 'stripe',    // Pagamento online via Stripe
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid') id: string;

  // Número do pedido gerado pelo sistema (ex: "BZ-1716543210000")
  @Column() numeroPedido: string;

  // Chave estrangeira para o User que fez o pedido
  @Column() clienteId: string;

  // Chave estrangeira para o Deliver que aceitou o pedido
  // nullable porque quando o pedido é criado, ainda não tem motoqueiro
  @Column({ nullable: true }) motoqueiroId: string;

  // ═══════════════════════════════════════════════════════════════
  // LOCALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════

  // precision: 10, scale: 8 → Formato: -XX.XXXXXXXX
  // Ex: -8.83745000 (coordenadas de Luanda)
  @Column('decimal', { precision: 10, scale: 8 }) origemLatitude: number;
  @Column('decimal', { precision: 10, scale: 8 }) origemLongitude: number;
  @Column() origemEndereco: string;           // Endereço de recolha (texto)
  @Column({ nullable: true }) origemInstrucoes: string; // Instruções especiais para recolha

  @Column('decimal', { precision: 10, scale: 8 }) destinoLatitude: number;
  @Column('decimal', { precision: 10, scale: 8 }) destinoLongitude: number;
  @Column() destinoEndereco: string;           // Endereço de entrega
  @Column({ nullable: true }) destinoInstrucoes: string; // Instruções para entrega

  // ═══════════════════════════════════════════════════════════════
  // ENCOMENDA
  // ═══════════════════════════════════════════════════════════════

  // precision: 10, scale: 2 → Formato: XXXXXXXX.XX km
  @Column('decimal', { precision: 10, scale: 2 }) distanciaKm: number;

  // Tipo de encomenda: documento, comida, pacote, etc.
  @Column({ default: 'documento' }) tipo: string;

  // Descrição do que está a ser enviado
  @Column({ nullable: true }) descricaoEncomenda: string;

  // Se é frágil (afeta o cuidado na entrega)
  @Column({ default: false }) fragil: boolean;

  // ═══════════════════════════════════════════════════════════════
  // PREÇO E PAGAMENTO
  // ═══════════════════════════════════════════════════════════════

  // Valor da entrega em Kz (Kwanza angolano)
  // Calculado pela fórmula: max(distancia × 350, 500) + surcharge_peso
  @Column('decimal', { precision: 10, scale: 2 }) valorEntrega: number;

  // Forma de pagamento (numerario/carteira/stripe)
  @Column({ type: 'enum', enum: TipoPagamento, default: TipoPagamento.NUMERARIO })
  tipoPagamento: TipoPagamento;

  // ═══════════════════════════════════════════════════════════════
  // QR / CÓDIGO DE CONFIRMAÇÃO
  // ═══════════════════════════════════════════════════════════════

  // Código QR no formato "BIKO:BZ-xxxxx:123456"
  // O entregador lê para confirmar a entrega
  @Column({ nullable: true }) codigoQr: string;

  // Código numérico de 6 dígitos
  // O cliente mostra ao entregador para confirmar
  @Column({ nullable: true }) codigoNumerico: string;

  // Se o código foi confirmado (entrega validada)
  @Column({ default: false }) codigoConfirmado: boolean;

  // Quando foi confirmado
  @Column({ nullable: true, type: 'timestamp' }) codigoConfirmadoEm: Date;

  // ═══════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════

  // Estado atual do pedido
  @Column({ type: 'enum', enum: StatusPedido, default: StatusPedido.A_PROCURAR_MOTOQUEIRO })
  status: StatusPedido;

  // ═══════════════════════════════════════════════════════════════
  // TIMESTAMPS DE TRANSIÇÃO (registam quando cada estado mudou)
  // ═══════════════════════════════════════════════════════════════

  @Column({ nullable: true, type: 'timestamp' }) atribuidoEm: Date;   // Quando um motoqueiro aceitou
  @Column({ nullable: true, type: 'timestamp' }) recolhidoEm: Date;   // Quando a encomenda foi recolhida
  @Column({ nullable: true, type: 'timestamp' }) entregueEm: Date;    // Quando foi entregue
  @Column({ nullable: true, type: 'timestamp' }) canceladoEm: Date;   // Quando foi cancelado
  @Column({ nullable: true }) motivoCancelamento: string;              // Porquê foi cancelado

  @CreateDateColumn() criadoEm: Date;
  @UpdateDateColumn() atualizadoEm: Date;

  // ═══════════════════════════════════════════════════════════════
  // RELAÇÕES
  // ═══════════════════════════════════════════════════════════════

  // ManyToOne → MUITOS pedidos pertencem a UM cliente
  // @JoinColumn → Define qual coluna é a foreign key
  @ManyToOne('User', (u: any) => u.pedidosCliente)
  @JoinColumn({ name: 'clienteId' })
  cliente: any;

  // ManyToOne → MUITOS pedidos podem pertencer a UM entregador
  // nullable: true → Quando criado, não tem entregador ainda
  @ManyToOne('Deliver', { nullable: true })
  @JoinColumn({ name: 'motoqueiroId' })
  motoqueiro: any;

  // Um pedido pode ter MUITAS avaliações (uma do cliente para o motoqueiro, e vice-versa)
  @OneToMany('Avaliacao', (a: any) => a.pedido) avaliacoes: any[];
}
```

### Ciclo de vida de um pedido:
```
Cliente cria pedido
  → A_PROCURAR_MOTOQUEIRO  (à procura de entregador)
    → Motoqueiro aceita
      → A_CAMINHO_RECOLHA   (a caminho da recolha)
        → Motoqueiro recolhe
          → RECOLHIDO        (encomenda recolhida)
            → ENTREGANDO     (a caminho do destino)
              → Cliente confirma com código
                → ENTREGUE   (entrega concluída!)

Ou em qualquer ponto:
  → CANCELADO              (cancelado pelo cliente ou entregador)
```

---
