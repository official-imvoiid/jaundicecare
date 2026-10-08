import type { OrderStatus, PrescriptionStatus } from '../../domain/types';
import type { Tone } from '../../ui/Notice';

// Staff screens are English only, so their text lives here instead of the dictionaries.

export const RX_STATUS: Record<PrescriptionStatus, { label: string; tone: Tone }> = {
  pending: { label: 'To check', tone: 'warn' },
  verified: { label: 'Approved', tone: 'brand' },
  rejected: { label: 'Not approved', tone: 'danger' },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  under_review: { label: 'Waiting for prescription check', tone: 'warn' },
  verified: { label: 'Ready to pack', tone: 'brand' },
  preparing: { label: 'Being packed', tone: 'brand' },
  out_for_delivery: { label: 'Out for delivery', tone: 'brand' },
  delivered: { label: 'Delivered', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

/** What the button that moves an order forward says, for each status it can move from. */
export const NEXT_STEP_LABEL: Partial<Record<OrderStatus, string>> = {
  verified: 'Start packing',
  preparing: 'Send out for delivery',
  out_for_delivery: 'Mark delivered',
};

export const LOW_STOCK = 15;
