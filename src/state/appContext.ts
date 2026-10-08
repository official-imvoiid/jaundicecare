import { createContext, useContext } from 'react';
import type {
  AdviceLevel,
  Analysis,
  AuditLog,
  Language,
  Medicine,
  NotificationItem,
  Order,
  Pharmacy,
  PhotoSource,
  Prescription,
  QualityCheck,
  SampleLabel,
  Screening,
  UserRole,
  WarningAnswers,
} from '../domain/types';

export type View =
  | 'home'
  | 'check'
  | 'result'
  | 'questions'
  | 'history'
  | 'prescription'
  | 'orders'
  | 'pharmacist'
  | 'admin';

export interface NewScreening {
  photo: string;
  source: PhotoSource;
  sampleLabel?: SampleLabel;
  quality: QualityCheck;
  analysis: Analysis;
}

export interface NewPrescription {
  fileUri: string;
  fileName: string;
  doctorName: string;
  medicines: string[];
  pharmacyId: string;
}

export interface AppContextValue {
  // Session
  role: UserRole;
  view: View;
  language: Language;
  go: (view: View) => void;
  setRole: (role: UserRole) => void;
  setLanguage: (language: Language) => void;

  // Photo checks
  screenings: Screening[]; // newest first
  currentScreening: Screening | null;
  historySaved: boolean; // false when the browser refuses to store history
  addScreening: (input: NewScreening) => void;
  openScreening: (id: string) => void;
  attachAnswers: (id: string, answers: WarningAnswers, advice: AdviceLevel) => void;
  deleteScreening: (id: string) => void;
  clearHistory: () => void;

  // Pharmacy
  pharmacies: Pharmacy[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  orders: Order[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  activeOrderId: string | null;
  setActiveOrderId: (id: string) => void;
  createPrescription: (input: NewPrescription) => Prescription;
  placeOrder: (prescription: Prescription, deliveryAddress: string) => void;
  reviewPrescription: (id: string, status: 'verified' | 'rejected', notes: string) => void;
  advanceOrder: (id: string) => void;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  addStock: (id: string, quantity: number) => void;
  deleteMedicine: (id: string) => void;
  approvePharmacy: (id: string) => void;
  markNotificationRead: (id: string) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
