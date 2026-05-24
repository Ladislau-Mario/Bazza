import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { UsersService } from '../../users/users.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');

    // Suporte a tokens de admin simples (formato: admin_token_<userId>)
    if (token.startsWith('admin_token_')) {
      const userId = token.replace('admin_token_', '');
      try {
        const user = await this.usersService.buscarPorId(userId);
        if (user && user.role === 'admin') {
          request.user = user;
          return true;
        }
      } catch {}
      throw new UnauthorizedException('Token de admin inválido');
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);

      // Carrega o user completo da BD (sem criar duplicados)
      const user = await this.usersService.encontrarPorFirebaseUid(decoded.uid);
      if (!user) {
        throw new UnauthorizedException('Utilizador não encontrado na base de dados');
      }

      // Bloquear utilizadores eliminados ou suspensos
      if (user.status === 'eliminado') {
        throw new ForbiddenException('Esta conta foi eliminada.');
      }
      if (user.status === 'suspended') {
        throw new ForbiddenException('Esta conta está suspensa.');
      }

      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token Firebase inválido ou expirado');
    }
  }
}