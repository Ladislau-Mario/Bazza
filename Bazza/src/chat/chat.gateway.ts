import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensagemChat } from './entities/mensagem.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectRepository(MensagemChat)
    private mensagemRepo: Repository<MensagemChat>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[Chat] Cliente conectado: ${client.id}`);
    // Registar sala por utilizador se o token contiver o userId
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    if (userId) {
      client.join(`user_${userId}`);
      console.log(`[Chat] Utilizador ${userId} entrou na sala user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] Cliente desconectado: ${client.id}`);
  }

  // Utilizador junta-se à sua própria sala (chamado pelo cliente após conectar)
  @SubscribeMessage('user:join')
  handleUserJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    client.join(`user_${data.userId}`);
    return { event: 'user:joined', data: { userId: data.userId } };
  }

  // Cliente/Motoqueiro entra na sala do pedido
  @SubscribeMessage('order:join')
  handleJoin(@MessageBody() data: { pedidoId: string }, @ConnectedSocket() client: Socket) {
    client.join(`pedido_${data.pedidoId}`);
    return { event: 'order:joined', data: { pedidoId: data.pedidoId } };
  }

  // Enviar mensagem
  @SubscribeMessage('chat:send')
  async handleMessage(
    @MessageBody() data: {
      pedidoId: string; remetenteId: string;
      remetenteTipo: 'cliente' | 'motoqueiro'; texto: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = this.mensagemRepo.create({
      pedidoId: data.pedidoId,
      remetenteId: data.remetenteId,
      remetenteTipo: data.remetenteTipo,
      texto: data.texto,
    });
    const saved = await this.mensagemRepo.save(msg);

    // Emite para todos na sala (incluindo o remetente)
    this.server.to(`pedido_${data.pedidoId}`).emit('chat:received', {
      id: saved.id,
      pedidoId: saved.pedidoId,
      senderId: saved.remetenteId,
      senderType: saved.remetenteTipo,
      text: saved.texto,
      timestamp: saved.criadoEm,
      read: false,
    });

    return { event: 'chat:sent', data: { id: saved.id } };
  }

  // Marcar como lidas
  @SubscribeMessage('chat:read')
  async handleRead(
    @MessageBody() data: { pedidoId: string; messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    await this.mensagemRepo
      .createQueryBuilder()
      .update()
      .set({ lida: true })
      .where('id IN (:...ids)', { ids: data.messageIds })
      .execute();

    this.server.to(`pedido_${data.pedidoId}`).emit('chat:read', {
      messageIds: data.messageIds,
    });
  }

  // Indicador de "a escrever"
  @SubscribeMessage('chat:typing')
  handleTyping(
    @MessageBody() data: { pedidoId: string; isTyping: boolean; remetenteTipo: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`pedido_${data.pedidoId}`).emit('chat:typing', {
      isTyping: data.isTyping,
      remetenteTipo: data.remetenteTipo,
    });
  }

  // Buscar histórico de mensagens
  async getHistorico(pedidoId: string) {
    return this.mensagemRepo.find({
      where: { pedidoId },
      order: { criadoEm: 'ASC' },
    });
  }
}