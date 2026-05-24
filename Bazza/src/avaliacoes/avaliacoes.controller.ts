import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Avaliações')
@ApiBearerAuth('firebase')
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly service: AvaliacoesService) {}

  @Post('pedidos/:id')
  @ApiOperation({ summary: 'Avaliar motoqueiro após entrega' })
  avaliar(
    @Param('id') pedidoId: string,
    @CurrentUser() user: User,
    @Body() body: { nota: number; comentario?: string },
  ) {
    return this.service.avaliarMotoqueiro(
      pedidoId,
      user.id,
      body.nota,
      body.comentario,
    );
  }
}