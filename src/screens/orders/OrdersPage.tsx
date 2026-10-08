import { Check } from 'lucide-react';
import { DEMO_PARENT } from '../../data/seed';
import type { Order, OrderStatus } from '../../domain/types';
import { formatRupees } from '../../i18n/locale';
import { useT } from '../../i18n/useT';
import { orderTotal } from '../../logic/pharmacy';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { buttonClass } from '../../ui/buttonClass';
import { Card } from '../../ui/Card';
import { cx } from '../../ui/cx';
import { Notice } from '../../ui/Notice';
import { Page, PageHeader } from '../../ui/Page';
import { Tag } from '../../ui/Tag';

const STEPS = ['under_review', 'verified', 'preparing', 'out_for_delivery', 'delivered'] as const;
type Step = (typeof STEPS)[number];

const stepIndex = (status: OrderStatus) => STEPS.indexOf(status as Step);

function Progress({ order }: { order: Order }) {
  const t = useT();
  const current = stepIndex(order.status);

  return (
    <ol className="space-y-0">
      {STEPS.map((step, index) => {
        const done = index < current || order.status === 'delivered';
        const now = index === current && order.status !== 'delivered';
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cx('absolute bottom-0 left-[0.6875rem] top-6 w-0.5', index < current ? 'bg-brand' : 'bg-line')}
              />
            )}
            <span
              aria-hidden="true"
              className={cx(
                'relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                done ? 'border-brand bg-brand text-white' : now ? 'border-brand bg-surface' : 'border-line-strong bg-surface',
              )}
            >
              {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {now && <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            <div>
              <p className={cx('font-medium', done || now ? 'text-ink' : 'text-muted')}>
                {t(`orders.step.${step}.title`)}{' '}
                {now && <Tag tone="brand">{t('orders.current')}</Tag>}
                {done && <span className="sr-only">({t('orders.done')})</span>}
              </p>
              <p className="text-sm text-muted">{t(`orders.step.${step}.body`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrdersPage() {
  const { orders, pharmacies, activeOrderId, setActiveOrderId, go } = useApp();
  const t = useT();

  const mine = orders.filter(order => order.parentName === DEMO_PARENT.name);
  const order = mine.find(candidate => candidate.id === activeOrderId) ?? mine[0];

  if (!order) {
    return (
      <Page narrow>
        <PageHeader title={t('orders.title')} lede={t('orders.lede')} />
        <Card className="px-6 py-12 text-center">
          <h2 className="h-section">{t('orders.empty.title')}</h2>
          <p className="mt-2 text-muted">{t('orders.empty.body')}</p>
          <Button variant="primary" className="mt-6" onClick={() => go('prescription')}>
            {t('home.pharmacy.action')}
          </Button>
        </Card>
      </Page>
    );
  }

  const pharmacy = pharmacies.find(candidate => candidate.id === order.pharmacyId);
  const hasUnknownPrice = order.items.some(item => item.price === null);

  return (
    <Page>
      <PageHeader title={t('orders.title')} lede={t('orders.lede')} />

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label={t('orders.choose')}>
          <h2 className="h-label mb-2">{t('orders.choose')}</h2>
          <ul className="space-y-2">
            {mine.map(candidate => (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => setActiveOrderId(candidate.id)}
                  aria-current={candidate.id === order.id ? 'true' : undefined}
                  className={cx(
                    'w-full rounded-lg border px-4 py-3 text-left',
                    candidate.id === order.id ? 'border-brand bg-brand-tint' : 'border-line bg-surface hover:bg-sunken',
                  )}
                >
                  <span className="numeric block font-medium text-ink">{t('orders.order', { id: candidate.id })}</span>
                  <span className="block text-sm text-muted">
                    {candidate.status === 'cancelled'
                      ? t('orders.status.cancelled')
                      : t(`orders.step.${candidate.status}.title`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <Card className="overflow-hidden">
          <header className="border-b border-line px-6 py-5 sm:px-8">
            <h2 className="h-section numeric">{t('orders.order', { id: order.id })}</h2>
            <p className="mt-1 text-muted">{t('orders.from', { pharmacy: order.pharmacyName })}</p>
          </header>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <section>
              <h3 className="h-label mb-4 text-base">{t('orders.progress')}</h3>
              {order.status === 'cancelled' ? (
                <Notice tone="danger">{t('orders.cancelled')}</Notice>
              ) : (
                <Progress order={order} />
              )}
            </section>

            <div className="space-y-7">
              <section>
                <h3 className="h-label mb-2 text-base">{t('orders.items')}</h3>
                <ul className="divide-y divide-line border-y border-line">
                  {order.items.map(item => (
                    <li key={item.name} className="flex items-start justify-between gap-4 py-3">
                      <span>
                        <span className="block text-ink">{item.name}</span>
                        <span className="numeric block text-sm text-muted">{t('orders.qty', { n: item.quantity })}</span>
                      </span>
                      <span className="numeric shrink-0 text-right text-ink">
                        {item.price === null ? (
                          <span className="text-sm text-muted">{t('orders.priceUnknown')}</span>
                        ) : (
                          formatRupees(item.price * item.quantity)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="numeric mt-3 flex justify-between font-semibold text-ink">
                  <span>{t('orders.total')}</span>
                  <span>
                    {formatRupees(orderTotal(order.items))}
                    {hasUnknownPrice && ' +'}
                  </span>
                </p>
              </section>

              <section>
                <h3 className="h-label mb-1 text-base">{t('orders.address')}</h3>
                <p className="text-[0.9375rem]">{order.deliveryAddress}</p>
                {pharmacy && (
                  <a href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} className={buttonClass('secondary', 'sm', 'mt-4')}>
                    {t('orders.call')}
                  </a>
                )}
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
