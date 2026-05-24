import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseSyncService } from './database/database-sync.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Adicionar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Sincronizar schema do banco de dados se necessário
  if (process.env.DB_SYNCHRONIZE === 'true') {
    try {
      logger.log('DB_SYNCHRONIZE detectado, sincronizando schema do banco...');
      const syncService = app.get(DatabaseSyncService);
      await syncService.safeSynchronize();
      logger.log('Schema sincronizado com sucesso');
    } catch (error) {
      logger.error('Erro ao sincronizar schema do banco:', error);
      // Não falhar a inicialização da aplicação se a sincronização falhar
      // Pois o schema pode já estar correto
      logger.warn('Continuando inicialização mesmo com erro de sincronização');
    }
  }

  const port = process.env.PORT ?? 3000;
  // No seu main.ts do NestJS
await app.listen(port, '0.0.0.0');

  console.log(`Servidor iniciado em http://localhost:${port}`);

}
void bootstrap();
