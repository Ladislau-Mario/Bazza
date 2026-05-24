import { useState, useEffect, useMemo } from 'react';
import { DayData, Goal, EarningsSummary } from '../types';
import api from '../../../../../components/modules/services/api/api';

// ─── Paleta central ───────────────────────────────────────────────────────────
export const C = {
  bg:        '#080C10',
  surface:   '#0F1923',
  card:      '#141E2B',
  card2:     '#1A2535',
  border:    '#FFFFFF0D',
  border2:   '#FFFFFF18',
  blue:      '#3B7BFF',
  blueLight: '#6B9FFF',
  blueDim:   '#3B7BFF1A',
  green:     '#22D07A',
  greenDim:  '#22D07A18',
  red:       '#FF4D6A',
  redDim:    '#FF4D6A18',
  amber:     '#FFB830',
  amberDim:  '#FFB83018',
  cyan:      '#00D4FF',
  cyanDim:   '#00D4FF12',
  purple:    '#A855F7',
  purpleDim: '#A855F718',
  white:     '#FFFFFF',
  muted:     '#8899AA',
  muted2:    '#566070',
  sep:       '#FFFFFF08',
};

export const GOALS: Goal[] = [
  { label: 'Básico', tier: 'basic', targetKz: 8000,  targetDeliveries: 15, color: C.green,  bonusKz: 500  },
  { label: 'Pro',    tier: 'pro',   targetKz: 18000, targetDeliveries: 35, color: C.blue,   bonusKz: 1500 },
  { label: 'Ninja',  tier: 'ninja', targetKz: 30000, targetDeliveries: 56, color: C.amber,  bonusKz: 3000 },
];

// ─── Hook principal ──────────────────────────────────────────────────────────
export function useEarningsData() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGeral, setTotalGeral] = useState(0);
  const [planName, setPlanName] = useState('Free');
  const [planDaysLeft, setPlanDaysLeft] = useState(0);
  const [planActive, setPlanActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Carregar ganhos e plano em paralelo
        const [ganhosRes, planoRes] = await Promise.allSettled([
          api.get('/pedidos/ganhos', { params: { dias: 9 } }),
          api.get('/planos/ativo'),
        ]);

        if (!cancelled && ganhosRes.status === 'fulfilled') {
          const data = ganhosRes.value.data;
          if (data?.dias?.length) {
            const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            setDays(data.dias.map((d: any) => {
              const dateObj = d.date ? new Date(d.date + 'T00:00:00') : null;
              return {
                day: dateObj ? dateObj.getDate() : 0,
                weekday: dateObj ? DIAS_SEMANA[dateObj.getDay()] : '',
                earnings: Math.round(Number(d.total) || 0),
                deliveries: Number(d.count) || 0,
                timeOnline: Number(d.timeOnline) || 0,
                hourlyData: d.hourlyData || Array(24).fill(0),
              };
            }));
            setTotalGeral(Number(data.total) || 0);
          }
        }

        if (!cancelled && planoRes.status === 'fulfilled') {
          const p = planoRes.value.data;
          if (p) {
            setPlanName(p.tipo ? p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1) : 'Free');
            setPlanActive(p.status === 'ativo');
            if (p.expiraEm) {
              const expira = new Date(p.expiraEm);
              const agora = new Date();
              const diffMs = expira.getTime() - agora.getTime();
              setPlanDaysLeft(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar ganhos:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { days, loading, totalGeral, planName, planDaysLeft, planActive };
}

export function useEarningsSummary(days: DayData[]): EarningsSummary {
  return useMemo(() => {
    const totalWeek = days.reduce((s, d) => s + d.earnings, 0);
    const totalDeliveries = days.reduce((s, d) => s + d.deliveries, 0);
    const bestDay = days.reduce((b, d) => d.earnings > b.earnings ? d : b, days[0] || { day: 0, weekday: '', earnings: 0, deliveries: 0, timeOnline: 0, hourlyData: [] });
    return {
      totalWeek,
      totalDeliveries,
      bestDay,
      avgPerDay: days.length > 0 ? Math.round(totalWeek / days.length) : 0,
      avgPerDelivery: totalDeliveries > 0 ? Math.round(totalWeek / totalDeliveries) : 0,
    };
  }, [days]);
}

export function fmtKz(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M Kz`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k Kz`;
  return `${n} Kz`;
}

export function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2,'0')}m`;
}
