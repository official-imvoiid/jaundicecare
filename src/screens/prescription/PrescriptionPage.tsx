import { useState } from 'react';
import type { FormEvent } from 'react';
import { FileText } from 'lucide-react';
import { DEMO_PARENT } from '../../data/seed';
import type { Prescription } from '../../domain/types';
import type { MessageKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field, inputClass } from '../../ui/Field';
import { Notice } from '../../ui/Notice';
import { Page, PageHeader } from '../../ui/Page';
import { Tag } from '../../ui/Tag';

type FieldName = 'file' | 'doctor' | 'medicines' | 'address';

const REQUIRED: Record<FieldName, MessageKey> = {
  file: 'rx.file.missing',
  doctor: 'rx.doctor.missing',
  medicines: 'rx.medicines.missing',
  address: 'rx.address.missing',
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PrescriptionPage() {
  const { pharmacies, createPrescription, placeOrder, go } = useApp();
  const t = useT();
  const verified = pharmacies.filter(pharmacy => pharmacy.verified);

  const [file, setFile] = useState<{ name: string; uri: string } | null>(null);
  const [doctor, setDoctor] = useState('');
  const [medicines, setMedicines] = useState('');
  const [pharmacyId, setPharmacyId] = useState(verified[0]?.id ?? '');
  const [address, setAddress] = useState(DEMO_PARENT.address);
  const [missing, setMissing] = useState<FieldName[]>([]);
  const [sent, setSent] = useState<Prescription | null>(null);

  const errorFor = (field: FieldName) => (missing.includes(field) ? t(REQUIRED[field]) : null);

  const chooseFile = async (picked: File | undefined) => {
    if (!picked) return;
    try {
      setFile({ name: picked.name, uri: await readAsDataUrl(picked) });
    } catch {
      setFile(null);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const names = medicines.split('\n').map(line => line.trim()).filter(Boolean);
    const gaps: FieldName[] = [];
    if (!file) gaps.push('file');
    if (!doctor.trim()) gaps.push('doctor');
    if (names.length === 0) gaps.push('medicines');
    if (!address.trim()) gaps.push('address');
    setMissing(gaps);
    if (gaps.length > 0 || !file) return;

    setSent(
      createPrescription({ fileUri: file.uri, fileName: file.name, doctorName: doctor.trim(), medicines: names, pharmacyId }),
    );
  };

  const startAgain = () => {
    setSent(null);
    setFile(null);
    setDoctor('');
    setMedicines('');
  };

  if (sent) {
    const pharmacy = pharmacies.find(p => p.id === sent.pharmacyId);
    return (
      <Page narrow>
        <PageHeader title={t('rx.done.title')} />
        <Notice tone="brand" role="status">
          {t('rx.done.body', { pharmacy: pharmacy?.name ?? '', id: sent.id })}
        </Notice>

        <Card className="mt-6 p-6 sm:p-8">
          <dl className="grid gap-x-6 gap-y-4 text-[0.9375rem] sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="text-muted">{t('rx.summary.doctor')}</dt>
            <dd className="text-ink">{sent.doctorName}</dd>
            <dt className="text-muted">{t('rx.summary.medicines')}</dt>
            <dd className="text-ink">
              <ul className="list-disc pl-5">
                {sent.medicines.map(name => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </dd>
            <dt className="text-muted">{t('rx.summary.status')}</dt>
            <dd>
              <Tag tone="warn">{t('rx.status.pending')}</Tag>
            </dd>
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => {
                placeOrder(sent, address.trim());
                go('orders');
              }}
            >
              {t('rx.done.order')}
            </Button>
            <Button onClick={startAgain}>{t('rx.done.another')}</Button>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page narrow>
      <PageHeader title={t('rx.title')} lede={t('rx.lede')} />

      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} noValidate className="space-y-6">
          <Field label={t('rx.file.label')} htmlFor="rx-file" hint={t('rx.file.hint')} error={errorFor('file')}>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 font-medium text-ink hover:bg-sunken has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
                <FileText className="h-5 w-5 text-muted" aria-hidden="true" />
                {t('rx.file.choose')}
                <input
                  id="rx-file"
                  type="file"
                  accept="image/*,.pdf"
                  aria-describedby="rx-file-note"
                  className="sr-only"
                  onChange={event => void chooseFile(event.target.files?.[0])}
                />
              </label>
              {file && <span className="text-sm text-ink">{t('rx.file.loaded', { name: file.name })}</span>}
            </div>
          </Field>

          <Field label={t('rx.doctor.label')} htmlFor="rx-doctor" error={errorFor('doctor')}>
            <input
              id="rx-doctor"
              type="text"
              value={doctor}
              onChange={event => setDoctor(event.target.value)}
              placeholder={t('rx.doctor.placeholder')}
              aria-describedby="rx-doctor-note"
              aria-invalid={missing.includes('doctor')}
              className={inputClass}
            />
          </Field>

          <Field
            label={t('rx.medicines.label')}
            htmlFor="rx-medicines"
            hint={t('rx.medicines.hint')}
            error={errorFor('medicines')}
          >
            <textarea
              id="rx-medicines"
              rows={3}
              value={medicines}
              onChange={event => setMedicines(event.target.value)}
              placeholder={t('rx.medicines.placeholder')}
              aria-describedby="rx-medicines-note"
              aria-invalid={missing.includes('medicines')}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="h-label mb-2">{t('rx.pharmacy.label')}</legend>
            <div className="space-y-2">
              {verified.map(pharmacy => (
                <label
                  key={pharmacy.id}
                  className="flex items-start gap-3 rounded-lg border border-line-strong bg-surface px-4 py-3 has-checked:border-brand has-checked:bg-brand-tint"
                >
                  <input
                    type="radio"
                    name="pharmacy"
                    value={pharmacy.id}
                    checked={pharmacyId === pharmacy.id}
                    onChange={() => setPharmacyId(pharmacy.id)}
                    className="mt-1.5 accent-brand"
                  />
                  <span>
                    <span className="block font-medium text-ink">{pharmacy.name}</span>
                    <span className="block text-sm text-muted">
                      {pharmacy.address} · {t('home.pharmacy.distance', { km: pharmacy.distanceKm })}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t('rx.address.label')} htmlFor="rx-address" error={errorFor('address')}>
            <textarea
              id="rx-address"
              rows={2}
              value={address}
              onChange={event => setAddress(event.target.value)}
              aria-describedby="rx-address-note"
              aria-invalid={missing.includes('address')}
              className={inputClass}
            />
          </Field>

          <Button type="submit" variant="primary">
            {t('rx.submit')}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
