import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { Carteira } from '../carteira/entities/carteira.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Carteira) private carteiraRepo: Repository<Carteira>,
  ) {}

  // ── Métodos base ──────────────────────────────────────────────

  async buscarPorId(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return user;
  }

  async encontrarPorFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
  }

  async encontrarPorTelefone(telefone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { telefone } });
  }

  // Aliases para compatibilidade com AuthService
  async findByPhone(telefone: string): Promise<User | null> {
    return this.encontrarPorTelefone(telefone);
  }

  async findOneByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.encontrarPorFirebaseUid(firebaseUid);
  }

  async encontrarPorRole(role: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { role: role as UserRole } });
  }

  async listarPorRole(role: string): Promise<User[]> {
    return this.userRepo.find({ where: { role: role as UserRole, status: 'active' as any } });
  }

  async listarTodos(): Promise<User[]> {
    return this.userRepo.createQueryBuilder('u')
      .where('u.status != :eliminado', { eliminado: 'eliminado' })
      .andWhere('u.status != :suspended', { suspended: 'suspended' })
      .andWhere('u.role != :admin', { admin: 'admin' })
      .getMany();
  }

  // ── Criar utilizador ──────────────────────────────────────────

  async create(dados: {
    firebase_uid?: string;
    firebaseUid?: string;
    phone?: string;
    telefone?: string;
    email?: string;
    name?: string;
    nome?: string;
    sobrenome?: string;
    fotoPerfil?: string;
    role?: string;
    is_active?: boolean;
    telefoneVerificado?: boolean;
  }): Promise<User> {
    return this.criar({
      firebaseUid: dados.firebase_uid || dados.firebaseUid || '',
      telefone: dados.phone || dados.telefone,
      email: dados.email,
      nome: dados.name || dados.nome,
      sobrenome: dados.sobrenome,
      role: dados.role,
      telefoneVerificado: dados.is_active || dados.telefoneVerificado || false,
    });
  }

  async criar(dados: {
    firebaseUid: string;
    telefone?: string;
    email?: string;
    nome?: string;
    sobrenome?: string;
    fotoPerfil?: string;
    role?: string;
    telefoneVerificado?: boolean;
  }): Promise<User> {
    const user = this.userRepo.create({
      firebaseUid: dados.firebaseUid,
      telefone: dados.telefone,
      email: dados.email,
      nome: dados.nome,
      sobrenome: dados.sobrenome,
      role: (dados.role as UserRole) || UserRole.CLIENT,
      telefoneVerificado: dados.telefoneVerificado || false,
    });

    const savedUser = await this.userRepo.save(user);

    // Cria carteira automaticamente
    const carteira = this.carteiraRepo.create({ userId: savedUser.id });
    await this.carteiraRepo.save(carteira);

    return savedUser;
  }

  // ── Actualizar ────────────────────────────────────────────────

  async atualizar(userId: string, dados: Partial<User>): Promise<User> {
    await this.userRepo.update(userId, dados as any);
    return this.buscarPorId(userId);
  }

  async atualizarPerfilBasico(
    userId: string,
    dados: {
      nome?: string;
      sobrenome?: string;
      email?: string;
      telefone?: string;
      dataNascimento?: string;
      fotoPerfil?: string;
      fcmToken?: string;
    },
  ): Promise<User> {
    const updateData: any = { ...dados };
    if (dados.dataNascimento) {
      updateData.dataNascimento = new Date(dados.dataNascimento);
    }
    await this.userRepo.update(userId, updateData);
    return this.buscarPorId(userId);
  }

  async atualizarRole(firebaseUid: string, role: string): Promise<User> {
    const user = await this.encontrarPorFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return this.atualizar(user.id, { role: role as UserRole });
  }

  // ── Encontrar ou criar (para Firebase guard) ──────────────────

  async encontrarOuCriar(decoded: any): Promise<User> {
    let user = await this.userRepo.findOne({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      user = await this.criar({
        firebaseUid: decoded.uid,
        email: decoded.email,
        telefone: decoded.phone_number,
        nome: decoded.name?.split(' ')[0],
        sobrenome: decoded.name?.split(' ').slice(1).join(' '),
      });
    }

    // Reativar conta eliminada
    if (user.status === UserStatus.ELIMINADO) {
      await this.userRepo.update(user.id, {
        status: UserStatus.ACTIVE,
        role: UserRole.CLIENT,
        nome: decoded.name?.split(' ')[0] || user.nome || 'Utilizador',
        sobrenome: decoded.name?.split(' ').slice(1).join(' ') || user.sobrenome || '',
        email: decoded.email || user.email,
        telefone: undefined as any,
        telefoneVerificado: false,
      });
      user = await this.buscarPorId(user.id);
    }

    return user;
  }

  // ── Eliminar conta ────────────────────────────────────────────

  async eliminarConta(userId: string): Promise<void> {
    const user = await this.buscarPorId(userId);
    await this.userRepo.update(userId, {
      status: UserStatus.ELIMINADO,
      fcmToken: undefined,
    });
  }
}