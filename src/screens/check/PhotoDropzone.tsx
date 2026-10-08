import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { buttonClass } from '../../ui/buttonClass';
import { cx } from '../../ui/cx';

/** Pick a photo by clicking, by keyboard, or by dropping a file on the box. */
export function PhotoDropzone({ disabled, onFile }: { disabled: boolean; onFile: (file: File) => void }) {
  const t = useT();
  const [dragging, setDragging] = useState(false);

  return (
    <label
      onDragOver={event => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      className={cx(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
        dragging ? 'border-brand bg-brand-tint' : 'border-line-strong bg-surface',
        disabled && 'opacity-60',
      )}
    >
      <ImagePlus className="h-8 w-8 text-muted" aria-hidden="true" />
      <span className="text-lg text-ink">{t('check.drop.title')}</span>
      <span className="text-sm text-muted">{t('check.drop.or')}</span>
      <span className={buttonClass('primary')}>{t('check.drop.button')}</span>
      <span className="text-sm text-muted">{t('check.drop.hint')}</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = ''; // so the same file can be picked again
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
