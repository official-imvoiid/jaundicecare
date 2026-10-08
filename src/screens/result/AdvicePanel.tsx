import type { AdviceLevel } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { buttonClass } from '../../ui/buttonClass';
import { Notice } from '../../ui/Notice';
import type { Tone } from '../../ui/Notice';

const TONES: Record<AdviceLevel, Tone> = { urgent: 'danger', doctor_today: 'warn', watch: 'brand' };

/** The advice that follows from the warning-sign answers. Urgent advice carries a button that dials 108. */
export function AdvicePanel({ advice }: { advice: AdviceLevel }) {
  const t = useT();

  return (
    <Notice tone={TONES[advice]} role={advice === 'urgent' ? 'alert' : 'status'}>
      <h2 className="text-lg font-semibold">{t(`advice.${advice}.title`)}</h2>
      <p className="mt-1">{t(`advice.${advice}.body`)}</p>
      {advice === 'urgent' && (
        <a href="tel:108" className={buttonClass('danger', 'md', 'no-print mt-3')}>
          {t('advice.urgent.action')}
        </a>
      )}
      <p className="mt-3 text-sm">{t('advice.note')}</p>
    </Notice>
  );
}
