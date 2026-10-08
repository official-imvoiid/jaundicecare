import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Screening } from '../../domain/types';
import type { MessageKey } from '../../i18n/en';
import { formatDateTime } from '../../i18n/locale';
import { useT } from '../../i18n/useT';
import { accuracyFacts } from '../../ml/modelInfo';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { cx } from '../../ui/cx';
import { Page } from '../../ui/Page';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { AdvicePanel } from './AdvicePanel';
import { PhotoOverlay } from './PhotoOverlay';
import type { PhotoView } from './PhotoOverlay';
import { ScoreMeter } from './ScoreMeter';
import { SignalBars } from './SignalBars';

/** For a demo sample: how the model's answer compares with the hospital diagnosis. */
function sampleOutcome(screening: Screening): MessageKey | null {
  if (!screening.sampleLabel) return null;
  const signs = screening.analysis.indication === 'signs_seen';
  if (screening.sampleLabel === 'jaundice') return signs ? 'result.sample.match' : 'result.sample.missed';
  return signs ? 'result.sample.falseAlarm' : 'result.sample.match';
}

export function ResultPage() {
  const { currentScreening: screening, go, historySaved, language } = useApp();
  const t = useT();
  const [view, setView] = useState<PhotoView>('photo');

  if (!screening) {
    return (
      <Page narrow className="py-16">
        <h1 className="h-page">{t('result.none.title')}</h1>
        <p className="mt-2 text-muted">{t('result.none.body')}</p>
        <Button variant="primary" className="mt-6" onClick={() => go('check')}>
          {t('home.start')}
        </Button>
      </Page>
    );
  }

  const { analysis, quality, sampleLabel, advice } = screening;
  const signs = analysis.indication === 'signs_seen';
  const outcome = sampleOutcome(screening);
  const VerdictIcon = signs ? AlertTriangle : CheckCircle2;

  return (
    <Page className="pb-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-5 pt-8">
        <Button onClick={() => go('check')}>{t('result.back')}</Button>
        <p className="text-sm text-muted">{historySaved ? t('result.saved') : t('result.notSaved')}</p>
      </div>
      <p className="print-only pb-4 pt-2 font-serif text-2xl text-ink">{t('report.title')}</p>

      <Card className="overflow-hidden">
        <header
          className={cx(
            'border-b px-6 py-6 sm:px-8',
            signs ? 'border-warn-line bg-warn-tint text-warn-ink' : 'border-brand-line bg-brand-tint text-ink',
          )}
        >
          <p className={cx('mb-1.5 flex items-center gap-2 text-sm font-semibold', signs ? 'text-warn' : 'text-brand')}>
            <VerdictIcon className="h-4 w-4" aria-hidden="true" />
            {t('result.label')}
          </p>
          <h1 className={cx('h-section', signs && 'text-warn-ink')}>
            {signs ? t('result.signs.title') : t('result.clear.title')}
          </h1>
          <p className="mt-1.5 max-w-[46em]">{signs ? t('result.signs.body') : t('result.clear.body')}</p>
          <p className="numeric mt-3 text-sm">
            {t('result.meta', { id: screening.id, date: formatDateTime(screening.takenAt, language) })}
          </p>
        </header>

        {/* Advice from the warning-sign questions comes first: it is what the parent should act on */}
        {advice && (
          <div className="border-b border-line p-6 sm:px-8">
            <AdvicePanel advice={advice} />
          </div>
        )}

        {sampleLabel && outcome && (
          <p className="border-b border-line bg-sunken px-6 py-3 text-[0.9375rem] sm:px-8">
            {t('result.sample.intro', { label: t(`result.sample.${sampleLabel}`) })}{' '}
            <strong className="font-semibold text-ink">{t(outcome)}</strong>
          </p>
        )}

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-10">
          <div>
            <PhotoOverlay photo={screening.photo} view={view} />
            <SegmentedControl
              label={t('result.view.label')}
              size="sm"
              stretch
              className="no-print mt-3"
              value={view}
              onChange={setView}
              options={[
                { value: 'photo', label: t('result.view.photo') },
                { value: 'skin', label: t('result.view.skin') },
                { value: 'yellow', label: t('result.view.yellow') },
              ]}
            />
            {view !== 'photo' && (
              <p className="no-print mt-2 text-sm text-muted">
                {view === 'skin' ? t('result.view.skinHint') : t('result.view.yellowHint')}
              </p>
            )}
          </div>

          <div className="space-y-8">
            <ScoreMeter score={analysis.score} indication={analysis.indication} />

            <section>
              <h2 className="h-label text-base">{t('result.why.title')}</h2>
              <p className="mb-3 text-sm text-muted">{t('result.why.body')}</p>
              <SignalBars signals={analysis.signals} />
              <p className="mt-3 text-sm text-muted">{t('result.why.note')}</p>
            </section>
          </div>
        </div>

        <div className="grid border-t border-line md:grid-cols-2">
          <section className="p-6 sm:p-8">
            <h2 className="h-label text-base">{t('result.next.title')}</h2>
            <p className="mt-1.5 text-[0.9375rem]">{signs ? t('result.next.signs') : t('result.next.clear')}</p>
            {advice ? (
              <Button className="no-print mt-4" onClick={() => go('questions')}>
                {t('result.next.change')}
              </Button>
            ) : (
              <Button variant="primary" className="no-print mt-4" onClick={() => go('questions')}>
                {t('result.next.questions')}
              </Button>
            )}
          </section>

          <section className="border-t border-line p-6 sm:p-8 md:border-l md:border-t-0">
            <h2 className="h-label text-base">{t('result.trust.title')}</h2>
            <p className="mt-1.5 text-[0.9375rem]">{t('result.trust.body', accuracyFacts)}</p>
            <p className="mt-1.5 text-[0.9375rem] font-medium text-ink">
              {signs ? t('result.trust.signsNote') : t('result.trust.clearNote')}
            </p>
            <Button className="no-print mt-4" onClick={() => window.print()}>
              {t('result.print')}
            </Button>
          </section>
        </div>
      </Card>

      <p className="numeric mt-4 text-sm text-muted">
        {t('result.quality', {
          brightness: quality.brightness,
          sharpness: quality.sharpness,
          skin: quality.skinPercent,
        })}
      </p>
      <p className="print-only mt-6 text-sm">{t('footer.disclaimer')}</p>
    </Page>
  );
}
