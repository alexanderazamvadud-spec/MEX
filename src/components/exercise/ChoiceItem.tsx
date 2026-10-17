import { useId } from 'react'
import type { GapFillItem, MultipleChoiceItem } from '../../content/types.ts'
import OptionCard from './OptionCard.tsx'
import type { ItemViewProps } from './types.ts'

// Multiple choice and gap-fill (MVP-10): the options in pack order as radio cards. For a
// gap-fill the sentence is shown above with its gap, which the chosen option fills.
export default function ChoiceItem({
  item,
  answer,
  onChange,
  checked,
  legendId,
}: ItemViewProps<MultipleChoiceItem | GapFillItem> & { legendId: string }) {
  const name = useId()
  const value = answer.kind === 'choice' ? answer.value : null
  return (
    <fieldset aria-labelledby={legendId} className="flex min-w-0 flex-col gap-3">
      {item.options.map((option) => {
        const selected = value === option
        const mark = !checked ? null : option === item.answer ? 'right' : selected ? 'wrong' : null
        return (
          <OptionCard
            key={option}
            name={name}
            value={option}
            selected={selected}
            mark={mark}
            disabled={checked}
            onSelect={() => onChange({ kind: 'choice', value: option })}
          />
        )
      })}
    </fieldset>
  )
}

/** The gap-fill sentence with its gap, filled with the chosen option when there is one. */
export function GapSentence({ item, value }: { item: GapFillItem; value: string | null }) {
  const [before, ...rest] = item.sentence.split('___')
  const after = rest.join('___')
  return (
    <>
      {before}
      <span
        className={[
          'mx-0.5 inline-block min-w-16 border-b-4 px-1 text-center',
          value ? 'border-primary text-primary' : 'border-outline',
        ].join(' ')}
      >
        {value ?? <span className="sr-only">___</span>}
      </span>
      {after}
    </>
  )
}
