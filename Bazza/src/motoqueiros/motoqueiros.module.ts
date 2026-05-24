import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deliver } from './entities/motoqueiro.entity';
import { Veiculo } from './entities/veiculo.entity';
import { Documento } from './entities/documento.entity';
import { User } from '../users/entities/user.entity';
import { Upload } from '../uploads/entities/upload.entity';
import { MotoqueirosController } from './motoqueiros.controller';
import { MotoqueirosService } from './motoqueiros.service';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliver, Veiculo, Documento, User, Upload]),
    UsersModule,
    UploadsModule,
  ],
  controllers: [MotoqueirosController],
  providers: [MotoqueirosService],
  exports: [MotoqueirosService],
})
export class MotoqueirosModule {}