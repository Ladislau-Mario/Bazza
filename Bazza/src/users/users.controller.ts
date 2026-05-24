import { Controller, Get, Patch, Delete, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('Utilizadores')
@ApiBearerAuth('firebase')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('perfil')
  meuPerfil(@CurrentUser() user: User) {
    return user;
  }

  @Patch('perfil')
  atualizarPerfil(@CurrentUser() user: User, @Body() body: any) {
    return this.service.atualizarPerfilBasico(user.id, body);
  }

  @Post('foto-perfil')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadFoto(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    if (!file) return { message: 'Nenhum ficheiro enviado' };
    await this.service.atualizar(user.id, { fotoPerfil: file.buffer } as any);
    return { message: 'Foto actualizada com sucesso' };
  }

  @Get('foto-perfil')
  async getFoto(@CurrentUser() user: User, @Res() res: Response) {
    const u = await this.service.buscarPorId(user.id);
    if (!u.fotoPerfil) {
      return res.status(404).json({ message: 'Sem foto' });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.isBuffer(u.fotoPerfil) ? u.fotoPerfil : Buffer.from(u.fotoPerfil));
  }

  @Delete('conta')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarConta(@CurrentUser() user: User) {
    return this.service.eliminarConta(user.id);
  }
}