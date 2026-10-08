import { useState } from 'react';
import { DEMO_PHARMACIST } from '../../data/seed';
import { useApp } from '../../state/appContext';
import { Card } from '../../ui/Card';
import { Page, PageHeader } from '../../ui/Page';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { StatStrip } from '../../ui/StatStrip';
import { InventoryTab } from './InventoryTab';
import { LOW_STOCK } from './labels';
import { OrdersTab } from './OrdersTab';
import { PrescriptionsTab } from './PrescriptionsTab';

type Tab = 'prescriptions' | 'inventory' | 'orders';

export function PharmacistDashboard() {
  const { pharmacies, prescriptions, medicines, orders } = useApp();
  const [tab, setTab] = useState<Tab>('prescriptions');
  const [pharmacyId, setPharmacyId] = useState(DEMO_PHARMACIST.pharmacyId);

  const verified = pharmacies.filter(pharmacy => pharmacy.verified);
  const pharmacy = verified.find(candidate => candidate.id === pharmacyId) ?? verified[0];

  const rx = prescriptions.filter(p => p.pharmacyId === pharmacy.id);
  const stock = medicines.filter(m => m.pharmacyId === pharmacy.id);
  const mine = orders.filter(o => o.pharmacyId === pharmacy.id);

  return (
    <Page>
      <PageHeader title={pharmacy.name} lede={`${pharmacy.address} · Pharmacist on duty: ${pharmacy.pharmacistName}`}>
        <label className="flex items-center gap-2 text-sm text-muted">
          Pharmacy
          <select
            value={pharmacy.id}
            onChange={event => setPharmacyId(event.target.value)}
            className="rounded-lg border border-line-strong bg-surface py-1.5 pl-2 pr-7 text-sm text-ink"
          >
            {verified.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>

      <StatStrip
        stats={[
          { label: 'Prescriptions to check', value: rx.filter(p => p.status === 'pending').length },
          { label: 'Orders ready to pack', value: mine.filter(o => o.status === 'verified').length },
          { label: 'Orders on the way', value: mine.filter(o => o.status === 'out_for_delivery').length },
          {
            label: 'Medicines low on stock',
            value: stock.filter(m => m.availableQuantity <= LOW_STOCK).length,
            note: `${LOW_STOCK} packs or fewer`,
          },
        ]}
      />

      <div className="mt-8">
        <SegmentedControl
          label="Section"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'prescriptions', label: `Prescriptions (${rx.length})` },
            { value: 'inventory', label: `Stock (${stock.length})` },
            { value: 'orders', label: `Orders (${mine.length})` },
          ]}
        />
      </div>

      <Card className="mt-4 px-5 py-2 sm:px-6">
        {tab === 'prescriptions' && <PrescriptionsTab pharmacyId={pharmacy.id} />}
        {tab === 'inventory' && (
          <div className="py-4">
            <InventoryTab pharmacyId={pharmacy.id} />
          </div>
        )}
        {tab === 'orders' && <OrdersTab pharmacyId={pharmacy.id} />}
      </Card>
    </Page>
  );
}
