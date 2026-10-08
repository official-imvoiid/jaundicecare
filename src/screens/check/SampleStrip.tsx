import { asset } from '../../app/asset';
import { useT } from '../../i18n/useT';
import { samples } from '../../ml/modelInfo';
import type { SampleInfo } from '../../ml/modelInfo';

/** Real photos that were kept out of training, for trying the app without a baby nearby. */
export function SampleStrip({ disabled, onPick }: { disabled: boolean; onPick: (sample: SampleInfo) => void }) {
  const t = useT();

  return (
    <section id="samples" aria-labelledby="samples-title" className="scroll-mt-6">
      <h2 id="samples-title" className="h-label text-base">
        {t('check.samples.title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('check.samples.body')}</p>
      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {samples.map((sample, index) => (
          <li key={sample.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(sample)}
              className="group block w-full text-left disabled:opacity-60"
            >
              <img
                src={asset(sample.file)}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-lg border border-line object-cover group-hover:border-brand"
              />
              <span className="mt-1.5 block text-sm text-body group-hover:text-ink">
                {t('check.samples.item', { n: index + 1 })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
