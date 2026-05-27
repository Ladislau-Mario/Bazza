# AUTENTICAÇÃO — Explicação Linha por Linha

O sistema de autenticação tem **2 camadas de guarda** que protegem TODAS as rotas:
1. `FirebaseAuthGuard` — Verifica se o token é válido (Firebase ou JWT admin)
2. `RolesGuard` — Verifica se o utilizador tem permissão para aceder à rota

---

## 1. decorators/public.decorator.ts — Decorator @Public()

```typescript
// Importa SetMetadata do NestJS — permite anexar dados arbitrários a uma rota
import { SetMetadata } from '@nestjs/common';

// Cria um decorator @Public() que marca uma rota como pública
// Quando usado numa rota, o FirebaseAuthGuard ignora essa rota (não pede token)
// Exemplo de uso: @Public() @Post('login') login() { ... }
export const Public = () => SetMetadata('isPublic', true);
```

---

## 2. decorators/current-user.decorator.ts — Decorator @CurrentUser()

```typescript
// createParamDecorator → Cria um decorator personalizado para extrair dados do pedido
// ExecutionContext → Dá acesso ao pedido HTTP, WebSocket, etc.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Cria o decorator @CurrentUser()
// Uso: @CurrentUser() user: User — extrai o utilizador autenticado do pedido
export const CurrentUser = createParamDecorator(
  // data: unknown → Parâmetro opcional passado ao decorator (não usado aqui)
  // ctx: ExecutionContext → Contexto de execução atual
  (data: unknown, ctx: ExecutionContext) => {
    // switchToHttp() → Muda para o contexto HTTP
    // getRequest() → Obtém o objeto Request do Express
    const request = ctx.switchToHttp().getRequest();
    // Retorna request.user — foi anexado pelo FirebaseAuthGuard
    return request.user;
  },
);
```

---

## 3. guards/firebase-auth.guard.ts — Guarda de Autenticação Global

Esta é a **primeira camada de segurança**. É aplicada a TODAS as rotas (via `APP_GUARD` no `app.module.ts`).

```typescript
import {
  Injectable,            // Marca como serviço injetável pelo NestJS
  CanActivate,           // Interface que obriga a ter método canActivate()
  ExecutionContext,      // Contexto de execução (pedido HTTP atual)
  UnauthorizedException, // Gera erro HTTP 401
  ForbiddenException,    // Gera erro HTTP 403
} from '@nestjs/common';

// Reflector → Permite ler metadados anexados por decorators (@Public, @Roles)
import { Reflector } from '@nestjs/core';

// Firebase Admin SDK — para verificar tokens Firebase
import * as admin from 'firebase-admin';

// Biblioteca JWT — para verificar tokens JWT do admin
import * as jwt from 'jsonwebtoken';

// Serviço de utilizadores — para buscar users na BD
import { UsersService } from '../../users/users/entities/user.entity';

// Chave secreta para verificar JWT tokens
// Deve ser a mesma usada em auth.service.ts para assinar tokens
export const IS_PUBLIC_KEY = 'isPublic';
const JWT_SECRET = process.env.JWT_SECRET || 'baza_admin_jwt_secret_2026';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private reflector: Reflector, // Para ler metadados dos decorators
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ═══════════════════════════════════════════════════════════
    // PASSO 1: Verificar se a rota é pública
    // ═══════════════════════════════════════════════════════════

    // getAllAndOverride → Procura o metadado 'isPublic' no método E na classe
    // Se encontrar 'isPublic: true', a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Verifica no método do controller
      context.getClass(),   // Verifica na classe do controller
    ]);
    if (isPublic) return true; // Rota pública — não precisa de autenticação

    // ═══════════════════════════════════════════════════════════
    // PASSO 2: Extrair o token do header Authorization
    // ═══════════════════════════════════════════════════════════

    // Obtém o objeto Request HTTP
    const request = context.switchToHttp().getRequest();

    // Lê o header Authorization
    // Formato esperado: "Bearer <token>"
    const authHeader = request.headers.authorization;

    // Se não existe ou não começa com "Bearer " → erro 401
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    // Remove "Bearer " para obter só o token
    const token = authHeader.replace('Bearer ', '');

    // ═══════════════════════════════════════════════════════════
    // PASSO 3: Tentar verificar como JWT de admin
    // ═══════════════════════════════════════════════════════════

    try {
      // jwt.verify → Verifica a assinatura e decodifica o token
      // Se a assinatura for inválida ou o token expirado → lança exceção
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

      // Verifica se o token é de admin
      if (decoded.role === 'admin') {
        // Procura o utilizador na BD pelo userId
        const user = await this.usersService.buscarPorId(decoded.userId);
        if (user && user.role === 'admin') {
          request.user = user; // Anexa o user ao pedido
          return true;          // Admin autenticado com sucesso!
        }
      }
    } catch {
      // Não é um JWT válido — pode ser um Firebase token
      // Não faz nada, continua para a próxima tentativa
    }

    // ═══════════════════════════════════════════════════════════
    // PASSO 4: Tentar como token admin legado (compatibilidade)
    // ═══════════════════════════════════════════════════════════

    // Formato antigo: "admin_token_<userId>"
    // Mantido para retrocompatibilidade com versões antigas do frontend
    if (token.startsWith('admin_token_')) {
      const userId = token.replace('admin_token_', '');
      const user = await this.usersService.buscarPorId(userId);
      if (user && user.role === 'admin') {
        request.user = user;
        return true;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PASSO 5: Tentar como Firebase token (móvel)
    // ═══════════════════════════════════════════════════════════

    try {
      // admin.auth().verifyIdToken() → Verifica o token junto aos servidores do Firebase
      // Retorna o objeto decodificado: { uid, email, name, ... }
      const decodedFirebase = await admin.auth().verifyIdToken(token);

      // Procura o utilizador na BD pelo firebaseUid
      const user = await this.usersService.buscarPorFirebaseUid(decodedFirebase.uid);
      if (!user) {
        throw new UnauthorizedException('Utilizador não encontrado na base de dados');
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 6: Verificar se o utilizador pode aceder
      // ═══════════════════════════════════════════════════════════

      // Utilizador eliminado — bloqueia
      if (user.status === 'eliminado') {
        throw new ForbiddenException('Esta conta foi eliminada.');
      }

      // Utilizador suspenso — bloqueia
      if (user.status === 'suspended') {
        throw new ForbiddenException('Esta conta está suspensa.');
      }

      request.user = user; // Anexa ao pedido
      return true;          // Autenticado com sucesso!

    } catch (error) {
      // Se é ForbiddenException (eliminado/suspended), relança
      // Para que o cliente receba o código de erro correto (403)
      if (error instanceof ForbiddenException) throw error;

      // Token inválido ou expirado
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
```

---

## 4. guards/roles.guard.ts — Guarda de Permissões

Esta é a **segunda camada de segurança**. Só é executada se a rota tem o decorator `@Roles()`.

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// Chave para os metadados do decorator @Roles()
export const ROLES_KEY = 'roles';

// Decorator @Roles() — Define quais roles podem aceder à rota
// Exemplo: @Roles('admin') → Só administradores
// Aceita qualquer string — não usa o enum diretamente para evitar conflitos
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lê os roles requeridos do decorator @Roles()
    // Se aplicado na classe E no método, o método tem prioridade
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles definidos → qualquer utilizador autenticado pode aceder
    // (a autenticação já foi feita pelo FirebaseAuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Obtém o utilizador do pedido (foi anexado pelo FirebaseAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Se não tem user → não deveria chegar aqui (FirebaseAuthGuard já bloqueia)
    if (!user) {
      throw new ForbiddenException('Utilizador não autenticado.');
    }

    // Converte o role do user para lowercase para comparação
    const userRole = user.role?.toLowerCase();

    // Verifica se o role do user está na lista de roles permitidos
    // some() → retorna true se PELO MENOS um role corresponder
    const hasRole = requiredRoles.some(
      (r) => r.toLowerCase() === userRole,
    );

    // Se não tem permissão → erro 403
    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Requer perfil: ${requiredRoles.join(' ou ')}`,
      );
    }

    return true; // Tem permissão!
  }
}
```

---

## 5. auth.service.ts — Serviço de Autenticação

```typescript
import { Injectable, BadRequestException, ForbiddenException, Inject, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PreferenciasService } from '../preferencias/preferencias.service';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import { FIREBASE_APP } from '../firebase/firebase.module';

// Chave secreta para assinar/verificar JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'baza_admin_jwt_secret_2026';

// Estrutura de um OTP guardado em memória
interface OTPCache {
  codigo: string;      // O código de 4 dígitos (ex: "1234")
  tentativas: number;  // Tentativas restantes (começa em 5)
  expiraEm: Date;      // Data de expiração (10 minutos após criação)
}

// Map em memória para guardar OTPs ativos
// Chave = número de telefone, Valor = dados do OTP
// NOTA: se o servidor reiniciar, os OTPs são perdidos
const otpStore = new Map<string, OTPCache>();

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,           // Para ler/criar users
    private readonly preferenciasService: PreferenciasService, // Para ler preferências do admin
    @Inject(FIREBASE_APP) private firebaseApp: admin.app.App,  // Instância do Firebase Admin
  ) {}

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 1: ENVIAR OTP (POST /auth/telefone/enviar-otp)
  // ═══════════════════════════════════════════════════════════
  async enviarOTP(telefone: string) {
    // Remove prefixo +244 e espaços
    const tel = telefone.replace(/^\+244/, '').replace(/\s/g, '');

    // Valida formato: deve começar com 9 e ter 9 dígitos
    if (!/^9\d{8}$/.test(tel)) {
      throw new BadRequestException('Número inválido. Formato: 9XXXXXXXX');
    }

    // Em produção: gera código aleatório de 4 dígitos
    // Em desenvolvimento: usa "1234" fixo para facilitar testes
    const codigo = process.env.NODE_ENV === 'production'
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : '1234';

    // Guarda o OTP no Map
    otpStore.set(tel, {
      codigo,
      tentativas: 5,                                    // 5 tentativas antes de bloquear
      expiraEm: new Date(Date.now() + 10 * 60 * 1000), // Expira em 10 minutos
    });

    // Em produção, aqui integraria Twilio/MSG91 para enviar SMS
    return { message: 'Código enviado', telefone: tel, codigoTeste: codigo };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 2: VERIFICAR OTP (POST /auth/telefone/verificar-otp)
  // ═══════════════════════════════════════════════════════════
  async verificarOTP(telefone: string, codigo: string) {
    const tel = telefone.replace(/^\+244/, '').replace(/\s/g, '');
    const dados = otpStore.get(tel);

    // Verifica se existe e se não expirou
    if (!dados || dados.expiraEm < new Date()) {
      otpStore.delete(tel);
      throw new BadRequestException('Código expirado');
    }

    // Verifica tentativas
    if (dados.tentativas <= 0) {
      otpStore.delete(tel);
      throw new BadRequestException('Muitas tentativas');
    }

    // Verifica se o código coincide
    if (dados.codigo !== codigo) {
      dados.tentativas--;
      throw new BadRequestException('Código incorreto');
    }

    otpStore.delete(tel); // Código correto — remove do Map

    // Procura ou cria utilizador
    let user = await this.usersService.findByPhone(tel);
    if (!user) {
      user = await this.usersService.criar({
        firebaseUid: `phone_${tel}_${Date.now()}`,
        telefone: tel,
        telefoneVerificado: true,
      });
    }

    // Bloquear admin da app móvel
    if (user.role === 'admin') throw new ForbiddenException('Conta de admin');

    // Reativar utilizador eliminado
    if (user.status === 'eliminado') {
      await this.usersService.atualizar(user.id, { status: 'active' as any, role: 'client' as any });
    }

    // Bloquear suspensos
    if (user.status === 'suspended') throw new ForbiddenException('Conta suspensa');

    // Sincronizar firebaseUid com o UUID do user
    if (!user.firebaseUid || user.firebaseUid !== user.id) {
      await this.usersService.atualizar(user.id, { firebaseUid: user.id });
    }

    // Criar Firebase custom token
    const firebaseToken = await admin.auth(this.firebaseApp).createCustomToken(user.id);

    return { message: 'Autenticado', isNewUser: !user.nome, user, firebaseCustomToken: firebaseToken };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 3: ADMIN LOGIN (POST /auth/admin-login)
  // ═══════════════════════════════════════════════════════════
  async adminLogin(telefone: string) {
    // Procura ou cria user admin
    let user = await this.usersService.findByPhone(telefone);
    if (!user) {
      user = await this.usersService.criar({
        firebaseUid: `admin_${telefone}_${Date.now()}`,
        telefone,
        nome: 'Admin', sobrenome: 'Bazza',
      });
    }

    // Garantir role admin
    if (user.role !== 'admin') await this.usersService.atualizar(user.id, { role: 'admin' });

    // Criar JWT token (expira em 7 dias)
    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

    return { message: 'Login admin', user, token };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 4: GOOGLE LOGIN (POST /auth/google)
  // ═══════════════════════════════════════════════════════════
  async loginGoogle(data: { uid: string; email?: string; displayName?: string; photoURL?: string }) {
    let user = await this.usersService.findOneByFirebaseUid(data.uid);

    if (!user) {
      // Criar novo user a partir dos dados do Google
      const partes = (data.displayName || '').split(' ');
      user = await this.usersService.criar({
        firebaseUid: data.uid, email: data.email,
        nome: partes[0] || 'Utilizador', sobrenome: partes.slice(1).join(' ') || '',
      });
    } else if (user.status === 'eliminado') {
      // Reativar conta eliminada
      await this.usersService.atualizar(user.id, { status: 'active' as any, role: 'client' });
    }

    return { message: 'Google login', isNewUser: !user.nome, user };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 5: SINCRONIZAR FIREBASE TOKEN
  // ═══════════════════════════════════════════════════════════
  async sincronizarFirebaseToken(idToken: string) {
    const decoded = await admin.auth(this.firebaseApp).verifyIdToken(idToken);
    const user = await this.usersService.encontrarOuCriar(decoded);
    return { message: 'Token válido', user };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 6: ATUALIZAR PERFIL (PATCH /auth/perfil)
  // ═══════════════════════════════════════════════════════════
  async atualizarPerfil(userId: string, dados: any) {
    const user = await this.usersService.atualizar(userId, dados);
    return { message: 'Perfil atualizado', user };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 7: ESCOLHER ROLE (PATCH /auth/escolher-role)
  // ═══════════════════════════════════════════════════════════
  async escolherRole(userId: string, role: 'cliente' | 'motoqueiro') {
    const dbRole = role === 'cliente' ? 'client' : 'deliver';
    const user = await this.usersService.atualizar(userId, { role: dbRole });
    return { message: `Role: ${role}`, user };
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODO 8: ATUALIZAR FCM TOKEN (PATCH /auth/fcm-token)
  // ═══════════════════════════════════════════════════════════
  async atualizarFcmToken(userId: string, fcmToken: string) {
    await this.usersService.atualizar(userId, { fcmToken });
    return { message: 'Token FCM atualizado' };
  }
}
```

---

## 6. auth.controller.ts — Rotas de Autenticação

```typescript
import { Controller, Post, Get, Patch, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { User } from '../users/entities/user.entity';

// @ApiTags('Auth') → Agrupa os endpoints no Swagger (documentação da API)
@ApiTags('Auth')
// @Controller('auth') → Todos os endpoints começam com /auth
@Controller('auth')
export class AuthController {
  // Injeta o AuthService
  constructor(private readonly authService: AuthService) {}

  // ── ROTA 1: Enviar OTP ──────────────────────────────────────
  // @Public() → Não precisa de autenticação (qualquer um pode pedir OTP)
  // @Post('telefone/enviar-otp') → POST /auth/telefone/enviar-otp
  @Public()
  @Post('telefone/enviar-otp')
  enviarOTP(@Body('telefone') telefone: string) {
    // @Body('telefone') → Extrai o campo "telefone" do body JSON
    return this.authService.enviarOTP(telefone);
  }

  // ── ROTA 2: Verificar OTP ───────────────────────────────────
  // POST /auth/telefone/verificar-otp
  @Public()
  @Post('telefone/verificar-otp')
  verificarOTP(@Body() body: { telefone: string; codigo: string }) {
    // @Body() → Extrai o body completo (telefone + codigo)
    return this.authService.verificarOTP(body.telefone, body.codigo);
  }

  // ── ROTA 3: Admin Login ─────────────────────────────────────
  // POST /auth/admin-login
  @Public()
  @Post('admin-login')
  adminLogin(@Body('telefone') telefone: string) {
    return this.authService.adminLogin(telefone);
  }

  // ── ROTA 4: Login com Google ────────────────────────────────
  // POST /auth/google
  @Public()
  @Post('google')
  loginGoogle(@Body() body: { uid: string; email?: string; displayName?: string; photoURL?: string }) {
    return this.authService.loginGoogle(body);
  }

  // ── ROTA 5: Sincronizar Firebase Token ──────────────────────
  // POST /auth/firebase/sincronizar
  @Public()
  @Post('firebase/sincronizar')
  sincronizarFirebase(@Body('idToken') idToken: string) {
    return this.authService.sincronizarFirebaseToken(idToken);
  }

  // ── ROTA 6: Obter Perfil ────────────────────────────────────
  // GET /auth/perfil → Precisa de autenticação (não tem @Public)
  // @ApiBearerAuth('firebase') → Documenta no Swagger que precisa de token
  // @CurrentUser() → Extrai o user autenticado do pedido
  @ApiBearerAuth('firebase')
  @Get('perfil')
  perfil(@CurrentUser() user: User) {
    return user; // Retorna o objeto User completo
  }

  // ── ROTA 7: Atualizar Perfil ────────────────────────────────
  // PATCH /auth/perfil
  @ApiBearerAuth('firebase')
  @Patch('perfil')
  atualizarPerfil(@CurrentUser() user: User, @Body() body: any) {
    return this.authService.atualizarPerfil(user.id, body);
  }

  // ── ROTA 8: Escolher Role ───────────────────────────────────
  // PATCH /auth/escolher-role
  @ApiBearerAuth('firebase')
  @Patch('escolher-role')
  escolherRole(@CurrentUser() user: User, @Body('role') role: 'cliente' | 'motoqueiro') {
    return this.authService.escolherRole(user.id, role);
  }

  // ── ROTA 9: Atualizar FCM Token ─────────────────────────────
  // PATCH /auth/fcm-token
  @ApiBearerAuth('firebase')
  @Patch('fcm-token')
  atualizarFcmToken(@CurrentUser() user: User, @Body('fcmToken') fcmToken: string) {
    return this.authService.atualizarFcmToken(user.id, fcmToken);
  }
}
```

---

## 7. firebase.module.ts — Módulo Firebase Global

```typescript
import { Module, Global, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Token de injeção — usado para injetar a instância Firebase nos serviços
export const FIREBASE_APP = 'FIREBASE_APP';

// @Global() → Este módulo está disponível em TODA a aplicação
// Não precisa ser importado em cada módulo individualmente
@Global()
@Module({
  providers: [
    {
      // provide → Token de injeção
      provide: FIREBASE_APP,
      // useFactory → Função que cria a instância
      useFactory: () => {
        // Evita erro "App already exists" se o módulo for recarregado
        if (admin.apps.length > 0) return admin.apps[0];

        const logger = new Logger('Firebase');

        try {
          // Corrige as quebras de linha no .env
          // No .env: FIREBASE_PRIVATE_KEY="-----BEGIN...\nMII...\n-----END..."
          // Após replace: "-----BEGIN\nMII...\n-----END..." (reais quebras de linha)
          const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

          // Inicializa o Firebase Admin SDK com as credenciais do .env
          const app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
          });

          logger.log('Firebase inicializado com sucesso');
          return app;
        } catch (error: any) {
          logger.error(`Erro ao inicializar Firebase: ${error.message}`);
          throw error; // Impede o arranque da aplicação se o Firebase falhar
        }
      },
    },
  ],
  exports: [FIREBASE_APP], // Disponível para outros módulos
})
export class FirebaseModule {}
```

---
