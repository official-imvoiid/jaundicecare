import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/useT';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Notice } from '../../ui/Notice';

interface CameraCaptureProps {
  onCapture: (frame: HTMLCanvasElement) => void;
  onClose: () => void;
}

const cameraSupported = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/** Live camera preview with a button that hands back one frame. The camera is released when this closes. */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(() => !cameraSupported());

  useEffect(() => {
    if (!cameraSupported()) return;
    let stream: MediaStream | null = null;
    let closed = false;

    navigator.mediaDevices
      // the back camera: the photo is of the baby, not of the person holding the phone
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(granted => {
        if (closed) {
          granted.getTracks().forEach(track => track.stop());
          return;
        }
        stream = granted;
        if (video.current) video.current.srcObject = granted;
      })
      .catch(() => setFailed(true));

    return () => {
      closed = true;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capture = () => {
    const source = video.current;
    if (!source || !source.videoWidth) return;
    const frame = document.createElement('canvas');
    frame.width = source.videoWidth;
    frame.height = source.videoHeight;
    frame.getContext('2d')?.drawImage(source, 0, 0);
    onCapture(frame);
  };

  if (failed) {
    return (
      <Notice tone="warn" role="alert">
        <p>{t('check.camera.error')}</p>
        <Button size="sm" className="mt-3" onClick={onClose}>
          {t('check.camera.cancel')}
        </Button>
      </Notice>
    );
  }

  return (
    <Card className="overflow-hidden">
      <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full bg-ink object-cover" />
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">{t('check.camera.hint')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={capture}>
            {t('check.camera.capture')}
          </Button>
          <Button onClick={onClose}>{t('check.camera.cancel')}</Button>
        </div>
      </div>
    </Card>
  );
}
