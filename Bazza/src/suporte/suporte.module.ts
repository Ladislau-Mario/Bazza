import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suporte } from './entities/suporte.entity';
import { MensagemSuporte } from './entities/mensagem-suporte.entity';
import { SuporteController } from './suporte.controller';
import { SuporteService } from './suporte.service';

@Module({
  imports: [TypeOrmModule.forFeature([Suporte, MensagemSuporte])],
  controllers: [SuporteController],
  providers: [SuporteService],
  exports: [SuporteService],
})
export class SuporteModule {}
