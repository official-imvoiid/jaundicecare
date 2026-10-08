import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatRupees } from '../../i18n/locale';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, inputClass } from '../../ui/Field';
import { tableClass, tdClass, thClass } from '../../ui/tableClass';
import { Tag } from '../../ui/Tag';
import { LOW_STOCK } from './labels';

const RESTOCK = 20;

const EMPTY_FORM = {
  name: '',
  genericName: '',
  category: '',
  pack: '',
  price: '',
  quantity: '',
  batchNumber: '',
  expiryDate: '',
  prescriptionRequired: false,
};

function AddMedicineDialog({ pharmacyId, onClose }: { pharmacyId: string; onClose: () => void }) {
  const { addMedicine } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const found: typeof errors = {};
    if (!form.name.trim()) found.name = 'Enter the medicine name.';
    if (!form.genericName.trim()) found.genericName = 'Enter the generic name.';
    if (form.price === '' || !Number.isFinite(price) || price < 0) found.price = 'Enter a price of 0 or more.';
    if (form.quantity === '' || !Number.isInteger(quantity) || quantity < 0) {
      found.quantity = 'Enter a whole number of packs.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    addMedicine({
      name: form.name.trim(),
      genericName: form.genericName.trim(),
      category: form.category.trim() || 'Other',
      pack: form.pack.trim() || '1 pack',
      availableQuantity: quantity,
      batchNumber: form.batchNumber.trim() || 'Not recorded',
      expiryDate: form.expiryDate || 'Not recorded',
      price,
      prescriptionRequired: form.prescriptionRequired,
      pharmacyId,
    });
    onClose();
  };

  return (
    <Dialog title="Add a medicine" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Medicine name" htmlFor="med-name" error={errors.name}>
            <input id="med-name" value={form.name} onChange={e => set('name', e.target.value)} aria-describedby="med-name-note" className={inputClass} />
          </Field>
          <Field label="Generic name" htmlFor="med-generic" error={errors.genericName}>
            <input id="med-generic" value={form.genericName} onChange={e => set('genericName', e.target.value)} aria-describedby="med-generic-note" className={inputClass} />
          </Field>
          <Field label="Category" htmlFor="med-category">
            <input id="med-category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Vitamin supplement" className={inputClass} />
          </Field>
          <Field label="Pack" htmlFor="med-pack">
            <input id="med-pack" value={form.pack} onChange={e => set('pack', e.target.value)} placeholder="15 ml bottle" className={inputClass} />
          </Field>
          <Field label="Price (₹)" htmlFor="med-price" error={errors.price}>
            <input id="med-price" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)} aria-describedby="med-price-note" className={inputClass} />
          </Field>
          <Field label="Packs in stock" htmlFor="med-quantity" error={errors.quantity}>
            <input id="med-quantity" inputMode="numeric" value={form.quantity} onChange={e => set('quantity', e.target.value)} aria-describedby="med-quantity-note" className={inputClass} />
          </Field>
          <Field label="Batch number" htmlFor="med-batch">
            <input id="med-batch" value={form.batchNumber} onChange={e => set('batchNumber', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Expiry date" htmlFor="med-expiry">
            <input id="med-expiry" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-[0.9375rem]">
          <input
            type="checkbox"
            checked={form.prescriptionRequired}
            onChange={e => set('prescriptionRequired', e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Needs a prescription
        </label>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Add medicine
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function InventoryTab({ pharmacyId }: { pharmacyId: string }) {
  const { medicines, addStock, deleteMedicine } = useApp();
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const stock = medicines.filter(medicine => medicine.pharmacyId === pharmacyId);

  return (
    <>
      <div className="flex justify-end pb-4">
        <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
          Add a medicine
        </Button>
      </div>

      {stock.length === 0 ? (
        <p className="py-8 text-muted">No medicines are listed for this pharmacy yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>Medicine</th>
                <th scope="col" className={thClass}>Category</th>
                <th scope="col" className={thClass}>Stock</th>
                <th scope="col" className={thClass}>Batch and expiry</th>
                <th scope="col" className={`${thClass} text-right`}>Price</th>
                <th scope="col" className={thClass}>Prescription</th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {stock.map(medicine => (
                <tr key={medicine.id}>
                  <th scope="row" className={`${tdClass} font-normal`}>
                    <span className="block font-medium text-ink">{medicine.name}</span>
                    <span className="block text-sm text-muted">
                      {medicine.genericName} · {medicine.pack}
                    </span>
                  </th>
                  <td className={tdClass}>{medicine.category}</td>
                  <td className={`${tdClass} numeric whitespace-nowrap`}>
                    {medicine.availableQuantity}{' '}
                    {medicine.availableQuantity <= LOW_STOCK && <Tag tone="warn">Low</Tag>}
                  </td>
                  <td className={`${tdClass} numeric text-sm`}>
                    <span className="block">{medicine.batchNumber}</span>
                    <span className="block text-muted">{medicine.expiryDate}</span>
                  </td>
                  <td className={`${tdClass} numeric text-right`}>{formatRupees(medicine.price)}</td>
                  <td className={tdClass}>{medicine.prescriptionRequired ? 'Needed' : 'Not needed'}</td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    {confirming === medicine.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Button size="sm" variant="danger" onClick={() => deleteMedicine(medicine.id)}>
                          Remove
                        </Button>
                        <Button size="sm" onClick={() => setConfirming(null)}>
                          Keep
                        </Button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => addStock(medicine.id, RESTOCK)}
                          aria-label={`Add ${RESTOCK} packs of ${medicine.name}`}
                        >
                          +{RESTOCK}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setConfirming(medicine.id)}
                          aria-label={`Remove ${medicine.name}`}
                          className="link text-sm"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddMedicineDialog pharmacyId={pharmacyId} onClose={() => setAdding(false)} />}
    </>
  );
}
