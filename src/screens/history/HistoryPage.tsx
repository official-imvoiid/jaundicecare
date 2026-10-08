import { useState } from 'react';
import { formatDateTime } from '../../i18n/locale';
import { useT } from '../../i18n/useT';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Notice } from '../../ui/Notice';
import { Page, PageHeader } from '../../ui/Page';
import { Tag } from '../../ui/Tag';
import { TrendChart } from './TrendChart';

export function HistoryPage() {
  const { screenings, historySaved, openScreening, deleteScreening, clearHistory, go, language } = useApp();
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  const open = (id: string) => {
    openScreening(id);
    go('result');
  };

  return (
    <Page>
      <PageHeader title={t('history.title')} lede={t('history.lede')}>
        {screenings.length > 0 && !confirming && (
          <Button size="sm" onClick={() => setConfirming(true)}>
            {t('history.deleteAll')}
          </Button>
        )}
      </PageHeader>

      {confirming && (
        <Notice tone="danger" role="alert" className="mb-6">
          <p className="font-medium">{t('history.confirmAll', { count: screenings.length })}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearHistory();
                setConfirming(false);
              }}
            >
              {t('history.confirmYes')}
            </Button>
            <Button size="sm" onClick={() => setConfirming(false)}>
              {t('history.confirmNo')}
            </Button>
          </div>
        </Notice>
      )}

      {!historySaved && (
        <Notice tone="warn" className="mb-6">
          {t('history.storageOff')}
        </Notice>
      )}

      {screenings.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <h2 className="h-section">{t('history.empty.title')}</h2>
          <p className="mt-2 text-muted">{t('history.empty.body')}</p>
          <Button variant="primary" className="mt-6" onClick={() => go('check')}>
            {t('home.start')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="p-6 sm:p-8">
            {screenings.length >= 2 ? (
              <TrendChart screenings={screenings} />
            ) : (
              <p className="text-muted">{t('history.chart.needTwo')}</p>
            )}
          </Card>

          <Card>
            <ul className="divide-y divide-line">
              {screenings.map(screening => {
                const signs = screening.analysis.indication === 'signs_seen';
                return (
                  <li key={screening.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-6">
                    <img
                      src={screening.photo}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
                    />
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-medium text-ink">{formatDateTime(screening.takenAt, language)}</p>
                      <p className="numeric text-sm text-muted">
                        {screening.id} · {t(`history.source.${screening.source}`)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Tag tone={signs ? 'warn' : 'brand'}>
                          {signs ? t('history.result.signs') : t('history.result.clear')}
                        </Tag>
                        <span className="numeric text-sm">{t('history.score', { score: screening.analysis.score })}</span>
                        {screening.advice && (
                          <Tag tone={screening.advice === 'urgent' ? 'danger' : 'neutral'}>
                            {t(`advice.${screening.advice}.title`)}
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" onClick={() => open(screening.id)}>
                        {t('history.open')}
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteScreening(screening.id)}
                        aria-label={t('history.deleteAria', { id: screening.id })}
                        className="link text-sm"
                      >
                        {t('history.delete')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </Page>
  );
}
