import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdviceLevel, AgeBand, YesNo } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { adviseFrom, completeAnswers, WARNING_SIGNS } from '../../logic/advice';
import type { WarningSign } from '../../logic/advice';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup';
import { Notice } from '../../ui/Notice';
import { Page, PageHeader } from '../../ui/Page';
import { AdvicePanel } from '../result/AdvicePanel';

const AGES: AgeBand[] = ['under_24h', 'day_1_2', 'day_3_7', 'day_8_14', 'over_14d'];
const ANSWERS: YesNo[] = ['yes', 'no', 'not_sure'];

export function QuestionsPage() {
  const { currentScreening, attachAnswers, go } = useApp();
  const t = useT();
  const saved = currentScreening?.answers;

  // Nothing is pre-filled: an answer nobody gave must never count
  const [age, setAge] = useState<AgeBand | null>(saved?.age ?? null);
  const [signs, setSigns] = useState<Partial<Record<WarningSign, YesNo>>>(saved ?? {});
  const [advice, setAdvice] = useState<AdviceLevel | null>(null);
  const [incomplete, setIncomplete] = useState(false);
  const adviceRegion = useRef<HTMLDivElement>(null);

  const indication = currentScreening?.analysis.indication ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const answers = completeAnswers(age, signs);
    if (!answers) {
      setIncomplete(true);
      setAdvice(null);
      return;
    }
    const level = adviseFrom(answers, indication);
    setIncomplete(false);
    setAdvice(level);
    if (currentScreening) attachAnswers(currentScreening.id, answers, level);
    // bring the advice into view and tell screen readers about it
    window.setTimeout(() => {
      adviceRegion.current?.scrollIntoView({ block: 'start' });
      adviceRegion.current?.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <Page narrow>
      <PageHeader title={t('questions.title')} lede={t('questions.lede')} />

      <div ref={adviceRegion} tabIndex={-1} className="scroll-mt-6 outline-none">
        {advice && (
          <div className="mb-8 space-y-4">
            <AdvicePanel advice={advice} />
            {currentScreening && <Button onClick={() => go('result')}>{t('questions.back')}</Button>}
          </div>
        )}
      </div>

      <p className="mb-6 text-[0.9375rem] text-muted">
        {indication === 'signs_seen'
          ? t('questions.photo.signs')
          : indication === 'no_signs'
            ? t('questions.photo.clear')
            : t('questions.photo.none')}
      </p>

      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-7">
          <ChoiceGroup
            legend={t('questions.age')}
            name="age"
            value={age}
            onChange={setAge}
            options={AGES.map(value => ({ value, label: t(`age.${value}`) }))}
          />

          {WARNING_SIGNS.map(sign => (
            <ChoiceGroup
              key={sign}
              legend={t(`questions.${sign}`)}
              name={sign}
              value={signs[sign] ?? null}
              onChange={value => setSigns(current => ({ ...current, [sign]: value }))}
              options={ANSWERS.map(value => ({ value, label: t(`answer.${value}`) }))}
            />
          ))}

          {incomplete && (
            <Notice tone="danger" role="alert">
              {t('questions.incomplete')}
            </Notice>
          )}

          <Button type="submit" variant="primary">
            {t('questions.submit')}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
