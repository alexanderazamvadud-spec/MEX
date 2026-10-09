// Validates every content pack in src/content/packs against the JSON schema and
// a few rules the schema cannot express. Run with: npm run check:content
// It also runs in the deployment workflow before the build, so a broken pack
// cannot be published. Exit code 1 on any problem.
//
// To check a draft file outside the packs folder: node scripts/check-content.mjs path/to/file.json
// (the file-name rules are skipped for explicit files).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const schemaPath = join(root, 'src', 'content', 'schema', 'content-pack.schema.json')
const packsDir = join(root, 'src', 'content', 'packs')

const ITEM_KINDS_BY_ACTIVITY = {
  lesson: ['phrase', 'grammar-note', 'dialogue'],
  exercise: ['multiple-choice', 'gap-fill', 'matching', 'ordering'],
  reading: ['reading'],
  listening: ['listening'],
  speaking: ['speaking'],
  'interview-practice': ['interview-question'],
  'writing-checklist': ['writing-task'],
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
// The item schema carries a "kind" discriminator, so Ajv validates each item
// against the one branch matching its declared kind and reports clean errors.
const ajv = new Ajv({ allErrors: true, strict: true, discriminator: true })
const validate = ajv.compile(schema)

const explicitFiles = process.argv.slice(2)
const files = explicitFiles.length
  ? explicitFiles
  : existsSync(packsDir)
    ? readdirSync(packsDir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => join(packsDir, name))
    : []

let problems = 0
function report(file, message) {
  problems++
  console.log(`FAIL  ${file}: ${message}`)
}

// Every approved pathway must have a pack; a deleted or renamed pack must not deploy.
if (!explicitFiles.length) {
  for (const pathway of schema.properties.pathway.enum) {
    if (!files.some((file) => file.endsWith(`${pathway}.json`))) {
      report('src/content/packs', `missing pack ${pathway}.json`)
    }
  }
}

for (const file of files) {
  const label = file.replace(root, '').replace(/^[\\/]/, '')
  const problemsBefore = problems
  let pack
  try {
    pack = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    report(label, `not valid JSON (${error.message})`)
    continue
  }

  if (!validate(pack)) {
    const seen = new Set()
    for (const err of validate.errors) {
      if (err.keyword === 'oneOf' || err.keyword === 'allOf') continue
      const extra = err.params?.allowedValues
        ? ` (${err.params.allowedValues.join(', ')})`
        : err.params?.additionalProperty
          ? ` ("${err.params.additionalProperty}")`
          : ''
      const message = `${err.instancePath || '/'} ${err.message}${extra}`
      if (!seen.has(message)) {
        seen.add(message)
        report(label, message)
      }
    }
    // The rules below rely on the schema-guaranteed shape, so they run only on valid packs.
    console.log(`      ${label}: fix the schema errors above, then run again for the remaining rules`)
    continue
  }

  // Rules beyond the schema.
  const expectedId = file.split(/[\\/]/).pop().replace(/\.json$/, '')
  if (!explicitFiles.length && pack.id !== expectedId) report(label, `pack id "${pack.id}" must match the file name "${expectedId}"`)
  if (!explicitFiles.length && pack.pathway !== expectedId) report(label, `pathway "${pack.pathway}" must match the file name "${expectedId}"`)

  const ids = new Map()
  const seen = (id, where) => {
    if (ids.has(id)) report(label, `duplicate id "${id}" (${where} and ${ids.get(id)})`)
    else ids.set(id, where)
  }
  seen(pack.id, 'pack')

  let items = 0
  for (const unit of pack.units) {
    seen(unit.id, `unit ${unit.id}`)
    for (const activity of unit.activities) {
      seen(activity.id, `activity ${activity.id}`)
      const allowed = ITEM_KINDS_BY_ACTIVITY[activity.type]
      for (const item of activity.items) {
        items++
        seen(item.id, `item ${item.id}`)
        if (!allowed.includes(item.kind)) report(label, `item ${item.id} of kind "${item.kind}" is not allowed in a "${activity.type}" activity`)
        if (item.kind === 'multiple-choice' || item.kind === 'gap-fill') {
          if (!item.options.includes(item.answer)) report(label, `item ${item.id}: answer "${item.answer}" is not one of the options`)
        }
        if (item.kind === 'reading' || item.kind === 'listening') {
          item.questions.forEach((q, index) => {
            if (!q.options.includes(q.answer)) report(label, `item ${item.id} question ${index + 1}: answer "${q.answer}" is not one of the options`)
          })
        }
        if (item.kind === 'gap-fill') {
          const runs = item.sentence.match(/_+/g) || []
          if (runs.length !== 1 || runs[0] !== '___') report(label, `item ${item.id}: the sentence must contain exactly one ___ gap (three underscores)`)
        }
        if (item.kind === 'matching') {
          const lefts = new Set(item.pairs.map((p) => p.left))
          const rights = new Set(item.pairs.map((p) => p.right))
          if (lefts.size !== item.pairs.length || rights.size !== item.pairs.length) report(label, `item ${item.id}: matching sides must be unique`)
        }
      }
    }
  }

  if (problems === problemsBefore) {
    const activities = pack.units.reduce((n, u) => n + u.activities.length, 0)
    console.log(`PASS  ${label}: ${pack.units.length} unit(s), ${activities} activities, ${items} items, status ${pack.content_status}`)
  }
}

if (files.length === 0) report('src/content/packs', 'no content packs found')

console.log(`\n${files.length} pack(s) checked, ${problems} problem(s)`)
process.exit(problems === 0 ? 0 : 1)
