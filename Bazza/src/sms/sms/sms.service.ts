import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Solução para o erro "is not a function": usar require
const AfricasTalking = require('africastalking');

interface CodigoCache {
  codigo: string;
  tentativas: number;
  expiraEm: Date;
}

const codigosPorTelefone: Map<string, CodigoCache> = new Map();

@Injectable()
export class SmsService {
  private logger = new Logger(SmsService.name);
  private sms: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');

    try {
      // Inicialização correta via CommonJS
      const atInstance = AfricasTalking({
        apiKey: apiKey,
        username: username || 'sandbox',
      });
      
      this.sms = atInstance.SMS;
      this.logger.log('✅ Africa\'s Talking carregado com sucesso');
    } catch (error : any) {
      this.logger.error('❌ Erro ao carregar Africa\'s Talking:', error.message);
    }
  }

  async enviarSms(telefone: string, mensagem: string): Promise<boolean> {
    try {
      const telefoneFormatado = this.formatarTelefone(telefone);
      
      const response = await this.sms.send({
        to: [telefoneFormatado],
        message: mensagem,
      });

      this.logger.log(`SMS enviado: ${JSON.stringify(response)}`);
      return true;
    } catch (error : any) {
      this.logger.error(`Erro no envio: ${error.message}`);
      return false;
    }
  }

  async enviarCodigoTelefone(telefone: string): Promise<{ message: string }> {
    if (!telefone.match(/^9\d{8}$/)) {
      throw new BadRequestException('Telefone inválido. Use 9 dígitos.');
    }

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    codigosPorTelefone.set(telefone, { codigo, tentativas: 5, expiraEm });

    const mensagem = `Baza: O teu codigo e ${codigo}. Valido por 10 min.`;
    const enviado = await this.enviarSms(telefone, mensagem);

    if (!enviado) {
      codigosPorTelefone.delete(telefone);
      throw new BadRequestException('Falha ao enviar SMS.');
    }

    return { message: 'Código enviado com sucesso!' };
  }

  async verificarCodigoTelefone(telefone: string, codigoInserido: string) {
    const dados = codigosPorTelefone.get(telefone);

    if (!dados || dados.expiraEm < new Date()) {
      codigosPorTelefone.delete(telefone);
      throw new BadRequestException('Código expirado.');
    }

    if (dados.codigo !== codigoInserido) {
      dados.tentativas--;
      if (dados.tentativas <= 0) {
        codigosPorTelefone.delete(telefone);
        throw new BadRequestException('Tentativas esgotadas.');
      }
      throw new BadRequestException(`Incorreto. Restam ${dados.tentativas} tentativas.`);
    }

    codigosPorTelefone.delete(telefone);
    return { valido: true };
  }

  private formatarTelefone(telefone: string): string {
    let t = telefone.replace(/\s/g, '');
    if (t.startsWith('+244')) return t;
    if (t.startsWith('244')) return `+${t}`;
    return `+244${t}`;
  }
}