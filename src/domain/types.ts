import type { MessageKey } from '../i18n/en.ts';

export type UserRole = 'parent' | 'pharmacist' | 'admin';
export type Language = 'en' | 'hi';

// ---- Photo check -----------------------------------------------------------

export type QualityIssue = 'too_dark' | 'too_bright' | 'blurry' | 'no_skin';

export interface QualityCheck {
  ok: boolean;
  brightness: number; // 0 - 100
  sharpness: number; // 0 - 100
  skinPercent: number; // 0 - 100, share of the photo the model treated as skin
  issues: QualityIssue[];
}

export type Indication = 'signs_seen' | 'no_signs';

export type SignalGroup =
  | 'skin_yellow'
  | 'skin_pink'
  | 'yellow_pink_balance'
  | 'skin_brightness'
  | 'colour_strength';

export interface Signal {
  group: SignalGroup;
  delta: number; // score points this group adds (+) or removes (-) compared with a typical normal photo
}

export interface Analysis {
  score: number; // 0 - 100, the decision line is always 50
  indication: Indication;
  signals: Signal[];
  modelVersion: string;
}

export type PhotoSource = 'upload' | 'camera' | 'sample';
export type SampleLabel = 'jaundice' | 'normal';

export type AgeBand = 'under_24h' | 'day_1_2' | 'day_3_7' | 'day_8_14' | 'over_14d';
export type YesNo = 'yes' | 'no' | 'not_sure';

export interface WarningAnswers {
  age: AgeBand;
  palms: YesNo;
  feeding: YesNo;
  sleepy: YesNo;
  cry: YesNo;
  stool: YesNo;
  fever: YesNo;
}

export type AdviceLevel = 'urgent' | 'doctor_today' | 'watch';

export interface Screening {
  id: string;
  takenAt: string; // ISO time
  photo: string; // data URL, longest side 512 px
  source: PhotoSource;
  sampleLabel?: SampleLabel; // known diagnosis, demo samples only
  quality: QualityCheck;
  analysis: Analysis;
  answers?: WarningAnswers;
  advice?: AdviceLevel;
}

// ---- Pharmacy --------------------------------------------------------------

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distanceKm: number;
  verified: boolean;
  pharmacistName: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  pack: string;
  availableQuantity: number;
  batchNumber: string;
  expiryDate: string;
  price: number; // rupees
  prescriptionRequired: boolean;
  pharmacyId: string;
}

export type PrescriptionStatus = 'pending' | 'verified' | 'rejected';

export interface Prescription {
  id: string;
  parentName: string;
  parentPhone: string;
  fileUri: string;
  fileName: string;
  doctorName: string;
  medicines: string[];
  status: PrescriptionStatus;
  pharmacistNotes?: string;
  pharmacyId: string;
  createdAt: string;
}

export type OrderStatus = 'under_review' | 'verified' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number | null; // null until the pharmacist confirms the price
}

export interface Order {
  id: string;
  parentName: string;
  parentPhone: string;
  pharmacyId: string;
  pharmacyName: string;
  prescriptionId: string;
  items: OrderItem[];
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

/** Notification text kept as dictionary keys, so a parent reads it in the language they chose. */
export interface NotificationText {
  title: MessageKey;
  message: MessageKey;
  values?: Record<string, string | number>;
}

export interface NotificationItem {
  id: string;
  recipientRole: UserRole;
  title: string; // English; what staff see
  message: string;
  text?: NotificationText; // set on notifications for parents
  timestamp: string;
  read: boolean;
  type: 'screening' | 'prescription' | 'order' | 'inventory';
}

export interface AuditLog {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}
