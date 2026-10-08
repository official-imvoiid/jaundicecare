import type { Signal } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { cx } from '../../ui/cx';

const MIN_SCALE = 10; // points; keeps a photo with only tiny effects from looking dramatic

// On a phone the label sits on its own line above the bar; from 640 px up it sits beside it
const ROW = 'grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-x-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_2.75rem]';

const signed = (delta: number) => (delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : '0');

/**
 * What raised or lowered the score, as bars on either side of a centre line.
 * Direction and the signed number carry the meaning; colour only repeats it.
 */
export function SignalBars({ signals }: { signals: Signal[] }) {
  const t = useT();
  const scale = Math.max(MIN_SCALE, ...signals.map(signal => Math.abs(signal.delta)));

  if (signals.every(signal => signal.delta === 0)) {
    return <p className="text-[0.9375rem] text-muted">{t('result.why.none')}</p>;
  }

  return (
    <div>
      <ul>
        {signals.map(({ group, delta }) => {
          const label = t(`signal.${group}`);
          const effect =
            delta === 0
              ? ''
              : t(delta > 0 ? 'result.why.raisesBy' : 'result.why.lowersBy', { points: Math.abs(delta) });
          return (
            <li key={group} title={effect ? `${label}. ${effect}` : label} className={cx(ROW, 'py-1.5 text-[0.9375rem]')}>
              <span className="col-span-2 sm:col-span-1">{label}</span>
              <span aria-hidden="true" className="relative block h-3.5">
                <span className="absolute -bottom-1 -top-1 left-1/2 w-px bg-line-strong" />
                {delta !== 0 && (
                  <span
                    className={cx(
                      'absolute bottom-0 top-0',
                      delta > 0 ? 'left-1/2 rounded-r bg-chart-warm' : 'right-1/2 rounded-l bg-chart-good',
                    )}
                    style={{ width: `${(Math.abs(delta) / scale) * 50}%` }}
                  />
                )}
              </span>
              <span className="numeric text-right font-medium text-ink">
                <span aria-hidden="true">{signed(delta)}</span>
                <span className="sr-only">{effect || '0'}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-hidden="true" className={cx(ROW, 'mt-1 text-xs text-muted')}>
        <span className="hidden sm:block" />
        <span className="flex justify-between">
          <span>{t('result.why.lowers')}</span>
          <span>{t('result.why.raises')}</span>
        </span>
        <span />
      </div>
    </div>
  );
}
