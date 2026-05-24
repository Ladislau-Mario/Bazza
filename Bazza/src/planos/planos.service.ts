import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plano, StatusPlano, TipoPlano } from './entities/plano.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notificacao/notificacao.service';

const PRECOS: Record<TipoPlano, { valor: number; dias: number }> = {
  [TipoPlano.DIARIO]:  { valor: 1000, dias: 1 },
  [TipoPlano.SEMANAL]: { valor: 5000, dias: 7 },
  [TipoPlano.MENSAL]:  { valor: 15000, dias: 30 },
};

@Injectable()
export class PlanosService {
  constructor(
    @InjectRepository(Plano) private planoRepo: Repository<Plano>,
    @InjectRepository(User)  private userRepo:  Repository<User>,
    private notifications: NotificationsService,
  ) {}

  async submeterComprovativo(userId: string, tipo: TipoPlano, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Comprovativo obrigatório');
    const config = PRECOS[tipo];
    if (!config) throw new BadRequestException('Tipo de plano inválido');

    const plano = this.planoRepo.create({
      userId,
      tipo,
      valor: config.valor,
      comprovativo: file.buffer,
      comprovativoMime: file.mimetype,
      status: StatusPlano.PENDENTE,
    });
    await this.planoRepo.save(plano);

    return { message: 'Comprovativo enviado! Aguarde a aprovação do administrador.', planoId: plano.id };
  }

  async aprovar(planoId: string) {
    const plano = await this.planoRepo.findOne({ where: { id: planoId }, relations: ['user'] });
    if (!plano) throw new NotFoundException('Plano não encontrado');

    const config = PRECOS[plano.tipo];
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + config.dias * 24 * 60 * 60 * 1000);

    plano.status = StatusPlano.ATIVO;
    plano.ativoEm = agora;
    plano.expiraEm = expiraEm;
    await this.planoRepo.save(plano);

    // Actualiza o utilizador
    await this.userRepo.update(plano.userId, {
      planoAtivo: plano.tipo,
      planoExpiraEm: expiraEm,
    } as any);

    if (plano.user?.fcmToken) {
      await this.notifications.enviarPush(
        plano.user.fcmToken,
        '✅ Plano Activado!',
        `O teu Plano ${plano.tipo} está activo até ${expiraEm.toLocaleDateString('pt-AO')}.`,
      );
    }
    return { message: 'Plano aprovado', expiraEm };
  }

  async rejeitar(planoId: string, motivo: string) {
    const plano = await this.planoRepo.findOne({ where: { id: planoId }, relations: ['user'] });
    if (!plano) throw new NotFoundException('Plano não encontrado');
    plano.status = StatusPlano.REJEITADO;
    plano.motivoRejeicao = motivo;
    await this.planoRepo.save(plano);
    if (plano.user?.fcmToken) {
      await this.notifications.enviarPush(
        plano.user.fcmToken,
        '❌ Plano Rejeitado',
        `Motivo: ${motivo}. Tenta novamente com um comprovativo válido.`,
      );
    }
    return { message: 'Plano rejeitado' };
  }

  async obterComprovativo(planoId: string): Promise<{ buffer: Buffer; mime: string }> {
    const plano = await this.planoRepo.findOne({
      where: { id: planoId },
      select: ['comprovativo', 'comprovativoMime'],
    });
    if (!plano || !plano.comprovativo) throw new NotFoundException('Comprovativo não encontrado');
    return {
      buffer: Buffer.isBuffer(plano.comprovativo) ? plano.comprovativo : Buffer.from(plano.comprovativo),
      mime: plano.comprovativoMime || 'image/jpeg',
    };
  }

  async listarMeus(userId: string) {
    return this.planoRepo.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
      select: ['id', 'tipo', 'status', 'valor', 'ativoEm', 'expiraEm', 'motivoRejeicao', 'criadoEm'],
    });
  }

  async planoAtivo(userId: string): Promise<Plano | null> {
    return this.planoRepo.findOne({
      where: { userId, status: StatusPlano.ATIVO },
      order: { expiraEm: 'DESC' },
    });
  }

  async listarTodos(filtros?: { tipo?: string; status?: string; search?: string }) {
    const qb = this.planoRepo.createQueryBuilder('plano')
      .leftJoinAndSelect('plano.user', 'user')
      .select([
        'plano.id', 'plano.tipo', 'plano.status', 'plano.valor',
        'plano.ativoEm', 'plano.expiraEm', 'plano.motivoRejeicao', 'plano.criadoEm',
        'user.id', 'user.nome', 'user.sobrenome', 'user.email', 'user.telefone',
        'user.fotoPerfil', 'user.fotoPerfilUrl',
      ])
      .orderBy('plano.criadoEm', 'DESC');

    if (filtros?.tipo) qb.andWhere('plano.tipo = :tipo', { tipo: filtros.tipo });
    if (filtros?.status) qb.andWhere('plano.status = :status', { status: filtros.status });
    if (filtros?.search) {
      qb.andWhere(
        '(user.nome LIKE :s OR user.sobrenome LIKE :s OR user.email LIKE :s OR user.telefone LIKE :s)',
        { s: `%${filtros.search}%` },
      );
    }

    return qb.getMany();
  }

  async obterEstatisticas() {
    const planos = await this.planoRepo.find({ where: { status: StatusPlano.ATIVO } });
    let totalSemanal = 0;
    let totalMensal = 0;
    let totalDiario = 0;
    for (const p of planos) {
      if (p.tipo === TipoPlano.SEMANAL) totalSemanal += Number(p.valor);
      else if (p.tipo === TipoPlano.MENSAL) totalMensal += Number(p.valor);
      else if (p.tipo === TipoPlano.DIARIO) totalDiario += Number(p.valor);
    }
    const activos = planos.length;
    const pendentes = await this.planoRepo.count({ where: { status: StatusPlano.PENDENTE } });
    return { totalSemanal, totalMensal, totalDiario, totalGeral: totalSemanal + totalMensal + totalDiario, activos, pendentes };
  }
}