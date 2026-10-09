import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import Card, { CardButton } from '../components/ui/Card.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'
import { useLearner } from '../learner/useLearner.ts'

// Development-only reference page for the design system. It is excluded from
// production builds by the route guard in src/app/App.tsx.

// Development-only view of the learner record, to test persistence and deletion.
function StorageSection() {
  const { record, update, reset, persistent } = useLearner()
  const now = () => new Date().toISOString()
  return (
    <Section title="Learner storage (dev)">
      <p className="text-small text-ink-muted">
        persistent: {String(persistent)} · completions: {record.completions.length} · exercise results:{' '}
        {record.exerciseResults.length} · self-assessments: {record.selfAssessments.length}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            update((r) => ({
              ...r,
              completions: [
                ...r.completions,
                { pathway: 'general-english', unitId: 'ge-01-meeting-people', activityId: 'ge-01-a1-lesson', completedAt: now() },
              ],
            }))
          }
        >
          Add sample completion
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            update((r) => ({
              ...r,
              exerciseResults: [
                ...r.exerciseResults,
                {
                  pathway: 'general-english',
                  activityId: 'ge-01-a2-exercises',
                  itemId: 'ge-01-a2-q1',
                  skills: ['vocabulary'],
                  correct: true,
                  answeredAt: now(),
                },
              ],
            }))
          }
        >
          Add sample result
        </Button>
        <Button size="sm" variant="destructive" onClick={() => reset()}>
          Reset store
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-panel bg-surface-soft p-4 text-[12px] leading-relaxed">
        {JSON.stringify(record, null, 2)}
      </pre>
    </Section>
  )
}

// Each swatch names a literal utility class so Tailwind emits the token variable.
const colourTokens: Array<{ name: string; className: string }> = [
  { name: 'primary', className: 'bg-primary' },
  { name: 'primary-hover', className: 'bg-primary-hover' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'accent-hover', className: 'bg-accent-hover' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-soft', className: 'bg-surface-soft' },
  { name: 'surface-sky', className: 'bg-surface-sky' },
  { name: 'accent-tint', className: 'bg-accent-tint' },
  { name: 'ink', className: 'bg-ink' },
  { name: 'ink-secondary', className: 'bg-ink-secondary' },
  { name: 'ink-muted', className: 'bg-ink-muted' },
  { name: 'on-primary-muted', className: 'bg-on-primary-muted' },
  { name: 'divider', className: 'bg-divider' },
  { name: 'outline', className: 'bg-outline' },
  { name: 'track', className: 'bg-track' },
  { name: 'track-on-primary', className: 'bg-track-on-primary' },
  { name: 'success-tint', className: 'bg-success-tint' },
  { name: 'success-border', className: 'bg-success-border' },
  { name: 'success-text', className: 'bg-success-text' },
  { name: 'error-tint', className: 'bg-error-tint' },
  { name: 'error-border', className: 'bg-error-border' },
  { name: 'error-text', className: 'bg-error-text' },
]

const typeScale: Array<{ className: string; label: string }> = [
  { className: 'text-wordmark', label: 'wordmark 46' },
  { className: 'text-display', label: 'display 30' },
  { className: 'text-h1', label: 'h1 26' },
  { className: 'text-h2', label: 'h2 24' },
  { className: 'text-h3', label: 'h3 20' },
  { className: 'text-lead', label: 'lead 17' },
  { className: 'text-body', label: 'body 15' },
  { className: 'text-small', label: 'small 13' },
  { className: 'text-label uppercase', label: 'label 12' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <PageContainer className="flex flex-col gap-10 py-8">
      <header className="flex flex-col gap-2">
        <Wordmark as="h1" />
        <p className="text-lead text-ink-secondary">Design system reference (development build only)</p>
      </header>

      <Section title="Apostrophe and accent test">
        <p className="text-small text-ink-muted">
          Uzbek oʻ gʻ (U+02BB) and tutuq belgisi (U+02BC) come from the Noto Sans companion file. Everything else is
          Manrope. See docs/design-system.md for how the Russian stress mark (U+0301) renders.
        </p>
        <p className="text-display" lang="uz">
          Oʻzbekcha, gʻalaba, maʼno
        </p>
        <p className="text-h1" lang="uz">
          Oʻzbekcha, gʻalaba, maʼno
        </p>
        <p className="text-body">
          <span lang="uz">Oʻzbekcha, gʻalaba, maʼno</span> (body text, 15 px)
        </p>
        <p className="text-small text-ink-secondary">
          <span lang="uz">Oʻzbekcha, gʻalaba, maʼno</span> (small text, 13 px)
        </p>
        <p className="text-h3" lang="ru">
          Здра́вствуйте, мо́жно войти́?
        </p>
        <p className="text-body" lang="ru">
          Начнём сегодняшний урок. Ёлка, щука, жёлтый.
        </p>
      </Section>

      <Section title="Colours">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colourTokens.map(({ name, className }) => (
            <li key={name} className="flex flex-col gap-1">
              <div className={`h-14 rounded-panel border border-divider ${className}`} aria-hidden="true" />
              <span className="text-small">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <ul className="flex flex-col gap-3">
          {typeScale.map(({ className, label }) => (
            <li key={label} className="flex flex-col gap-0.5">
              <span className="text-label uppercase text-ink-muted">{label}</span>
              <span className={className}>Learn. Practise. Apply.</span>
              <span className={className} lang="uz">
                Bugun nimani oʻrganamiz?
              </span>
              <span className={className} lang="ru">
                Начнём сегодняшний урок.
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Large 56</Button>
          <Button size="md">Medium 52</Button>
          <Button size="sm">Small 44</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button loading>Loading</Button>
          <Button variant="accent" loading>
            Loading
          </Button>
        </div>
        <Button size="lg" fullWidth>
          Full width on phones
        </Button>
        <p className="text-small text-ink-muted">Press Tab to check the focus ring on each button.</p>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Sample content</Badge>
          <Badge variant="accent">Unit 2 of 4</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="sky">Self-assessment</Badge>
          <Badge variant="success">Correct</Badge>
          <Badge variant="error">Not quite</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <Card variant="primary" className="p-[18px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label uppercase text-on-primary-muted">Today's Mission</span>
            <Badge variant="accent">12 min</Badge>
          </div>
          <p className="text-h3">Introducing yourself: phrases + one speaking task</p>
          <div className="h-2.5 rounded-pill bg-track-on-primary" aria-hidden="true">
            <div className="h-2.5 w-2/5 rounded-pill bg-accent" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="accent" size="sm">
              Start mission
            </Button>
            <span className="text-small text-on-primary">Why this mission?</span>
          </div>
        </Card>
        <Card variant="soft">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label uppercase text-ink-muted">Current Pathway</span>
            <Badge variant="surface">Self-assessment</Badge>
          </div>
          <p className="text-lead font-extrabold">General English · Unit 2</p>
          <div className="h-2.5 rounded-pill bg-track" aria-hidden="true">
            <div className="h-2.5 w-2/5 rounded-pill bg-primary" />
          </div>
          <p className="text-small text-ink-secondary">6 of 15 activities completed</p>
        </Card>
        <Card variant="sky">
          <p className="text-h3">Sky card</p>
          <p className="text-body text-ink-secondary">Used for lesson content panels and quiet information.</p>
          <div>
            <Button variant="secondary" size="sm">
              See pathway
            </Button>
          </div>
        </Card>
        <Card variant="accent-tint">
          <span className="text-label uppercase text-on-accent-tint">Next Event</span>
          <p className="text-body font-extrabold">Mock interview: hotel receptionist</p>
          <p className="text-small text-on-accent-tint">Suggested for Thursday</p>
        </Card>
        {/* A button may only contain phrasing content, so CardButton children are spans. */}
        <CardButton variant="soft">
          <span className="block text-lead font-extrabold">Tappable card</span>
          <span className="block text-small text-ink-secondary">
            Whole card is one button. Hover darkens, focus shows the ring.
          </span>
        </CardButton>
      </Section>

      <Section title="Wordmark">
        <div className="flex flex-wrap items-end gap-6">
          <Wordmark size="lg" />
          <Wordmark size="md" />
        </div>
      </Section>

      <StorageSection />
    </PageContainer>
  )
}
