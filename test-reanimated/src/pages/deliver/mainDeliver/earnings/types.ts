export interface DayData {
  day: number;
  weekday: string;
  earnings: number;
  deliveries: number;
  timeOnline: number; // minutos
  hourlyData: number[]; // índice 0–23
}

export interface Goal {
  label: string;
  tier: 'basic' | 'pro' | 'ninja';
  targetKz: number;
  targetDeliveries: number;
  color: string;
  bonusKz?: number;
}

export interface WeekObjective {
  date: number;         // dia do mês
  weekday: string;
  goals: {
    amount: number;
    orders: number;
  }[];
  bonusScheduled: boolean;
  serviceClass: string;
  hasSticker?: boolean;
}

export interface EarningsSummary {
  totalWeek: number;
  totalDeliveries: number;
  bestDay: DayData;
  avgPerDay: number;
  avgPerDelivery: number;
}
