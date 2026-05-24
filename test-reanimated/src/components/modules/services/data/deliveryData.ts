// src/components/modules/services/data/deliveryData.ts

export type WeightRange = {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  maxKg: number;
};

export type DeliveryType = {
  id: string;
  label: string;
  icon: string;
  examples: string;
};

export const weightRanges: WeightRange[] = [
  {
    id: 'light',
    label: 'Leve',
    sublabel: 'Menos de 1 kg',
    icon: 'feather-outline',
    maxKg: 1,
  },
  {
    id: 'medium',
    label: 'Normal',
    sublabel: '1 kg – 5 kg',
    icon: 'cube-outline',
    maxKg: 5,
  },
  {
    id: 'heavy',
    label: 'Pesado',
    sublabel: '5 kg – 10 kg',
    icon: 'barbell-outline',
    maxKg: 10,
  },
];

export const deliveryTypes: DeliveryType[] = [
  {
    id: 'document',
    label: 'Documento',
    icon: 'document-text-outline',
    examples: 'Cartas, contratos, facturas, passaportes',
  },
  {
    id: 'food',
    label: 'Comida',
    icon: 'fast-food-outline',
    examples: 'Refeições, lanches, bebidas',
  },
  {
    id: 'clothing',
    label: 'Roupa & Calçado',
    icon: 'shirt-outline',
    examples: 'Roupas, sapatos, acessórios',
  },
  {
    id: 'electronics',
    label: 'Electrónico',
    icon: 'phone-portrait-outline',
    examples: 'Telemóveis, auscultadores, carregadores',
  },
  {
    id: 'medicine',
    label: 'Medicamento',
    icon: 'medkit-outline',
    examples: 'Comprimidos, xaropes, equipamento médico',
  },
  {
    id: 'books',
    label: 'Livros & Papelaria',
    icon: 'book-outline',
    examples: 'Livros, cadernos, material escolar',
  },
  {
    id: 'parts',
    label: 'Peça & Ferramenta',
    icon: 'construct-outline',
    examples: 'Filtros, chaves, peças leves de moto/carro',
  },
  {
    id: 'other',
    label: 'Outro',
    icon: 'ellipsis-horizontal-circle-outline',
    examples: 'Qualquer outro item dentro do limite de 10 kg',
  },
];

// Preço estimado com base no peso e distância
export function calcPrice(distanceMeters: number, weightId: string): string {
  const km = distanceMeters / 1000;
  const base = 500;
  const perKm = 50;
  const weightSurcharge = weightId === 'heavy' ? 200 : weightId === 'medium' ? 100 : 0;
  const total = Math.round(base + km * perKm + weightSurcharge);
  return `${total.toLocaleString('pt-AO')} Kz`;
}
