import type { Medicine, NotificationItem, Order, OrderItem, OrderStatus, UserRole } from '../domain/types.ts';

const ORDER_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  verified: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

/** The status a pharmacist can move an order to next, or null when there is none. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return ORDER_FLOW[status] ?? null;
}

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Order lines for the medicines a parent typed. A line gets a price when the
 * chosen pharmacy stocks a medicine whose name contains what was typed, or
 * whose generic name appears in it; otherwise the pharmacist confirms the price.
 */
export function orderItemsFrom(typedNames: string[], inventory: Medicine[], pharmacyId: string): OrderItem[] {
  const stock = inventory.filter(medicine => medicine.pharmacyId === pharmacyId);
  return typedNames
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => {
      const typed = normalise(name);
      const match = stock.find(
        medicine => normalise(medicine.name).includes(typed) || typed.includes(normalise(medicine.genericName)),
      );
      return { name, quantity: 1, price: match ? match.price : null };
    });
}

/** Sum of the lines whose price is known. */
export function orderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
}

/** A checked prescription releases (or cancels) the order that was waiting for it. */
export function applyReviewToOrders(
  orders: Order[],
  prescriptionId: string,
  review: 'verified' | 'rejected',
  now: string,
): Order[] {
  return orders.map(order =>
    order.prescriptionId === prescriptionId && order.status === 'under_review'
      ? { ...order, status: review === 'verified' ? 'verified' : 'cancelled', updatedAt: now }
      : order,
  );
}

export function unreadFor(notifications: NotificationItem[], role: UserRole): NotificationItem[] {
  return notifications.filter(notification => !notification.read && notification.recipientRole === role);
}
