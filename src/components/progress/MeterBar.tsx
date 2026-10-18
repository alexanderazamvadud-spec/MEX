// A thin bar showing part of a whole. Decorative only: the text next to it carries the figures.
export default function MeterBar({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="h-2.5 rounded-pill bg-track" aria-hidden="true">
      <div className="h-2.5 rounded-pill bg-primary" style={{ width: `${width}%` }} />
    </div>
  )
}
