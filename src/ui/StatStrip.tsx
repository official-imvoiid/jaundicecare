interface Stat {
  label: string;
  value: number | string;
  note?: string;
}

/** A row of headline numbers, separated by rules instead of boxes. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-surface px-5 py-4">
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd className="mt-1 text-3xl font-semibold text-ink">{stat.value}</dd>
          {stat.note && <dd className="text-sm text-muted">{stat.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
