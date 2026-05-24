import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deliver, DeliverStatus, DeliverDisponibilidade } from './entities/motoqueiro.entity';
import { Veiculo } from './entities/veiculo.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Upload, UploadStatus } from '../uploads/entities/upload.entity';
import { UsersService } from '../users/users.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class MotoqueirosService {
  constructor(
    @InjectRepository(Deliver) private motoRepo: Repository<Deliver>,
    @InjectRepository(Veiculo) private veiculoRepo: Repository<Veiculo>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Upload) private uploadRepo: Repository<Upload>,
    private usersService: UsersService,
    private uploadsService: UploadsService,
  ) {}

  async encontrarPorUsuario(userId: string): Promise<Deliver | null> {
    return this.motoRepo.findOne({ where: { userId } });
  }

  async completarPerfilMotoqueiro(
    userId: string,
    dados: {
      numeroBI?: string;
      numeroCarta?: string;
      validadeCarta?: string;
      morada?: string;
      marca: string;
      modelo: string;
      placa: string;
      corPrincipal: string;
      ano: number;
    },
  ) {
    // 1. Atualizar dados de documento no Utilizador
    if (dados.numeroBI) {
      await this.userRepo.update(userId, {
        numeroDocumento: dados.numeroBI,
        tipoDocumento: 'BI',
      });
    }

    // 2. Procura ou cria o registo de motoqueiro
    let motoqueiro = await this.motoRepo.findOne({ where: { userId } });

    if (!motoqueiro) {
      motoqueiro = this.motoRepo.create({
        userId,
        ...(dados.numeroCarta && { numeroCartaConducao: dados.numeroCarta }),
        ...(dados.validadeCarta && { validadeCartaConducao: new Date(dados.validadeCarta) }),
        status: DeliverStatus.PENDENTE,
      });
    } else {
      if (dados.numeroCarta) motoqueiro.numeroCartaConducao = dados.numeroCarta;
      if (dados.validadeCarta) motoqueiro.validadeCartaConducao = new Date(dados.validadeCarta);
    }

    motoqueiro = await this.motoRepo.save(motoqueiro);

    // 3. Atualizar role do user para 'deliver' e marcar como pendente até aprovação do admin
    await this.userRepo.update(userId, { role: UserRole.DELIVER, status: UserStatus.PENDING });

    // 4. Criar Veículo
    const matriculaFormatada = dados.placa.toUpperCase();
    const veiculoExiste = await this.veiculoRepo.findOne({
      where: { matricula: matriculaFormatada },
    });

    if (veiculoExiste && veiculoExiste.motoqueiroId !== motoqueiro.id) {
      throw new BadRequestException('Esta matrícula já está registada no sistema.');
    }

    if (!veiculoExiste) {
      const veiculo = this.veiculoRepo.create({
        motoqueiroId: motoqueiro.id,
        marca: dados.marca,
        modelo: dados.modelo,
        matricula: matriculaFormatada,
        cor: dados.corPrincipal,
        ano: dados.ano,
      });
      await this.veiculoRepo.save(veiculo);
    }

    return {
      message: 'Perfil e veículo registados.',
      motoqueiroId: motoqueiro.id,
    };
  }

  async buscarPorUserId(userId: string): Promise<Deliver> {
    const motoqueiro = await this.motoRepo.findOne({
      where: { userId },
      relations: ['user', 'veiculos'],
    });
    if (!motoqueiro) throw new NotFoundException('Perfil de motoqueiro não encontrado');
    return motoqueiro;
  }

  async buscarMeusDocumentos(userId: string) {
    return this.uploadRepo
      .createQueryBuilder('u')
      .where('u.userId = :userId', { userId })
      .andWhere('u.tipo IN (:...tipos)', {
        tipos: [
          'documento_bi_frente',
          'documento_bi_verso',
          'documento_carta_frente',
          'documento_carta_verso',
          'foto_veiculo',
        ],
      })
      .select([
        'u.id',
        'u.tipo',
        'u.nomeOriginal',
        'u.mimeType',
        'u.tamanho',
        'u.status',
        'u.motivoRejeicao',
        'u.criadoEm',
      ])
      .orderBy('u.criadoEm', 'DESC')
      .getRawMany();
  }

  async listarPendentesAprovacao() {
    return this.motoRepo.find({
      where: { status: DeliverStatus.PENDENTE },
      relations: ['user', 'veiculos'],
      order: { criadoEm: 'ASC' },
    });
  }

  async verDetalhesCompletos(motoqueiroId: string) {
    const motoqueiro = await this.motoRepo.findOne({
      where: { id: motoqueiroId },
      relations: ['user', 'veiculos'],
    });
    if (!motoqueiro) throw new NotFoundException('Motoqueiro não encontrado');

    const uploads = await this.uploadRepo
      .createQueryBuilder('u')
      .where('u.userId = :userId', { userId: motoqueiro.userId })
      .select([
        'u.id',
        'u.tipo',
        'u.nomeOriginal',
        'u.mimeType',
        'u.tamanho',
        'u.status',
        'u.criadoEm',
      ])
      .orderBy('u.criadoEm', 'DESC')
      .getRawMany();

    return {
      motoqueiro,
      uploads,
      todosDocumentosAprovados: uploads.every((u) => u.u_status === 'aprovado'),
    };
  }

  async aprovar(motoqueiroId: string) {
    const motoqueiro = await this.motoRepo.findOne({ where: { id: motoqueiroId } });
    if (!motoqueiro) throw new NotFoundException('Motoqueiro não encontrado');

    const docsAprovados = await this.uploadRepo.count({
      where: {
        userId: motoqueiro.userId,
        status: UploadStatus.APROVADO,
      },
    });

    if (docsAprovados < 5) {
      throw new BadRequestException(
        'Aprove primeiro todos os documentos (mínimo 5).',
      );
    }

    motoqueiro.status = DeliverStatus.ACTIVO;
    motoqueiro.aprovadoEm = new Date();
    return this.motoRepo.save(motoqueiro);
  }

  async rejeitar(motoqueiroId: string, motivo: string) {
    const motoqueiro = await this.motoRepo.findOne({
      where: { id: motoqueiroId },
    });
    if (!motoqueiro) throw new NotFoundException('Motoqueiro não encontrado');

    motoqueiro.status = DeliverStatus.SUSPENSO;
    motoqueiro.motivoRejeicao = motivo;
    await this.motoRepo.save(motoqueiro);

    await this.userRepo.update(motoqueiro.userId, {
      status: 'suspended' as any,
    });

    return { message: 'Motoqueiro rejeitado' };
  }

  async atualizarStatus(
    userId: string,
    status: 'online' | 'offline' | 'ocupado',
  ) {
    const motoqueiro = await this.buscarPorUserId(userId);
    motoqueiro.statusDisponibilidade = status as DeliverDisponibilidade;
    return this.motoRepo.save(motoqueiro);
  }

  async atualizarLocalizacao(userId: string, latitude: number, longitude: number) {
    const motoqueiro = await this.buscarPorUserId(userId);
    motoqueiro.latitudeAtual = latitude;
    motoqueiro.longitudeAtual = longitude;
    motoqueiro.localizacaoAtualizadaEm = new Date();
    return this.motoRepo.save(motoqueiro);
  }

  async listarOnline() {
    return this.motoRepo.find({
      where: { statusDisponibilidade: DeliverDisponibilidade.ONLINE },
      relations: ['user'],
    });
  }
}