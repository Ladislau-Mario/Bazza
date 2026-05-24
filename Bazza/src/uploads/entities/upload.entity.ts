import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UploadStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
}

export enum TipoUpload {
  FOTO_PERFIL = 'foto_perfil',
  DOCUMENTO_BI_FRENTE = 'documento_bi_frente',
  DOCUMENTO_BI_VERSO = 'documento_bi_verso',
  DOCUMENTO_CARTA_FRENTE = 'documento_carta_frente',
  DOCUMENTO_CARTA_VERSO = 'documento_carta_verso',
  FOTO_VEICULO = 'foto_veiculo',
  FOTO_PLACA = 'foto_placa',
  PROVA_ENTREGA = 'prova_entrega',
}

// Alias para compatibilidade
export const UploadTipo = TipoUpload;

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: TipoUpload })
  tipo: TipoUpload;

  @Column()
  nomeOriginal: string;

  @Column()
  mimeType: string;

  @Column({ type: 'longblob' })
  ficheiro: Buffer;

  @Column()
  tamanho: number;

  @Column({ type: 'enum', enum: UploadStatus, default: UploadStatus.PENDENTE })
  status: UploadStatus;

  @Column({ nullable: true })
  motivoRejeicao: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}