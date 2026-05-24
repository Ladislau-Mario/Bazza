import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notificacao.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Notificações')
@ApiBearerAuth('firebase')
@Controller('notificacoes')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  minhas(@CurrentUser() user: User) {
    return this.service.listarPorUsuario(user.id);
  }

  @Patch(':id/lida')
  marcarLida(@Param('id') id: string) {
    return this.service.marcarComoLida(id);
  }
}