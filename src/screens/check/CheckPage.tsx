import { useState } from 'react';
import { Camera } from 'lucide-react';
import { asset } from '../../app/asset';
import type { PhotoSource, QualityCheck, SampleLabel } from '../../domain/types';
import type { MessageKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { analyzePhoto } from '../../ml/analyze';
import type { SampleInfo } from '../../ml/modelInfo';
import { loadImage, loadImageFile, storedPhotoOf } from '../../ml/photo';
import type { PhotoElement } from '../../ml/photo';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Notice } from '../../ui/Notice';
import { Page, PageHeader } from '../../ui/Page';
import { CameraCapture } from './CameraCapture';
import { PhotoDropzone } from './PhotoDropzone';
import { QualityProblem } from './QualityProblem';
import { SampleStrip } from './SampleStrip';

const TIPS: MessageKey[] = ['check.tips.item1', 'check.tips.item2', 'check.tips.item3', 'check.tips.item4'];

export function CheckPage() {
  const { addScreening, go } = useApp();
  const t = useT();

  const [working, setWorking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [problem, setProblem] = useState<{ photo: string; quality: QualityCheck } | null>(null);

  /** Measures a photo, then shows the result, or explains why the photo cannot be used. */
  const measure = async (load: () => Promise<PhotoElement>, source: PhotoSource, sampleLabel?: SampleLabel) => {
    setWorking(true);
    setError(null);
    setProblem(null);

    let photo: PhotoElement;
    try {
      photo = await load();
    } catch {
      setError('check.error.unreadable');
      setWorking(false);
      return;
    }

    try {
      const { quality, analysis } = await analyzePhoto(photo);
      const stored = storedPhotoOf(photo);
      if (analysis) {
        addScreening({ photo: stored, source, sampleLabel, quality, analysis });
        go('result');
      } else {
        setProblem({ photo: stored, quality });
      }
    } catch (cause) {
      console.error('The photo could not be measured:', cause);
      setError('check.error.failed');
    } finally {
      setWorking(false);
    }
  };

  const measureFile = (file: File) => measure(() => loadImageFile(file), 'upload');
  const measureSample = (sample: SampleInfo) => measure(() => loadImage(asset(sample.file)), 'sample', sample.label);
  const measureFrame = (frame: HTMLCanvasElement) => {
    setCameraOpen(false);
    void measure(() => Promise.resolve(frame), 'camera');
  };

  return (
    <Page>
      <PageHeader title={t('check.title')} lede={t('check.lede')} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <p aria-live="polite" className={working ? 'font-medium text-ink' : 'sr-only'}>
            {working ? t('check.analysing') : ''}
          </p>

          {error && (
            <Notice tone="danger" role="alert">
              {t(error)}
            </Notice>
          )}

          {problem && <QualityProblem photo={problem.photo} quality={problem.quality} />}

          {cameraOpen ? (
            <CameraCapture onCapture={measureFrame} onClose={() => setCameraOpen(false)} />
          ) : (
            <>
              <PhotoDropzone disabled={working} onFile={measureFile} />
              <Button disabled={working} onClick={() => setCameraOpen(true)}>
                <Camera className="h-5 w-5" aria-hidden="true" />
                {t('check.camera.open')}
              </Button>
            </>
          )}

          <div className="border-t border-line pt-6">
            <SampleStrip disabled={working} onPick={measureSample} />
          </div>
        </div>

        <aside className="lg:border-l lg:border-line lg:pl-8">
          <h2 className="h-label text-base">{t('check.tips.title')}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
            {TIPS.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </aside>
      </div>
    </Page>
  );
}
