import { useT } from '../i18n/useT';
import { accuracyFacts, modelVersion } from '../ml/modelInfo';
import { useApp } from '../state/appContext';

export function Footer() {
  const { role, go } = useApp();
  const t = useT();

  const showAccuracy = () => {
    go('home');
    // wait for the home screen to be on the page before scrolling to its section
    window.setTimeout(() => document.getElementById('accuracy')?.scrollIntoView({ block: 'start' }), 0);
  };

  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1080px] space-y-2 px-5 py-8 text-sm text-muted sm:px-6">
        <p className="text-body">{t('footer.disclaimer')}</p>
        <p>{t('footer.privacy')}</p>
        <p>
          {t('footer.model', { version: modelVersion, total: accuracyFacts.total })}{' '}
          {role === 'parent' && (
            <button type="button" onClick={showAccuracy} className="link">
              {t('footer.accuracy')}
            </button>
          )}
        </p>
      </div>
    </footer>
  );
}
