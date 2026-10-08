import { useState } from 'react';
import type { Prescription } from '../../domain/types';
import { formatDateTime } from '../../i18n/locale';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { inputClass } from '../../ui/Field';
import { Tag } from '../../ui/Tag';
import { RX_STATUS } from './labels';

const isPicture = (prescription: Prescription) =>
  prescription.fileUri.startsWith('data:image') || /\.(svg|png|jpe?g|webp)$/i.test(prescription.fileUri);

function ReviewDialog({ prescription, onClose }: { prescription: Prescription; onClose: () => void }) {
  const { reviewPrescription } = useApp();
  const [notes, setNotes] = useState(prescription.pharmacistNotes ?? '');
  const [needsReason, setNeedsReason] = useState(false);
  const pending = prescription.status === 'pending';

  const approve = () => {
    reviewPrescription(prescription.id, 'verified', notes.trim() || 'Checked and approved.');
    onClose();
  };

  const reject = () => {
    if (!notes.trim()) {
      setNeedsReason(true);
      return;
    }
    reviewPrescription(prescription.id, 'rejected', notes.trim());
    onClose();
  };

  return (
    <Dialog
      title={`Prescription ${prescription.id}`}
      onClose={onClose}
      footer={
        pending ? (
          <>
            <Button onClick={reject}>Do not approve</Button>
            <Button variant="primary" onClick={approve}>
              Approve
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {isPicture(prescription) ? (
          <img
            src={prescription.fileUri}
            alt={`Prescription ${prescription.id} as sent by the parent`}
            className="max-h-80 w-full rounded-lg border border-line bg-sunken object-contain"
          />
        ) : (
          <a href={prescription.fileUri} download={prescription.fileName} className="link self-start">
            Open {prescription.fileName}
          </a>
        )}

        <div className="space-y-4 text-[0.9375rem]">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-muted">Parent</dt>
              <dd className="text-ink">{prescription.parentName}</dd>
              <dd className="numeric text-sm text-muted">{prescription.parentPhone}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Doctor</dt>
              <dd className="text-ink">{prescription.doctorName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Medicines as typed by the parent</dt>
              <dd className="text-ink">
                <ul className="list-disc pl-5">
                  {prescription.medicines.map(name => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <div>
            <label htmlFor="rx-notes" className="h-label mb-1.5 block">
              Notes for the parent
            </label>
            <textarea
              id="rx-notes"
              rows={3}
              value={notes}
              readOnly={!pending}
              onChange={event => {
                setNotes(event.target.value);
                setNeedsReason(false);
              }}
              aria-describedby={needsReason ? 'rx-notes-error' : undefined}
              aria-invalid={needsReason}
              className={inputClass}
            />
            {needsReason && (
              <p id="rx-notes-error" role="alert" className="mt-1.5 text-sm text-danger">
                Write the reason, so the parent knows what to fix.
              </p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function PrescriptionsTab({ pharmacyId }: { pharmacyId: string }) {
  const { prescriptions, language } = useApp();
  const [reviewing, setReviewing] = useState<string | null>(null);

  const mine = prescriptions.filter(prescription => prescription.pharmacyId === pharmacyId);
  const open = mine.find(prescription => prescription.id === reviewing);

  if (mine.length === 0) {
    return <p className="py-8 text-muted">No prescriptions have been sent to this pharmacy.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {mine.map(prescription => {
          const status = RX_STATUS[prescription.status];
          return (
            <li key={prescription.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-4">
              <div className="min-w-[14rem] flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="numeric font-medium text-ink">{prescription.id}</span>
                  <Tag tone={status.tone}>{status.label}</Tag>
                </p>
                <p className="mt-1 text-[0.9375rem]">
                  {prescription.parentName} · {prescription.doctorName}
                </p>
                <p className="text-sm text-muted">{prescription.medicines.join(', ')}</p>
                <p className="numeric text-sm text-muted">Sent {formatDateTime(prescription.createdAt, language)}</p>
              </div>
              <Button
                size="sm"
                variant={prescription.status === 'pending' ? 'primary' : 'secondary'}
                onClick={() => setReviewing(prescription.id)}
              >
                {prescription.status === 'pending' ? 'Check prescription' : 'View'}
              </Button>
            </li>
          );
        })}
      </ul>

      {open && <ReviewDialog prescription={open} onClose={() => setReviewing(null)} />}
    </>
  );
}
