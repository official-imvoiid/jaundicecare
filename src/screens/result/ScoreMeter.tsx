import type { Indication } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { cx } from '../../ui/cx';

/** The score against its decision line. The line is always at 50, so the tick sits in the middle. */
export function ScoreMeter({ score, indication }: { score: number; indication: Indication }) {
  const t = useT();
  const signs = indication === 'signs_seen';

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="h-label text-base">{t('result.score.title')}</h2>
        <p className="leading-none">
          <span className="text-5xl font-semibold text-ink">{score}</span>
          <span className="ml-2 text-[0.9375rem] text-muted">{t('result.score.outOf')}</span>
        </p>
      </div>

      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={t('result.score.aria', { score })}
        className={cx('relative mt-4 h-2.5 rounded-full', signs ? 'bg-chart-warm-track' : 'bg-chart-good-track')}
      >
        <div
          className={cx('h-full rounded-full', signs ? 'bg-chart-warm' : 'bg-chart-good')}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
        <div aria-hidden="true" className="absolute -bottom-1.5 -top-1.5 left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
      </div>

      <div aria-hidden="true" className="numeric mt-2 grid grid-cols-3 text-xs text-muted">
        <span>0</span>
        <span className="text-center">{t('result.score.line')}</span>
        <span className="text-right">100</span>
      </div>
    </div>
  );
}
