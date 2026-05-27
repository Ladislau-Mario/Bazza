# SERVIÇOS DO BACKEND — Explicação Linha por Linha

Os serviços contêm a **lógica de negócio**. Cada serviço é uma classe `@Injectable()` que o NestJS injeta nos controllers.
Os serviços comunicam com a BD através dos **repositórios** do TypeORM.

---

## 1. users.service.ts — Serviço de Utilizadores

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';  // Injeta o repositório do TypeORM
import { Repository } from 'typeorm';                 // Tipo genérico de repositório
import { User, UserRole } from './entities/user.entity';
import { Carteira } from '../carteira/entities/carteira.entity';

@Injectable()
export class UsersService {
  // @InjectRepository(User) → Injeta o repositório da tabela 'users'
  // O repositório tem métodos: find(), findOne(), save(), delete(), etc.
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Carteira) private carteiraRepo: Repository<Carteira>,
  ) {}

  // ─── BUSCAR POR ID ───────────────────────────────────────────
  async buscarPorId(id: string): Promise<User | null> {
    // findOne → Busca UM registo que corresponda à condição
    // { where: { id } } → WHERE id = <id>
    return this.userRepo.findOne({ where: { id } });
  }

  // ─── BUSCAR POR FIREBASE UID ─────────────────────────────────
  async buscarPorFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
  }

  // ─── BUSCAR POR TELEFONE ─────────────────────────────────────
  async findByPhone(telefone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { telefone } });
  }

  // ─── LISTAR POR ROLE ─────────────────────────────────────────
  async listarPorRole(role: string): Promise<User[]> {
    // find → Busca TODOS os registos que correspondem
    // Retorna array de Users
    return this.userRepo.find({ where: { role: role as UserRole } });
  }

  // ─── LISTAR TODOS ────────────────────────────────────────────
  async listarTodos(): Promise<User[]> {
    return this.userRepo.find();
  }

  // ─── CRIAR UTILIZADOR ────────────────────────────────────────
  async criar(dados: {
    firebaseUid: string;
    telefone?: string;
    email?: string;
    nome?: string;
    sobrenome?: string;
  }): Promise<User> {
    // create → Cria uma instância de User (NÃO salva na BD ainda)
    const user = this.userRepo.create({
      ...dados,
      role: UserRole.CLIENT,  // Por defeito é cliente
    });

    // save → Salva na BD e retorna o user com o ID gerado
    const savedUser = await this.userRepo.save(user);

    // Cria carteira automaticamente para o novo utilizador
    const carteira = this.carteiraRepo.create({ userId: savedUser.id });
    await this.carteiraRepo.save(carteira);

    return savedUser;
  }

  // ─── ATUALIZAR ───────────────────────────────────────────────
  async atualizar(id: string, dados: Partial<User>): Promise<User> {
    // Partial<User> → Todos os campos são opcionais
    // update → Faz UPDATE apenas dos campos fornecidos
    await this.userRepo.update(id, dados);
    // Retorna o user atualizado
    return this.buscarPorId(id);
  }

  // ─── ELIMINAR CONTA (SOFT DELETE) ────────────────────────────
  async eliminarConta(id: string): Promise<void> {
    // Não usa delete() — usa update para soft delete
    // Marca como eliminado mas preserva os dados na BD
    await this.userRepo.update(id, {
      status: 'eliminado' as any,
      fcmToken: null,  // Remove o token FCM para não receber mais notificações
    });
  }

  // ─── ENCONTRAR OU CRIAR (usado pelo Google login) ───────────
  async encontrarOuCriar(firebaseData: any): Promise<User> {
    let user = await this.buscarPorFirebaseUid(firebaseData.uid);
    if (!user) {
      user = await this.criar({
        firebaseUid: firebaseData.uid,
        email: firebaseData.email,
        nome: firebaseData.name?.split(' ')[0],
      });
    }
    return user;
  }
}
```

---

## 2. pedidos.service.ts — Serviço de Pedidos (O MAIS COMPLEXO)

```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido, StatusPedido } from './entities/pedido.entity';
import { UsersService } from '../users/users.service';
import { MotoqueirosService } from '../motoqueiros/motoqueiros.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { CarteiraService } from '../carteira/carteira.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido) private pedidoRepo: Repository<Pedido>,
    private usersService: UsersService,
    private motoqueirosService: MotoqueirosService,
    private notificacaoService: NotificacaoService,
    private carteiraService: CarteiraService,
    private chatGateway: ChatGateway,  // Para emitir eventos socket
  ) {}

  // ═══════════════════════════════════════════════════════════
  // CRIAR PEDIDO (POST /pedidos)
  // ═══════════════════════════════════════════════════════════
  async criar(clienteId: string, dados: any): Promise<Pedido> {
    // 1. Validar que o cliente existe
    const cliente = await this.usersService.buscarPorId(clienteId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    // 2. Calcular preço
    // Fórmula: max(distância × 350, 500) + surcharge por peso
    // Mínimo de 500 Kz (Kwanza angolano)
    const distanciaKm = dados.distanciaKm || 1;
    const precoBase = Math.max(distanciaKm * 350, 500);
    const surchargePeso = dados.peso === 'pesado' ? 500 : dados.peso === 'normal' ? 200 : 0;
    const valorEntrega = precoBase + surchargePeso;

    // 3. Gerar número de pedido único
    const numeroPedido = `BZ-${Date.now()}`;

    // 4. Gerar código numérico de 6 dígitos para confirmação
    const codigoNumerico = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Gerar código QR
    const codigoQr = `BIKO:${numeroPedido}:${codigoNumerico}`;

    // 6. Criar o pedido na BD
    const pedido = this.pedidoRepo.create({
      clienteId,
      numeroPedido,
      origemLatitude: dados.origemLatitude,
      origemLongitude: dados.origemLongitude,
      origemEndereco: dados.origemEndereco,
      destinoLatitude: dados.destinoLatitude,
      destinoLongitude: dados.destinoLongitude,
      destinoEndereco: dados.destinoEndereco,
      distanciaKm,
      tipo: dados.tipo || 'documento',
      valorEntrega,
      codigoNumerico,
      codigoQr,
      status: StatusPedido.A_PROCURAR_MOTOQUEIRO,
    });

    const saved = await this.pedidoRepo.save(pedido);

    // 7. Notificar motoqueiros online via socket
    this.chatGateway.server.emit('pedido:novo', saved);

    // 8. Notificar via push notification
    const motoqueirosOnline = await this.motoqueirosService.listarOnline();
    for (const m of motoqueirosOnline) {
      await this.notificacaoService.notificarNovoPedidoParaMotoqueiro(m.userId, saved);
    }

    return saved;
  }

  // ═══════════════════════════════════════════════════════════
  // ACEITAR PEDIDO (POST /pedidos/:id/aceitar)
  // ═══════════════════════════════════════════════════════════
  async aceitar(pedidoId: string, motoqueiroId: string): Promise<Pedido> {
    // 1. Buscar pedido
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    // 2. Validar que está à procura de motoqueiro
    if (pedido.status !== StatusPedido.A_PROCURAR_MOTOQUEIRO) {
      throw new BadRequestException('Pedido já foi aceite ou cancelado');
    }

    // 3. Validar que o entregador está ativo
    const deliver = await this.motoqueirosService.buscarPorUserId(motoqueiroId);
    if (!deliver || deliver.status !== 'activo') {
      throw new ForbiddenException('Entregador não está ativo');
    }

    // 4. Atualizar pedido
    pedido.motoqueiroId = deliver.id;
    pedido.status = StatusPedido.A_CAMINHO_RECOLHA;  // NÃO motoqueiro_atribuido
    pedido.atribuidoEm = new Date();

    const saved = await this.pedidoRepo.save(pedido);

    // 5. Notificar cliente via socket
    this.chatGateway.server.to(`user_${pedido.clienteId}`).emit('pedido:update', saved);

    // 6. Notificar cliente via push
    await this.notificacaoService.notificarPedidoAceite(pedido.clienteId, saved);

    return saved;
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIRMAR ENTREGA (POST /pedidos/:id/confirmar-entrega)
  // ═══════════════════════════════════════════════════════════
  async confirmarEntrega(pedidoId: string, codigo: string, userId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    // Extrair código do QR se veio formato "BIKO:BZ-xxx:123456"
    const codigoLimpo = codigo.includes(':') ? codigo.split(':').pop() : codigo;

    // Verificar código
    if (pedido.codigoNumerico !== codigoLimpo) {
      throw new BadRequestException('Código de confirmação incorreto');
    }

    // Atualizar para entregue
    pedido.status = StatusPedido.ENTREGUE;
    pedido.codigoConfirmado = true;
    pedido.codigoConfirmadoEm = new Date();
    pedido.entregueEm = new Date();

    const saved = await this.pedidoRepo.save(pedido);

    // Creditar motoqueiro (85% do valor)
    if (pedido.motoqueiroId) {
      const valorMotoqueiro = Number(pedido.valorEntrega) * 0.85;
      const deliver = await this.motoqueirosService.buscarPorId(pedido.motoqueiroId);
      if (deliver) {
        await this.carteiraService.adicionarTransacao(deliver.userId, {
          tipo: 'CREDITO',
          valor: valorMotoqueiro,
          descricao: `Entrega #${pedido.numeroPedido}`,
        });
      }
    }

    // Notificar cliente
    await this.notificacaoService.notificarPedidoEntregue(pedido.clienteId, saved);

    // Emitir socket
    this.chatGateway.server.emit('pedido:update', saved);

    return saved;
  }

  // ═══════════════════════════════════════════════════════════
  // CANCELAR PEDIDO (POST /pedidos/:id/cancelar)
  // ═══════════════════════════════════════════════════════════
  async cancelar(pedidoId: string, userId: string, motivo: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    // Só pode cancelar antes de ser entregue
    if (pedido.status === StatusPedido.ENTREGUE) {
      throw new BadRequestException('Não é possível cancelar uma entrega concluída');
    }

    pedido.status = StatusPedido.CANCELADO;
    pedido.canceladoEm = new Date();
    pedido.motivoCancelamento = motivo;

    const saved = await this.pedidoRepo.save(pedido);

    // Notificar a outra parte
    const notificarId = pedido.clienteId === userId ? pedido.motoqueiroId : pedido.clienteId;
    if (notificarId) {
      await this.notificacaoService.criar({
        userId: notificarId,
        titulo: 'Pedido cancelado',
        mensagem: `O pedido #${pedido.numeroPedido} foi cancelado: ${motivo}`,
        tipo: 'pedido',
      });
    }

    this.chatGateway.server.emit('pedido:cancelado', saved);
    return saved;
  }

  // ═══════════════════════════════════════════════════════════
  // GANHOS POR PERÍODO
  // ═══════════════════════════════════════════════════════════
  async ganhosPorPeriodo(motoqueiroId: string, periodo: string) {
    // Buscar todos os pedidos entregues do motoqueiro
    const pedidos = await this.pedidoRepo.find({
      where: { motoqueiroId, status: StatusPedido.ENTREGUE },
      order: { entregueEm: 'DESC' },
    });

    // Calcular total (85% para o motoqueiro, 15% para a plataforma)
    const total = pedidos.reduce((sum, p) => sum + Number(p.valorEntrega) * 0.85, 0);

    // Agrupar por dia
    const porDia: Record<string, number> = {};
    for (const p of pedidos) {
      const dia = new Date(p.entregueEm).toISOString().split('T')[0];
      porDia[dia] = (porDia[dia] || 0) + Number(p.valorEntrega) * 0.85;
    }

    return { total, porDia, pedidos };
  }

  // Métodos auxiliares de listagem
  async listarDoCliente(clienteId: string) {
    return this.pedidoRepo.find({ where: { clienteId }, order: { criadoEm: 'DESC' }, relations: ['motoqueiro', 'motoqueiro.user'] });
  }

  async buscarPorId(id: string) {
    return this.pedidoRepo.findOne({ where: { id }, relations: ['cliente', 'motoqueiro', 'motoqueiro.user'] });
  }
}
```

---

## 3. uploads.service.ts — Serviço de Upload de Ficheiros

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';

// Tipos MIME permitidos
const MIME_PERMITIDOS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'application/pdf',
];
const TAMANHO_MAX = 10 * 1024 * 1024; // 10MB

@Injectable()
export class UploadsService {
  constructor(@InjectRepository(Upload) private uploadRepo: Repository<Upload>) {}

  // ═══════════════════════════════════════════════════════════
  // FAZER UPLOAD (POST /uploads/:tipo)
  // ═══════════════════════════════════════════════════════════
  async fazer(userId: string, file: any, tipo: string) {
    // 1. Validar tamanho
    if (file.size > TAMANHO_MAX) {
      throw new BadRequestException('Ficheiro demasiado grande. Máximo: 10MB');
    }

    // 2. Validar tipo MIME
    if (!MIME_PERMITIDOS.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo não permitido: ${file.mimetype}`);
    }

    // 3. Validar que o buffer não está vazio
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Ficheiro vazio');
    }

    // 4. Se já existe upload do mesmo tipo → SUBSTITUI
    const existente = await this.uploadRepo.findOne({ where: { userId, tipo } });
    if (existente) {
      existente.ficheiro = file.buffer;
      existente.mimeType = file.mimetype;
      existente.nomeOriginal = file.originalname;
      existente.tamanho = file.size;
      existente.status = 'pendente'; // Reset status para nova revisão
      return this.uploadRepo.save(existente);
    }

    // 5. Criar novo upload
    const upload = this.uploadRepo.create({
      userId,
      tipo,
      nomeOriginal: file.originalname,
      mimeType: file.mimetype,
      ficheiro: file.buffer,     // O ficheiro binário é guardado na BD
      tamanho: file.size,
      status: 'pendente',
    });

    return this.uploadRepo.save(upload);
  }

  // ═══════════════════════════════════════════════════════════
  // OBTER FICHEIRO (GET /uploads/:id/download)
  // ═══════════════════════════════════════════════════════════
  async obterFicheiro(id: string) {
    const upload = await this.uploadRepo.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload não encontrado');

    // Retorna o buffer binário + metadados
    return {
      buffer: upload.ficheiro,       // O conteúdo binário da imagem
      mimeType: upload.mimeType,     // image/jpeg, image/png, etc.
      nomeOriginal: upload.nomeOriginal, // Nome original do ficheiro
    };
  }

  // Listar uploads de um utilizador (sem o campo binário para performance)
  async listarDoUtilizador(userId: string) {
    return this.uploadRepo.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
      select: ['id', 'tipo', 'nomeOriginal', 'mimeType', 'tamanho', 'status', 'motivoRejeicao', 'criadoEm'],
    });
  }

  // Aprovar documento (admin)
  async aprovar(id: string) {
    await this.uploadRepo.update(id, { status: 'aprovado' });
  }

  // Rejeitar documento (admin)
  async rejeitar(id: string, motivo: string) {
    await this.uploadRepo.update(id, { status: 'rejeitado', motivoRejeicao: motivo });
  }

  // Verificar se tem todos os documentos obrigatórios
  async temTodosDocumentosObrigatorios(userId: string): Promise<boolean> {
    const obrigatorios = [
      'documento_bi_frente', 'documento_bi_verso',
      'documento_carta_frente', 'documento_carta_verso',
      'foto_veiculo',
    ];

    const uploads = await this.uploadRepo.find({
      where: { userId, status: 'aprovado' },
      select: ['tipo'],
    });

    const tiposAprovados = uploads.map(u => u.tipo);
    return obrigatorios.every(t => tiposAprovados.includes(t));
  }
}
```

---

## 4. notificacao.service.ts — Serviço de Notificações

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { UsersService } from '../users/users.service';
import * as admin from 'firebase-admin';
import { FIREBASE_APP } from '../firebase/firebase.module';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificacaoService {
  constructor(
    @InjectRepository(Notificacao) private repo: Repository<Notificacao>,
    private usersService: UsersService,
    @Inject(FIREBASE_APP) private firebaseApp: admin.app.App,
    private chatGateway: ChatGateway,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // CRIAR NOTIFICAÇÃO (persistir + push + socket)
  // ═══════════════════════════════════════════════════════════
  async criar(dados: { userId: string; titulo: string; mensagem: string; tipo: string }) {
    // 1. Salvar na BD
    const notificacao = this.repo.create(dados);
    const saved = await this.repo.save(notificacao);

    // 2. Enviar push notification se o user tem FCM token
    const user = await this.usersService.buscarPorId(dados.userId);
    if (user?.fcmToken) {
      await this.enviarPush(user.fcmToken, dados.titulo, dados.mensagem);
    }

    // 3. Emitir socket para tempo real
    try {
      this.chatGateway.server.to(`user_${dados.userId}`).emit('notification:new', saved);
    } catch {}

    return saved;
  }

  // ═══════════════════════════════════════════════════════════
  // ENVIAR PUSH VIA FIREBASE CLOUD MESSAGING
  // ═══════════════════════════════════════════════════════════
  private async enviarPush(fcmToken: string, titulo: string, mensagem: string) {
    try {
      await admin.messaging(this.firebaseApp).send({
        token: fcmToken,
        notification: { title: titulo, body: mensagem },
        android: { priority: 'high' },   // Prioridade alta para Android
        apns: { payload: { aps: { sound: 'default' } } }, // Som padrão para iOS
      });
    } catch (e) {
      console.warn('FCM push falhou:', e.message);
    }
  }

  // Listar notificações de um utilizador
  async listarPorUsuario(userId: string) {
    return this.repo.find({ where: { userId }, order: { criadoEm: 'DESC' } });
  }

  // Marcar como lida
  async marcarComoLida(id: string) {
    await this.repo.update(id, { lida: true });
  }

  // Enviar para todos (admin)
  async enviarParaTodos(titulo: string, mensagem: string, tipo: string) {
    const users = await this.usersService.listarTodos();
    let enviados = 0;
    for (const user of users) {
      if (user.role !== 'admin') {
        await this.criar({ userId: user.id, titulo, mensagem, tipo });
        enviados++;
      }
    }
    return { enviados, total: users.length };
  }

  // Enviar para grupo (admin)
  async enviarParaGrupo(role: string, titulo: string, mensagem: string, tipo: string) {
    const users = await this.usersService.listarPorRole(role);
    for (const user of users) {
      await this.criar({ userId: user.id, titulo, mensagem, tipo });
    }
    return { enviados: users.length };
  }

  // Templates prontos para uso interno
  async notificarPedidoAceite(userId: string, pedido: any) {
    await this.criar({ userId, titulo: 'Pedido aceite!', mensagem: `O entregador aceitou o pedido #${pedido.numeroPedido}`, tipo: 'pedido' });
  }

  async notificarNovoPedidoParaMotoqueiro(userId: string, pedido: any) {
    await this.criar({ userId, titulo: 'Novo pedido disponível', mensagem: `Entrega de ${pedido.valorEntrega} Kz — ${pedido.destinoEndereco}`, tipo: 'pedido' });
  }
}
```

---

## 5. avaliacoes.service.ts — Sistema de Avaliações

```typescript
@Injectable()
export class AvaliacoesService {
  constructor(
    @InjectRepository(Avaliacao) private repo: Repository<Avaliacao>,
    @InjectRepository(Pedido) private pedidoRepo: Repository<Pedido>,
    @InjectRepository(Deliver) private deliverRepo: Repository<Deliver>,
  ) {}

  async avaliarMotoqueiro(clienteId: string, pedidoId: string, nota: number, comentario: string) {
    // Validar nota entre 1 e 5
    if (nota < 1 || nota > 5) throw new BadRequestException('Nota deve ser entre 1 e 5');

    // Buscar pedido
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    // Só pode avaliar pedidos entregues
    if (pedido.status !== StatusPedido.ENTREGUE) throw new BadRequestException('Pedido ainda não foi entregue');

    // Só o cliente do pedido pode avaliar
    if (pedido.clienteId !== clienteId) throw new ForbiddenException('Não é o teu pedido');

    // Criar avaliação
    const avaliacao = this.repo.create({
      avaliadorId: clienteId,
      avaliadoId: pedido.motoqueiroId,  // ID do User do entregador
      pedidoId,
      nota,
      comentario,
    });
    await this.repo.save(avaliacao);

    // Recalcular classificação média do entregador
    await this.recalcularClassificacao(pedido.motoqueiroId);

    return avaliacao;
  }

  // Recalcula a média de avaliações do entregador
  async recalcularClassificacao(motoqueiroId: string) {
    // AVG → Calcula a média das notas
    // COUNT → Conta o total de avaliações
    const resultado = await this.repo
      .createQueryBuilder('a')
      .select('AVG(a.nota)', 'media')
      .addSelect('COUNT(a.id)', 'total')
      .where('a.avaliadoId = :id', { id: motoqueiroId })
      .getRawOne();

    // Atualizar o Deliver com a nova média
    await this.deliverRepo.update(
      { userId: motoqueiroId }, // Procura pelo userId
      {
        classificacaoMedia: Number(resultado.media) || 0,
        totalAvaliacoes: Number(resultado.total) || 0,
      },
    );
  }
}
```

---

## 6. carteira.service.ts — Carteira Digital

```typescript
@Injectable()
export class CarteiraService {
  constructor(
    @InjectRepository(Carteira) private carteiraRepo: Repository<Carteira>,
    @InjectRepository(Transacao) private transacaoRepo: Repository<Transacao>,
  ) {}

  // Obter carteira (cria se não existir)
  async getCarteira(userId: string) {
    let carteira = await this.carteiraRepo.findOne({ where: { userId } });
    if (!carteira) {
      carteira = this.carteiraRepo.create({ userId, saldo: 0 });
      carteira = await this.carteiraRepo.save(carteira);
    }
    return carteira;
  }

  // Adicionar transação
  async adicionarTransacao(userId: string, dados: { tipo: string; valor: number; descricao: string }) {
    const carteira = await this.getCarteira(userId);

    // Criar registo da transação
    const transacao = this.transacaoRepo.create({
      carteiraId: carteira.id,
      tipo: dados.tipo,       // CREDITO ou DEBITO
      valor: dados.valor,
      descricao: dados.descricao,
    });
    await this.transacaoRepo.save(transacao);

    // Atualizar saldo
    if (dados.tipo === 'CREDITO') {
      carteira.saldo = Number(carteira.saldo) + dados.valor;
      carteira.totalGanho = Number(carteira.totalGanho) + dados.valor;
    } else {
      carteira.saldo = Number(carteira.saldo) - dados.valor;
    }

    await this.carteiraRepo.save(carteira);
    return transacao;
  }

  // Histórico de transações
  async obterHistorico(userId: string) {
    const carteira = await this.getCarteira(userId);
    return this.transacaoRepo.find({ where: { carteiraId: carteira.id }, order: { criadoEm: 'DESC' } });
  }
}
```

---

## 7. chat.gateway.ts — Gateway Socket.io

```typescript
import {
  WebSocketGateway,       // Marca como gateway WebSocket
  WebSocketServer,        // Injeta o servidor Socket.io
  SubscribeMessage,       // Marca como handler de evento socket
  OnGatewayConnection,    // Interface: chamado quando cliente conecta
  OnGatewayDisconnect,    // Interface: chamado quando cliente desconecta
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';

// namespace: '/chat' → Todos os clientes se conectam a /chat
// cors: '*' → Permite conexões de qualquer origem
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // @WebSocketServer() → Injeta automaticamente o servidor Socket.io
  @WebSocketServer() server: Server;

  // Chamado quando um cliente se conecta
  async handleConnection(client: Socket) {
    // Obtém o userId do query string ou dos headers
    const userId = client.handshake.query.userId as string;

    if (userId) {
      // Cria uma sala pessoal para o utilizador
      // Assim pode receber notificações diretas
      client.join(`user_${userId}`);
      client.data.userId = userId;
    }
  }

  // Chamado quando um cliente desconecta
  handleDisconnect(client: Socket) {
    console.log(`[Socket] Desconectado: ${client.id}`);
  }

  // ── EVENTO: Entrar numa sala de pedido ──
  @SubscribeMessage('order:join')
  handleOrderJoin(client: Socket, data: { pedidoId: string }) {
    // Junta-se à sala do pedido para receber atualizações
    client.join(`pedido_${data.pedidoId}`);
  }

  // ── EVENTO: Enviar mensagem de chat ──
  @SubscribeMessage('chat:send')
  handleChatSend(client: Socket, data: any) {
    // Aceita tanto nomes PT como EN (retrocompatibilidade)
    const pedidoId = data.pedidoId;
    const texto = data.texto || data.text;

    // Emite para TODOS na sala do pedido
    this.server.to(`pedido_${pedidoId}`).emit('chat:received', {
      pedidoId,
      texto,
      remetenteId: data.remetenteId || data.senderId,
    });
  }

  // ── EVENTO: Marcar mensagens como lidas ──
  @SubscribeMessage('chat:read')
  handleChatRead(client: Socket, data: { pedidoId: string; ids: string[] }) {
    // Emite para a sala (o outro lado sabe que as mensagens foram lidas)
    this.server.to(`pedido_${data.pedidoId}`).emit('chat:read', {
      ids: data.ids,
      readBy: client.data.userId,
    });
  }

  // ── EVENTO: Indicador de digitação ──
  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, data: { pedidoId: string }) {
    // Broadcast para a sala exceto o próprio remetente
    client.to(`pedido_${data.pedidoId}`).emit('chat:typing', {
      userId: client.data.userId,
    });
  }
}
```

---
