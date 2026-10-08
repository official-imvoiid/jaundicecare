import { formatRupees } from '../../i18n/locale';
import { nextOrderStatus, orderTotal } from '../../logic/pharmacy';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Tag } from '../../ui/Tag';
import { NEXT_STEP_LABEL, ORDER_STATUS } from './labels';

export function OrdersTab({ pharmacyId }: { pharmacyId: string }) {
  const { orders, advanceOrder } = useApp();
  const mine = orders.filter(order => order.pharmacyId === pharmacyId);

  if (mine.length === 0) {
    return <p className="py-8 text-muted">No orders have been placed with this pharmacy.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {mine.map(order => {
        const status = ORDER_STATUS[order.status];
        const canAdvance = nextOrderStatus(order.status) !== null;
        return (
          <li key={order.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-4">
            <div className="min-w-[14rem] flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="numeric font-medium text-ink">{order.id}</span>
                <Tag tone={status.tone}>{status.label}</Tag>
              </p>
              <p className="mt-1 text-[0.9375rem]">
                {order.parentName} · <span className="numeric">{order.parentPhone}</span>
              </p>
              <p className="text-sm text-muted">{order.deliveryAddress}</p>
              <p className="text-sm text-muted">{order.items.map(item => item.name).join(', ')}</p>
              <p className="numeric mt-1 text-sm font-medium text-ink">
                {formatRupees(orderTotal(order.items))}
                {order.items.some(item => item.price === null) && ' plus items without a price yet'}
              </p>
            </div>
            {canAdvance ? (
              <Button size="sm" variant="primary" onClick={() => advanceOrder(order.id)}>
                {NEXT_STEP_LABEL[order.status]}
              </Button>
            ) : (
              order.status === 'under_review' && (
                <p className="max-w-[14rem] text-sm text-muted">
                  Check prescription <span className="numeric">{order.prescriptionId}</span> first.
                </p>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
