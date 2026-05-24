import { Plan } from './types';

export const IBAN = 'AO06 0040 0000 7012 3456 1019 1';
export const SUPPORT_PHONE = '+244 923 000 000';

export const PLANS: Plan[] = [
  {
    id: 'daily',
    label: 'Diário',
    price: 1000,
    duration: '1 dia',
    pricePerDay: 1000,
    gradient: ['#3B7BFF', '#5B9BFF'],
    accentColor: '#3B7BFF',
    features: [
      'Acesso por 24 horas',
      'Taxas prioritárias',
      'Suporte básico',
    ],
  },
  {
    id: 'weekly',
    label: 'Semanal',
    price: 5000,
    duration: '7 dias',
    pricePerDay: 714,
    gradient: ['#A855F7', '#C084FC'],
    accentColor: '#A855F7',
    badge: 'Mais Popular',
    savingsLabel: 'Poupa 29%',
    features: [
      'Acesso por 7 dias',
      'Taxas prioritárias +10%',
      'Suporte prioritário',
      'Estatísticas semanais',
    ],
  },
  {
    id: 'monthly',
    label: 'Mensal',
    price: 15000,
    duration: '30 dias',
    pricePerDay: 500,
    gradient: ['#FFB830', '#FFD700'],
    accentColor: '#FFB830',
    badge: 'Melhor Valor',
    savingsLabel: 'Poupa 50%',
    features: [
      'Acesso por 30 dias',
      'Taxas prioritárias +15%',
      'Suporte VIP',
      'Estatísticas avançadas',
      'Acesso antecipado a novidades',
    ],
  },
];