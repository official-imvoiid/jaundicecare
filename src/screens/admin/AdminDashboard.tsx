import { formatDateTime } from '../../i18n/locale';
import { useApp } from '../../state/appContext';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Page, PageHeader } from '../../ui/Page';
import { StatStrip } from '../../ui/StatStrip';
import { tableClass, tdClass, thClass } from '../../ui/tableClass';
import { Tag } from '../../ui/Tag';

const ADVICE_LABEL = { urgent: 'Go to hospital now', doctor_today: 'See a doctor today', watch: 'Keep watching' };
const SOURCE_LABEL = { upload: 'Uploaded photo', camera: 'Camera photo', sample: 'Sample photo' };

export function AdminDashboard() {
  const { screenings, pharmacies, approvePharmacy, auditLogs, language } = useApp();
  const flagged = screenings.filter(screening => screening.analysis.indication === 'signs_seen');
  const waiting = pharmacies.filter(pharmacy => !pharmacy.verified);

  return (
    <Page>
      <PageHeader
        title="Admin dashboard"
        lede="Demo view. It shows the checks saved in this browser and the demo pharmacy data; nothing is sent to a server."
      />

      <StatStrip
        stats={[
          { label: 'Checks saved', value: screenings.length },
          { label: 'Checks with signs of jaundice', value: flagged.length },
          { label: 'Pharmacies waiting for approval', value: waiting.length, note: `${pharmacies.length} pharmacies in total` },
          { label: 'Audit log entries', value: auditLogs.length },
        ]}
      />

      <section className="mt-10">
        <h2 className="h-section mb-4">Checks with signs of jaundice</h2>
        <Card className="px-5 py-2 sm:px-6">
          {flagged.length === 0 ? (
            <p className="py-6 text-muted">No saved check has signs of jaundice.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>Check</th>
                    <th scope="col" className={thClass}>When</th>
                    <th scope="col" className={`${thClass} text-right`}>Score</th>
                    <th scope="col" className={thClass}>Advice from the questions</th>
                    <th scope="col" className={thClass}>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map(screening => (
                    <tr key={screening.id}>
                      <th scope="row" className={`${tdClass} numeric font-medium text-ink`}>{screening.id}</th>
                      <td className={`${tdClass} numeric whitespace-nowrap`}>{formatDateTime(screening.takenAt, language)}</td>
                      <td className={`${tdClass} numeric text-right`}>{screening.analysis.score}</td>
                      <td className={tdClass}>
                        {screening.advice ? (
                          <Tag tone={screening.advice === 'urgent' ? 'danger' : 'neutral'}>{ADVICE_LABEL[screening.advice]}</Tag>
                        ) : (
                          <span className="text-muted">Questions not answered</span>
                        )}
                      </td>
                      <td className={tdClass}>{SOURCE_LABEL[screening.source]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="h-section mb-4">Pharmacies</h2>
        <Card className="px-5 sm:px-6">
          <ul className="divide-y divide-line">
            {pharmacies.map(pharmacy => (
              <li key={pharmacy.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{pharmacy.name}</span>
                    <Tag tone={pharmacy.verified ? 'brand' : 'warn'}>{pharmacy.verified ? 'Approved' : 'Waiting for approval'}</Tag>
                  </p>
                  <p className="text-sm text-muted">
                    {pharmacy.address} · {pharmacy.pharmacistName}
                  </p>
                </div>
                {!pharmacy.verified && (
                  <Button size="sm" variant="primary" onClick={() => approvePharmacy(pharmacy.id)}>
                    Approve
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="h-section mb-4">Audit log</h2>
        <Card className="px-5 py-2 sm:px-6">
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>When</th>
                  <th scope="col" className={thClass}>Who</th>
                  <th scope="col" className={thClass}>Action</th>
                  <th scope="col" className={thClass}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(entry => (
                  <tr key={entry.id}>
                    <td className={`${tdClass} numeric whitespace-nowrap`}>{formatDateTime(entry.timestamp, language)}</td>
                    <td className={tdClass}>{entry.user}</td>
                    <td className={`${tdClass} font-medium text-ink`}>{entry.action}</td>
                    <td className={tdClass}>{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </Page>
  );
}
