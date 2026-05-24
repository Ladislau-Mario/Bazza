export type PlanTier = 'daily' | 'weekly' | 'monthly';
export type PaymentStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface Plan {
  id: PlanTier;
  label: string;
  price: number;           // Kz
  duration: string;        // "1 dia", "7 dias", etc.
  pricePerDay: number;
  gradient: [string, string];
  accentColor: string;
  features: string[];
  badge?: string;          // "Mais Popular", "Melhor Valor"
  savingsLabel?: string;   // "Poupa 30%"
}

export interface PaymentSubmission {
  userId: string;
  planType: PlanTier;
  planLabel: string;
  planPrice: number;
  proofUri: string;        // uri local antes do upload
  proofType: 'image' | 'pdf';
  proofName?: string;
  status: PaymentStatus;
  submittedAt: Date;
}