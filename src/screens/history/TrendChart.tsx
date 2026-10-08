import { useState } from 'react';
import type { Screening } from '../../domain/types';
import { formatDateTime, formatDay, formatTime, isSameDay } from '../../i18n/locale';
import { useT } from '../../i18n/useT';
import { useApp } from '../../state/appContext';

// Drawing area in SVG units; the chart scales with its container
const WIDTH = 640;
const HEIGHT = 210;
const LEFT = 34;
const RIGHT = 40;
const TOP = 14;
const BOTTOM = 30;
const TICKS = [0, 50, 100];

/** Score of every saved check, oldest to newest, against the decision line at 50. */
export function TrendChart({ screenings }: { screenings: Screening[] }) {
  const { language } = useApp();
  const t = useT();
  const [active, setActive] = useState<number | null>(null);

  const points = [...screenings].reverse(); // history is newest first
  const last = points.length - 1;
  const x = (index: number) => LEFT + (last === 0 ? 0.5 : index / last) * (WIDTH - LEFT - RIGHT);
  const y = (score: number) => TOP + (1 - score / 100) * (HEIGHT - TOP - BOTTOM);
  const resultOf = (screening: Screening) =>
    screening.analysis.indication === 'signs_seen' ? t('history.result.signs') : t('history.result.clear');

  const shown = active === null ? null : points[active];

  // Checks made on one day are told apart by time, checks over several days by date
  const axisLabel = isSameDay(points[0].takenAt, points[last].takenAt) ? formatTime : formatDay;

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="h-label text-base">{t('history.chart.title')}</span>
        <span className="flex gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-chart-warm" />
            {t('history.result.signs')}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-chart-good" />
            {t('history.result.clear')}
          </span>
        </span>
      </figcaption>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('history.chart.aria')} className="h-auto w-full">
          {TICKS.map(tick => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={WIDTH - RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 50 ? 'var(--color-line-strong)' : 'var(--color-chart-grid)'}
                strokeWidth={1}
              />
              <text x={LEFT - 8} y={y(tick) + 4} textAnchor="end" fontSize={12} fill="var(--color-muted)">
                {tick}
              </text>
            </g>
          ))}
          <polyline
            points={points.map((screening, index) => `${x(index)},${y(screening.analysis.score)}`).join(' ')}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* drawn after the line, with a surface-coloured halo, so the line never strikes through it */}
          <text
            x={LEFT + 2}
            y={y(50) - 6}
            fontSize={12}
            fill="var(--color-muted)"
            stroke="var(--color-surface)"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {t('history.chart.line')}
          </text>

          {points.map((screening, index) => (
            <g
              key={screening.id}
              tabIndex={0}
              role="img"
              aria-label={`${formatDateTime(screening.takenAt, language)}: ${t('history.score', { score: screening.analysis.score })}, ${resultOf(screening)}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="outline-none"
            >
              {/* generous invisible target so the dot is easy to hover or tap */}
              <circle cx={x(index)} cy={y(screening.analysis.score)} r={14} fill="transparent" />
              <circle
                cx={x(index)}
                cy={y(screening.analysis.score)}
                r={active === index ? 7 : 5}
                fill={screening.analysis.indication === 'signs_seen' ? 'var(--color-chart-warm)' : 'var(--color-chart-good)'}
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            </g>
          ))}

          {/* the newest value is the only one labelled on the chart itself */}
          <text
            x={x(last) + 12}
            y={y(points[last].analysis.score) + 4}
            fontSize={13}
            fontWeight={600}
            fill="var(--color-ink)"
          >
            {points[last].analysis.score}
          </text>

          <text x={x(0)} y={HEIGHT - 8} textAnchor="start" fontSize={12} fill="var(--color-muted)">
            {axisLabel(points[0].takenAt, language)}
          </text>
          {last > 0 && (
            <text x={x(last)} y={HEIGHT - 8} textAnchor="end" fontSize={12} fill="var(--color-muted)">
              {axisLabel(points[last].takenAt, language)}
            </text>
          )}
        </svg>

        {shown && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max max-w-[14rem] rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            style={{
              left: `${(x(active) / WIDTH) * 100}%`,
              top: `${(y(shown.analysis.score) / HEIGHT) * 100}%`,
              transform: `translate(${active > last / 2 ? '-100%' : '0'}, calc(-100% - 12px))`,
            }}
          >
            <span className="block text-muted">{formatDateTime(shown.takenAt, language)}</span>
            <span className="block font-medium text-ink">
              {t('history.score', { score: shown.analysis.score })} · {resultOf(shown)}
            </span>
          </div>
        )}
      </div>
    </figure>
  );
}
