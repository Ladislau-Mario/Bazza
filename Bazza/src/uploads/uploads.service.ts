import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload, TipoUpload, UploadStatus } from './entities/upload.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload) private uploadRepo: Repository<Upload>,
  ) {}

  async fazer(
    userId: string,
    file: Express.Multer.File,
    tipo: TipoUpload,
  ): Promise<any> {
    if (!file) throw new BadRequestException('Ficheiro não foi enviado');

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Ficheiro excede 10MB');
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    if (!tiposPermitidos.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo '${file.mimetype}' não permitido. Use JPG, PNG, GIF ou PDF`);
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Ficheiro está vazio');
    }

    // Substituir se já existe
    const existente = await this.uploadRepo.findOne({ where: { userId, tipo } });

    if (existente) {
      existente.ficheiro = file.buffer;
      existente.nomeOriginal = file.originalname;
      existente.mimeType = file.mimetype;
      existente.tamanho = file.size;
      existente.status = UploadStatus.PENDENTE;
      existente.motivoRejeicao = '';
      await this.uploadRepo.save(existente);
      return { message: 'Ficheiro actualizado', upload: this.formatarResponse(existente) };
    }

    const upload = this.uploadRepo.create({
      userId,
      tipo,
      ficheiro: file.buffer,
      nomeOriginal: file.originalname,
      mimeType: file.mimetype,
      tamanho: file.size,
      status: UploadStatus.PENDENTE,
    });

    const saved = await this.uploadRepo.save(upload);
    return { message: 'Ficheiro enviado com sucesso', upload: this.formatarResponse(saved) };
  }

  async obterFicheiro(id: string) {
    const upload = await this.uploadRepo.findOne({
      where: { id },
      select: ['ficheiro', 'mimeType', 'nomeOriginal'],
    });
    if (!upload) throw new NotFoundException('Ficheiro não encontrado');

    return {
      buffer: Buffer.isBuffer(upload.ficheiro)
        ? upload.ficheiro
        : Buffer.from(upload.ficheiro),
      mimeType: upload.mimeType,
      nomeOriginal: upload.nomeOriginal,
    };
  }

  async buscarPorId(id: string) {
    const upload = await this.uploadRepo.findOne({
      where: { id },
      select: ['id', 'userId', 'tipo', 'nomeOriginal', 'mimeType', 'tamanho', 'status', 'motivoRejeicao', 'criadoEm'],
    });
    if (!upload) throw new NotFoundException('Upload não encontrado');
    return this.formatarResponse(upload);
  }

  async listarDoUtilizador(userId: string) {
    const uploads = await this.uploadRepo
      .createQueryBuilder('u')
      .where('u.userId = :userId', { userId })
      .select(['u.id', 'u.tipo', 'u.nomeOriginal', 'u.mimeType', 'u.tamanho', 'u.status', 'u.motivoRejeicao', 'u.criadoEm'])
      .orderBy('u.criadoEm', 'DESC')
      .getMany();

    return uploads.map((u) => this.formatarResponse(u));
  }

  async listarTodos(status?: string, skip = 0, take = 20) {
    const query = this.uploadRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.userId', 'u.tipo', 'u.nomeOriginal', 'u.mimeType', 'u.tamanho', 'u.status', 'u.motivoRejeicao', 'u.criadoEm']);

    if (status) {
      query.where('u.status = :status', { status });
    }

    const [uploads, total] = await query
      .orderBy('u.criadoEm', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: uploads.map((u) => this.formatarResponse(u)),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  async aprovar(id: string) {
    const upload = await this.uploadRepo.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload não encontrado');

    upload.status = UploadStatus.APROVADO;
    upload.motivoRejeicao = '';
    await this.uploadRepo.save(upload);

    return { message: 'Upload aprovado', upload: this.formatarResponse(upload) };
  }

  async rejeitar(id: string, motivo: string) {
    const upload = await this.uploadRepo.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload não encontrado');

    if (!motivo?.trim()) {
      throw new BadRequestException('Motivo da rejeição é obrigatório');
    }

    upload.status = UploadStatus.REJEITADO;
    upload.motivoRejeicao = motivo;
    await this.uploadRepo.save(upload);

    return { message: 'Upload rejeitado', upload: this.formatarResponse(upload) };
  }

  async remover(id: string, userId: string) {
    const upload = await this.uploadRepo.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload não encontrado');
    if (upload.userId !== userId) throw new ForbiddenException('Sem permissão');

    await this.uploadRepo.remove(upload);
    return { message: 'Upload removido com sucesso' };
  }

  async temTodosDocumentosObrigatorios(userId: string): Promise<boolean> {
    const tipos = [
      TipoUpload.FOTO_PERFIL,
      TipoUpload.DOCUMENTO_BI_FRENTE,
      TipoUpload.DOCUMENTO_BI_VERSO,
      TipoUpload.DOCUMENTO_CARTA_FRENTE,
      TipoUpload.DOCUMENTO_CARTA_VERSO,
      TipoUpload.FOTO_VEICULO,
      TipoUpload.FOTO_PLACA,
    ];
    const uploads = await this.uploadRepo.find({ where: { userId } });
    return tipos.every((tipo) => uploads.some((u) => u.tipo === tipo));
  }

  private formatarResponse(upload: any) {
    const { ficheiro, ...rest } = upload;
    return rest;
  }
}