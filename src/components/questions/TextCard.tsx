// A reading text or listening transcript (MVP-11): English, in a soft card, one paragraph
// per line break in the pack.
export default function TextCard({ title, text }: { title: string; text: string }) {
  return (
    <section lang="en" aria-label={title} className="flex flex-col gap-3 rounded-card bg-surface-soft p-5" data-text="true">
      <h2 className="text-h3">{title}</h2>
      {text.split('\n').filter(Boolean).map((paragraph, index) => (
        <p key={index} className="text-body">
          {paragraph}
        </p>
      ))}
    </section>
  )
}
