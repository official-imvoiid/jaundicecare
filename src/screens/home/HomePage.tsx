import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { asset } from '../../app/asset';
import type { MessageKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { accuracyFacts, samples } from '../../ml/modelInfo';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { buttonClass } from '../../ui/buttonClass';
import { Card } from '../../ui/Card';
import { Page } from '../../ui/Page';
import { Tag } from '../../ui/Tag';

// The sample that shows a bare tummy on a white sheet, as the photo tips ask for
const EXAMPLE_PHOTO = samples.find(sample => sample.id === 'sample-5') ?? samples[0];

const STEPS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'home.step1.title', body: 'home.step1.body' },
  { title: 'home.step2.title', body: 'home.step2.body' },
  { title: 'home.step3.title', body: 'home.step3.body' },
];

const URGENT: MessageKey[] = [
  'home.urgent.item1',
  'home.urgent.item2',
  'home.urgent.item3',
  'home.urgent.item4',
  'home.urgent.item5',
  'home.urgent.item6',
];

const FAQ: { q: MessageKey; a: MessageKey }[] = [
  { q: 'home.faq.q1', a: 'home.faq.a1' },
  { q: 'home.faq.q2', a: 'home.faq.a2' },
  { q: 'home.faq.q3', a: 'home.faq.a3' },
  { q: 'home.faq.q4', a: 'home.faq.a4' },
  { q: 'home.faq.q5', a: 'home.faq.a5' },
];

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line py-14">
      <h2 className="h-section mb-6">{title}</h2>
      {children}
    </section>
  );
}

export function HomePage() {
  const { go, pharmacies } = useApp();
  const t = useT();

  const trySample = () => {
    go('check');
    window.setTimeout(() => document.getElementById('samples')?.scrollIntoView({ block: 'center' }), 0);
  };

  return (
    <Page>
      {/* Introduction */}
      <div className="grid items-center gap-10 py-12 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-14 md:py-16">
        <div>
          <p className="mb-3 text-sm text-muted">{t('home.eyebrow')}</p>
          <h1 className="h-display">{t('home.title')}</h1>
          <p className="mt-5 max-w-[34em] text-lg">{t('home.lede')}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button variant="primary" onClick={() => go('check')}>
              {t('home.start')}
            </Button>
            <button type="button" onClick={trySample} className="link">
              {t('home.trySample')}
            </button>
          </div>
          <dl className="mt-10 grid gap-x-6 border-t border-line sm:grid-cols-3">
            <div className="pt-4">
              <dt className="h-label">{t('home.fact.private.title')}</dt>
              <dd className="mt-1 text-sm text-muted">{t('home.fact.private.body')}</dd>
            </div>
            <div className="pt-4">
              <dt className="h-label">{t('home.fact.fast.title')}</dt>
              <dd className="mt-1 text-sm text-muted">{t('home.fact.fast.body')}</dd>
            </div>
            <div className="pt-4">
              <dt className="h-label">{t('home.fact.accuracy.title', { accuracy: accuracyFacts.accuracy })}</dt>
              <dd className="mt-1 text-sm text-muted">{t('home.fact.accuracy.body')}</dd>
            </div>
          </dl>
        </div>

        <Card className="overflow-hidden">
          <img src={asset(EXAMPLE_PHOTO.file)} alt={t('home.photo.alt')} className="aspect-[4/3] w-full object-cover" />
          <div className="px-5 pb-5 pt-4">
            <p className="text-sm text-muted">{t('home.photo.caption')}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
              <li>{t('check.tips.item1')}</li>
              <li>{t('check.tips.item2')}</li>
              <li>{t('check.tips.item3')}</li>
            </ul>
          </div>
        </Card>
      </div>

      <Section title={t('home.steps.title')}>
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span aria-hidden="true" className="font-serif text-4xl leading-none text-brand">
                {index + 1}
              </span>
              <div>
                <h3 className="h-label text-base">{t(step.title)}</h3>
                <p className="mt-1 text-[0.9375rem]">{t(step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Danger signs: the one place on this page that uses red */}
      <section className="border-t border-line py-14">
        <div className="rounded-xl border border-danger-line bg-danger-tint px-6 py-6 text-danger-ink sm:px-8">
          <h2 className="text-lg font-semibold text-danger">{t('home.urgent.title')}</h2>
          <ul className="mt-3 list-disc gap-x-10 space-y-1.5 pl-5 sm:columns-2">
            {URGENT.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="tel:108" className={buttonClass('danger', 'sm')}>
              {t('advice.urgent.action')}
            </a>
            <p className="text-[0.9375rem] font-medium">{t('home.urgent.action')}</p>
          </div>
        </div>
      </section>

      <Section id="accuracy" title={t('home.trust.title')}>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="h-label text-base">{t('home.trust.can.title')}</h3>
            <ul className="mt-3 space-y-2.5">
              {(['home.trust.can.item1', 'home.trust.can.item2', 'home.trust.can.item3'] as const).map(key => (
                <li key={key} className="flex gap-2.5">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="h-label text-base">{t('home.trust.cannot.title')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li className="flex gap-2.5">
                <X className="mt-1 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{t('home.trust.cannot.item1')}</span>
              </li>
              <li className="flex gap-2.5">
                <X className="mt-1 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{t('home.trust.cannot.item2', { missed: accuracyFacts.missed })}</span>
              </li>
              <li className="flex gap-2.5">
                <X className="mt-1 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{t('home.trust.cannot.item3')}</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 max-w-[52em] border-t border-line pt-5 text-[0.9375rem]">
          {t('home.trust.numbers', accuracyFacts)}
        </p>
        <p className="mt-2 max-w-[52em] text-[0.9375rem] text-muted">{t('home.trust.dataset')}</p>
      </Section>

      <Section title={t('home.pharmacy.title')}>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <p>{t('home.pharmacy.body')}</p>
            <Button className="mt-5" onClick={() => go('prescription')}>
              {t('home.pharmacy.action')}
            </Button>
          </div>
          <div>
            <h3 className="h-label mb-2">{t('home.pharmacy.list')}</h3>
            <ul className="divide-y divide-line border-y border-line">
              {pharmacies.map(pharmacy => (
                <li key={pharmacy.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <div>
                    <p className="font-medium text-ink">{pharmacy.name}</p>
                    <p className="text-sm text-muted">
                      {pharmacy.address} · {t('home.pharmacy.distance', { km: pharmacy.distanceKm })}
                    </p>
                  </div>
                  <Tag tone={pharmacy.verified ? 'brand' : 'neutral'}>
                    {pharmacy.verified ? t('home.pharmacy.verified') : t('home.pharmacy.pending')}
                  </Tag>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title={t('home.faq.title')}>
        <div className="max-w-[46em] divide-y divide-line border-y border-line">
          {FAQ.map(item => (
            <details key={item.q} className="group py-4">
              <summary className="flex list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                {t(item.q)}
                <span aria-hidden="true" className="text-xl leading-none text-muted group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-[0.9375rem]">
                {t(item.a, { total: accuracyFacts.total })}
              </p>
            </details>
          ))}
        </div>
      </Section>
    </Page>
  );
}
