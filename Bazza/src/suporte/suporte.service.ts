import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suporte } from './entities/suporte.entity';
import { MensagemSuporte } from './entities/mensagem-suporte.entity';

@Injectable()
export class SuporteService {
  constructor(
    @InjectRepository(Suporte)
    private repo: Repository<Suporte>,
    @InjectRepository(MensagemSuporte)
    private msgRepo: Repository<MensagemSuporte>,
  ) {}

  async criar(userId: string, assunto: string, mensagem: string) {
    const ticket = this.repo.create({ userId, assunto, mensagem });
    const saved = await this.repo.save(ticket);
    // Criar mensagem inicial
    await this.msgRepo.save({
      ticketId: saved.id,
      remetenteId: userId,
      remetenteTipo: 'cliente',
      texto: mensagem,
    });
    return saved;
  }

  async listarDoUtilizador(userId: string) {
    return this.repo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status NOT IN (:...excluidos)', { excluidos: ['eliminado'] })
      .orderBy('s.criadoEm', 'DESC')
      .getMany();
  }

  async buscarPorId(id: string) {
    const ticket = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado.');
    return ticket;
  }

  // ─── CHAT DE SUPORTE ───────────────────────────────────────
  async enviarMensagem(ticketId: string, remetenteId: string, remetenteTipo: string, texto: string) {
    // Verificar que o ticket existe
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado.');

    // Bloquear mensagens em tickets fechados ou eliminados
    if (ticket.status === 'fechado' || ticket.status === 'eliminado') {
      throw new NotFoundException('Ticket não encontrado.');
    }

    // Se o ticket estava resolvido, reabrir
    if (ticket.status === 'resolvido') {
      await this.repo.update(ticketId, { status: 'em_analise' });
    } else if (ticket.status === 'aberto') {
      await this.repo.update(ticketId, { status: 'em_analise' });
    }

    const msg = await this.msgRepo.save({
      ticketId,
      remetenteId,
      remetenteTipo,
      texto,
    });

    return this.msgRepo.findOne({
      where: { id: msg.id },
      relations: ['remetente'],
    });
  }

  async listarMensagens(ticketId: string) {
    return this.msgRepo.find({
      where: { ticketId },
      relations: ['remetente'],
      order: { criadoEm: 'ASC' },
    });
  }

  async marcarComoLidas(ticketId: string, remetenteTipo: string) {
    // Marcar como lidas as mensagens do outro lado
    const tipoOutro = remetenteTipo === 'admin' ? 'cliente' : 'admin';
    await this.msgRepo.update(
      { ticketId, remetenteTipo: tipoOutro, lida: false },
      { lida: true },
    );
  }

  async contarNaoLidas(ticketId: string, remetenteTipo: string) {
    // Contar mensagens não lidas vindas do outro lado
    const tipoOutro = remetenteTipo === 'admin' ? 'cliente' : 'admin';
    return this.msgRepo.count({
      where: { ticketId, remetenteTipo: tipoOutro, lida: false },
    });
  }

  async alterarStatus(ticketId: string, status: string) {
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    ticket.status = status;
    await this.repo.save(ticket);
    return { message: `Ticket actualizado para ${status}` };
  }

  async fechar(ticketId: string) {
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    ticket.status = 'fechado';
    await this.repo.save(ticket);
    return { message: 'Conversa fechada' };
  }

  async eliminar(ticketId: string) {
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    // Eliminar mensagens primeiro (CASCADE deve tratar, mas por segurança)
    await this.msgRepo.delete({ ticketId });
    // Eliminar o ticket
    await this.repo.delete(ticketId);
    return { message: 'Conversa eliminada' };
  }

  async listarTodosTickets() {
    const tickets = await this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'user')
      .where('s.status NOT IN (:...excluidos)', { excluidos: ['eliminado'] })
      .orderBy('s.criadoEm', 'DESC')
      .getMany();

    // Contar mensagens não lidas (vindas do cliente) para cada ticket
    const ticketsComNaoLidas = await Promise.all(
      tickets.map(async (t) => {
        const naoLidas = await this.contarNaoLidas(t.id, 'admin');
        return { ...t, mensagensNaoLidas: naoLidas };
      }),
    );
    return ticketsComNaoLidas;
  }

  async eliminarTodos() {
    // As mensagens são eliminadas automaticamente (CASCADE)
    await this.repo.clear();
    return { message: 'Todas as conversas de suporte foram eliminadas.' };
  }
}
