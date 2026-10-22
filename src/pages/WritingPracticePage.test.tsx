// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { WritingTaskItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { readiness } from '../learner/readiness.ts'
import { MAX_WRITING_LENGTH } from '../learner/selfAssessment.ts'
import { demonstratedSkills } from '../learner/skills.ts'
import { renderAt, storeWith } from './learnTestUtils.tsx'
import SettingsPage from './SettingsPage.tsx'

const text = en.writing

async function writing() {
  const pack = await loadPack('career-readiness')
  const unit = pack.units.find((item) => item.activities.some((activity) => activity.type === 'writing-checklist'))!
  const activity = unit.activities.find((item) => item.type === 'writing-checklist') as Activity
  const item = activity.items[0] as WritingTaskItem
  return { unit, activity, item, path: `/learn/career-readiness/${unit.id}/${activity.id}` }
}

const button = (name: string) => screen.getByRole('button', { name })

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('WritingPracticePage', () => {
  it('shows the task, the text box, the model on request and the checklist, labelled as a self-assessment', async () => {
    const { activity, item, path } = await writing()
    renderAt(path, storeWith('career-readiness'))
    expect(await screen.findByRole('heading', { level: 1, name: activity.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText(en.home.readiness.label)).toBeTruthy()
    expect(screen.getByText(item.task.en).getAttribute('lang')).toBe('en')
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([text.yourEmail, text.model, text.check])
    const box = screen.getByRole('textbox', { name: text.yourEmail })
    expect(box.getAttribute('maxlength')).toBe(String(MAX_WRITING_LENGTH))
    expect(box.getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.getByText(text.savedNote)).toBeTruthy()
    expect(screen.getAllByRole('checkbox')).toHaveLength(item.checklist.length)
    // The model email stays hidden until asked for, and can be hidden again.
    expect(document.querySelector('[data-model]')).toBeNull()
    fireEvent.click(button(text.showModel))
    expect(document.querySelector('[data-model]')?.textContent).toBe(item.model)
    expect(button(text.hideModel).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(button(text.hideModel))
    expect(document.querySelector('[data-model]')).toBeNull()
  })

  it('saves the email and ticks as a writing self-assessment, completes the activity and shows the summary', async () => {
    const { unit, activity, item, path } = await writing()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    fireEvent.change(await screen.findByRole('textbox', { name: text.yourEmail }), { target: { value: '  Dear Mr Nazarov, I am writing to ask for Friday off.  ' } })
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getAllByRole('checkbox')[2])
    fireEvent.click(button(text.finish))
    const record = store.read()
    expect(record.selfAssessments).toMatchObject([
      {
        kind: 'writing-task',
        pathway: 'career-readiness',
        activityId: activity.id,
        itemId: item.id,
        skills: ['writing'],
        answerText: 'Dear Mr Nazarov, I am writing to ask for Friday off.',
        selfCheck: [true, false, true, false, false],
      },
    ])
    expect(record.completions).toMatchObject([{ unitId: unit.id, activityId: activity.id }])
    expect(screen.getByRole('heading', { level: 2, name: en.summary.completed })).toBeTruthy()
    expect(
      screen.getByText(en.summary.selfCheckRecap.replace('{{n}}', '2').replace('{{total}}', '5')),
    ).toBeTruthy()
    // Writing never counts towards demonstrated skills or readiness.
    expect(demonstratedSkills(record.exerciseResults).every((skill) => skill.answered === 0)).toBe(true)
    expect(readiness(record).sessionsFinished).toBe(0)
  })

  it('saves no text when the box is left empty', async () => {
    const { path } = await writing()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    fireEvent.click(await screen.findByRole('button', { name: text.finish }))
    expect(store.read().selfAssessments[0]).not.toHaveProperty('answerText')
  })

  it('shows the task and checklist in Russian when explanations are on', async () => {
    await act(() => i18n.changeLanguage('ru'))
    const { item, path } = await writing()
    renderAt(path, storeWith('career-readiness', [], 'beginner'))
    expect(await screen.findByText(item.task.ru!)).toBeTruthy()
    expect(screen.getByText(item.checklist[0].ru!)).toBeTruthy()
    expect(screen.getByRole('button', { name: ru.writing.finish })).toBeTruthy()
  })

  it('has its typed email removed by Delete my data', async () => {
    const { path } = await writing()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    fireEvent.change(await screen.findByRole('textbox', { name: text.yourEmail }), { target: { value: 'Dear Mr Nazarov,' } })
    fireEvent.click(button(text.finish))
    expect(store.read().selfAssessments[0].answerText).toBe('Dear Mr Nazarov,')
    cleanup()
    render(
      <LearnerProvider store={store}>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </LearnerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: en.settings.deleteData }))
    fireEvent.click(screen.getByRole('button', { name: en.settings.deleteConfirmYes }))
    expect(await screen.findByText(en.settings.deleted)).toBeTruthy()
    expect(store.read().selfAssessments).toEqual([])
  })
})
