import type { QualityCheck } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { Notice } from '../../ui/Notice';

/** Shown instead of a result when a photo is too dark, too bright, blurred or has no skin in it. */
export function QualityProblem({ photo, quality }: { photo: string; quality: QualityCheck }) {
  const t = useT();

  return (
    <Notice tone="warn" role="alert" title={t('check.problem.title')}>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row">
        <img
          src={photo}
          alt={t('check.problem.alt')}
          className="h-28 w-28 shrink-0 rounded-lg border border-warn-line object-cover"
        />
        <div>
          <p>{t('check.problem.body')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 font-medium">
            {quality.issues.map(issue => (
              <li key={issue}>{t(`check.problem.${issue}`)}</li>
            ))}
          </ul>
          <p className="numeric mt-3 text-sm">
            {t('check.problem.readings', {
              brightness: quality.brightness,
              sharpness: quality.sharpness,
              skin: quality.skinPercent,
            })}
          </p>
        </div>
      </div>
    </Notice>
  );
}
