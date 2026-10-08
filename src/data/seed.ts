// Demo data. Everything here is invented: the people, pharmacies, phone numbers and registration numbers are not real.

import { asset } from '../app/asset';
import type { AuditLog, Medicine, NotificationItem, Order, Pharmacy, Prescription } from '../domain/types';

export const DEMO_PARENT = {
  name: 'Priya Sharma',
  phone: '+91 90000 12345',
  address: 'B-14, Shastri Nagar, Jaipur, Rajasthan 302016',
};

export const DEMO_PHARMACIST = {
  name: 'Anil Verma, B.Pharm',
  registration: 'RPC-21457',
  pharmacyId: 'pharm_1',
};

export const DEMO_ADMIN = { name: 'Platform admin' };

export const SEED_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharm_1',
    name: 'Sanjeevani Medical Store',
    address: '12 Station Road, Civil Lines, Jaipur',
    phone: '+91 90000 11111',
    distanceKm: 0.8,
    verified: true,
    pharmacistName: 'Anil Verma, B.Pharm',
  },
  {
    id: 'pharm_2',
    name: 'Arogya Pharmacy',
    address: 'Shop 3, Gandhi Chowk, Jaipur',
    phone: '+91 90000 22222',
    distanceKm: 1.6,
    verified: true,
    pharmacistName: 'Meera Nair, M.Pharm',
  },
  {
    id: 'pharm_3',
    name: 'Jeevan Jyoti Chemists',
    address: 'Near District Hospital, MG Road, Jaipur',
    phone: '+91 90000 33333',
    distanceKm: 3.1,
    verified: false,
    pharmacistName: 'Rakesh Gupta, D.Pharm',
  },
];

export const SEED_MEDICINES: Medicine[] = [
  {
    id: 'MED-1',
    name: 'Vitamin D3 drops 400 IU/ml',
    genericName: 'Cholecalciferol',
    category: 'Vitamin supplement',
    pack: '15 ml bottle',
    availableQuantity: 60,
    batchNumber: 'VD-2609',
    expiryDate: '2028-03-31',
    price: 95,
    prescriptionRequired: false,
    pharmacyId: 'pharm_1',
  },
  {
    id: 'MED-2',
    name: 'Paracetamol paediatric drops 100 mg/ml',
    genericName: 'Paracetamol',
    category: 'Fever and pain',
    pack: '15 ml bottle',
    availableQuantity: 45,
    batchNumber: 'PC-2611',
    expiryDate: '2027-11-30',
    price: 38,
    prescriptionRequired: true,
    pharmacyId: 'pharm_1',
  },
  {
    id: 'MED-3',
    name: 'Ursodeoxycholic acid suspension 125 mg/5 ml',
    genericName: 'Ursodeoxycholic acid',
    category: 'Liver and bile',
    pack: '100 ml bottle',
    availableQuantity: 12,
    batchNumber: 'UD-2604',
    expiryDate: '2027-08-31',
    price: 310,
    prescriptionRequired: true,
    pharmacyId: 'pharm_1',
  },
  {
    id: 'MED-4',
    name: 'Zinc oxide nappy cream',
    genericName: 'Zinc oxide',
    category: 'Skin care',
    pack: '20 g tube',
    availableQuantity: 80,
    batchNumber: 'ZN-2607',
    expiryDate: '2028-06-30',
    price: 72,
    prescriptionRequired: false,
    pharmacyId: 'pharm_1',
  },
  {
    id: 'MED-5',
    name: 'Saline nasal drops 0.65%',
    genericName: 'Sodium chloride',
    category: 'Nose care',
    pack: '10 ml bottle',
    availableQuantity: 8,
    batchNumber: 'SN-2602',
    expiryDate: '2027-05-31',
    price: 45,
    prescriptionRequired: false,
    pharmacyId: 'pharm_1',
  },
  {
    id: 'MED-6',
    name: 'ORS sachet 21 g',
    genericName: 'Oral rehydration salts',
    category: 'Rehydration',
    pack: '1 sachet',
    availableQuantity: 150,
    batchNumber: 'OR-2610',
    expiryDate: '2028-01-31',
    price: 22,
    prescriptionRequired: false,
    pharmacyId: 'pharm_1',
  },
];

const samplePrescription = asset('prescription-sample.svg');

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX-9082',
    parentName: DEMO_PARENT.name,
    parentPhone: DEMO_PARENT.phone,
    fileUri: samplePrescription,
    fileName: 'prescription.jpg',
    doctorName: 'Dr. Kavita Rao, MD (Paediatrics)',
    medicines: ['Vitamin D3 drops 400 IU/ml', 'Paracetamol paediatric drops 100 mg/ml'],
    status: 'pending',
    pharmacyId: 'pharm_1',
    createdAt: '2026-10-01T10:15:00+05:30',
  },
  {
    id: 'RX-8821',
    parentName: 'Sunita Yadav',
    parentPhone: '+91 90000 67890',
    fileUri: samplePrescription,
    fileName: 'prescription.jpg',
    doctorName: 'Dr. Imran Khan, MD (Paediatrics)',
    medicines: ['Ursodeoxycholic acid suspension 125 mg/5 ml'],
    status: 'verified',
    pharmacistNotes: 'Dose checked against weight. Parent told how to store the bottle.',
    pharmacyId: 'pharm_1',
    createdAt: '2026-09-29T14:30:00+05:30',
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'JC-10245',
    parentName: DEMO_PARENT.name,
    parentPhone: DEMO_PARENT.phone,
    pharmacyId: 'pharm_1',
    pharmacyName: 'Sanjeevani Medical Store',
    prescriptionId: 'RX-9082',
    items: [
      { name: 'Vitamin D3 drops 400 IU/ml', quantity: 1, price: 95 },
      { name: 'Paracetamol paediatric drops 100 mg/ml', quantity: 1, price: 38 },
    ],
    deliveryAddress: DEMO_PARENT.address,
    status: 'under_review',
    createdAt: '2026-10-01T10:20:00+05:30',
    updatedAt: '2026-10-01T10:20:00+05:30',
  },
  {
    id: 'JC-10246',
    parentName: 'Sunita Yadav',
    parentPhone: '+91 90000 67890',
    pharmacyId: 'pharm_1',
    pharmacyName: 'Sanjeevani Medical Store',
    prescriptionId: 'RX-8821',
    items: [{ name: 'Ursodeoxycholic acid suspension 125 mg/5 ml', quantity: 1, price: 310 }],
    deliveryAddress: '27 Tilak Marg, C-Scheme, Jaipur',
    status: 'out_for_delivery',
    createdAt: '2026-09-29T16:00:00+05:30',
    updatedAt: '2026-09-30T11:00:00+05:30',
  },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTE-1',
    recipientRole: 'pharmacist',
    title: 'New prescription to check',
    message: 'Priya Sharma sent prescription RX-9082.',
    timestamp: '2026-10-01T10:15:00+05:30',
    read: false,
    type: 'prescription',
  },
  {
    id: 'NOTE-2',
    recipientRole: 'pharmacist',
    title: 'Low stock',
    message: 'Saline nasal drops 0.65%: 8 packs left.',
    timestamp: '2026-10-01T08:00:00+05:30',
    read: false,
    type: 'inventory',
  },
  {
    id: 'NOTE-3',
    recipientRole: 'parent',
    title: 'Order received',
    message: 'Order JC-10245 is waiting for the pharmacist to check the prescription.',
    text: { title: 'note.orderReceived.title', message: 'note.orderReceived.body', values: { id: 'JC-10245' } },
    timestamp: '2026-10-01T10:20:00+05:30',
    read: false,
    type: 'order',
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-2',
    user: 'Anil Verma, B.Pharm',
    role: 'pharmacist',
    action: 'Prescription approved',
    details: 'Approved prescription RX-8821 for Sunita Yadav.',
    timestamp: '2026-09-29T15:10:00+05:30',
  },
  {
    id: 'LOG-1',
    user: 'Platform admin',
    role: 'admin',
    action: 'Pharmacy approved',
    details: 'Approved Arogya Pharmacy after checking its licence.',
    timestamp: '2026-09-20T12:00:00+05:30',
  },
];
