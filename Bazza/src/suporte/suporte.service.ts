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
    return this.repo.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
    });
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

  async listarTodosTickets() {
    return this.repo.find({
      order: { criadoEm: 'DESC' },
      relations: ['user'],
    });
  }

  async eliminarTodos() {
    // As mensagens são eliminadas automaticamente (CASCADE)
    await this.repo.clear();
    return { message: 'Todas as conversas de suporte foram eliminadas.' };
  }
}
