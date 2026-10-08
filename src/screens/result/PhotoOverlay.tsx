import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/useT';
import { ANALYSIS_SIZE, extractFeatures } from '../../ml/features';
import { yellowRange } from '../../ml/modelInfo';
import { buildOverlay } from '../../ml/overlay';
import { analysisPixels, loadImage } from '../../ml/photo';
import { cx } from '../../ui/cx';

export type PhotoView = 'photo' | 'skin' | 'yellow';

interface SkinMaps {
  skin: Uint8Array;
  bStar: Float64Array;
}

/**
 * The checked photo, optionally with a veil showing what the model measured.
 * The overlay is drawn at the analysis size and stretched over the photo, which
 * lines up because the analysis squeezes the whole photo into that square.
 */
export function PhotoOverlay({ photo, view }: { photo: string; view: PhotoView }) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [maps, setMaps] = useState<SkinMaps | null>(null);

  useEffect(() => {
    let stale = false;
    loadImage(photo)
      .then(image => {
        if (stale) return;
        const { skin, bStar } = extractFeatures(analysisPixels(image), ANALYSIS_SIZE * ANALYSIS_SIZE);
        setMaps({ skin, bStar });
      })
      .catch(() => setMaps(null));
    return () => {
      stale = true;
    };
  }, [photo]);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context || !maps || view === 'photo') return;
    const pixels = buildOverlay(view, maps.skin, maps.bStar, yellowRange);
    const image = context.createImageData(ANALYSIS_SIZE, ANALYSIS_SIZE);
    image.data.set(pixels);
    context.putImageData(image, 0, 0);
  }, [maps, view]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-sunken">
      <img src={photo} alt={t('result.photo.alt')} className="block w-full" />
      <canvas
        ref={canvas}
        width={ANALYSIS_SIZE}
        height={ANALYSIS_SIZE}
        aria-hidden="true"
        className={cx('absolute inset-0 h-full w-full', (view === 'photo' || !maps) && 'hidden')}
      />
    </div>
  );
}
