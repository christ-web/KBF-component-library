/**
 * Types for `@kbf/sdk`. Mirrors `frontend/src/lib/component-schema.ts`, which is the consumer
 * half of the same contract — a new field type has to be added in both files.
 *
 * These exist purely for editor IntelliSense while writing a `settings.js`. There is no build
 * step: `index.js` is plain ESM that `node` loads directly, which is what lets the compile CLI
 * run without a toolchain.
 */

/** Who edits a group: the ID in the storyboard, or the course dev in Course Dev. */
export type GroupOwner = 'id' | 'dev'

/** `auto` completes on mount (display-only slides); `explicit` waits for `kbf.complete()`. */
export type CompletionMode = 'auto' | 'explicit'

export interface FieldCondition {
  field: string
  eq?: unknown
  neq?: unknown
  truthy?: boolean
}

interface Common {
  label: string
  /** Group key. Omitted inside a repeater — rows inherit the repeater's group. */
  group?: string
  help?: string
  required?: boolean
  /**
   * Answer-key data: XOR-encoded on export and decoded by the runtime before the component
   * sees it, so it is never greppable in the shipped zip nor readable in view-source.
   * Replaces the exporter's hardcoded guessing of answer field names.
   */
  secret?: boolean
  /**
   * Warn — without blocking the save — when this field is left empty, using this message.
   *
   * For a field that is optional to *store* but whose absence costs the learner something.
   * `required` is the wrong tool: it reads as "you must fill this in" in a panel where the ID
   * legitimately saves half-written pages all day. A video or audio track with no VTT is the case
   * this exists for — WCAG 1.2.1 and 1.2.2 are both Level A.
   *
   * Mutually exclusive with `required`, which the SDK enforces: both fire on a blank value.
   */
  warnWhenEmpty?: string
  /**
   * This URL field holds a stored media asset, of this kind. Turns the plain text input into a
   * picker over the series' asset library with an upload beside it, and puts the field on the parts
   * list the Graphic Artist works from.
   *
   * Only meaningful on `f.url`. It does not make the field required — an unfilled slot is exactly
   * what a parts list is for.
   */
  accept?: 'image' | 'audio' | 'video' | 'caption'
  /**
   * Media slots only: keep an empty slot off Graphics' parts list until somebody asks for it.
   */
  optional?: boolean
  /**
   * Image slots only: the `text` / `textarea` field that describes this picture. The ID writes it as
   * the brief; it is the learner's alt text unless Graphics marks the image decorative, in which case
   * the runtime empties it. Render it as the `alt` attribute and the decision takes care of itself.
   */
  altField?: string
  /**
   * Image slots only: the size Graphics should supply, in pixels, at twice the largest size the
   * component draws it. `crop` adds a shape check (and needs `height`). A miss is warned about, never
   * refused.
   */
  size?: { width: number; height?: number; crop?: boolean; note?: string }
  /** Show only when another field matches. */
  visibleWhen?: FieldCondition
  /** Show only while the page's Lock Next is on — for a "must finish this" setting. */
  whenLocked?: boolean
  order?: number
}

export interface TextOpts extends Common {
  default?: string
  placeholder?: string
  maxLength?: number
}
export interface AreaOpts extends Common {
  default?: string
  placeholder?: string
  rows?: number
}
export interface NumberOpts extends Common {
  default?: number
  min?: number
  max?: number
  step?: number
  /** Rendered after the input, e.g. "%" or "sec". */
  unit?: string
}
/**
 * The Graphic Artist may set this field, through `PATCH …/ga-design` and the `edit_ga_fields`
 * permission — the same grant that lets them deliver a file into an `accept` slot.
 *
 * For the settings that are *consequences of the picture*: whether the scrim behind the text is on,
 * which treatment a background gets. `accept` says Graphics supplies the file; this says Graphics
 * tunes what the file does to the slide.
 *
 * Only on `boolean`, `select` and `color`, which is enforced at authoring time. Each has a closed
 * set of legal values, so the server can check what it is handed rather than trusting it — and none
 * of them can hold content an ID or a dev wrote.
 */
interface GaEditable {
  ga?: boolean
}

export interface ColorOpts extends TextOpts, GaEditable {}
export interface BooleanOpts extends Common, GaEditable {
  default?: boolean
}
export interface SelectOpts extends Common, GaEditable {
  default?: string
  options: (string | { value: string; label?: string })[]
}
export interface AssetOpts extends Common {
  kind?: 'image' | 'video' | 'audio'
  /** Required — `false` only for a genuinely decorative asset. WCAG 1.1.1. */
  altRequired: boolean
  default?: { url: string; alt?: string }
}
export interface CorrectPickerOpts extends Common {
  default?: string
  /** Config keys holding the choices to pick between. */
  choiceKeys?: string[]
}
/** Which row field marks the correct answer, and how many rows may carry it. */
export interface AnswerFlag {
  /** Must name one of the repeater's own row fields. */
  field: string
  /** The value that counts as marked. Defaults to `true`. */
  value?: unknown
  /** `single` → exactly one row flagged. `multi` → at least one. */
  mode: 'single' | 'multi'
}
export interface RepeaterOpts extends Common {
  /** Row fields. No nested repeaters, and rows omit `group`. */
  fields: Record<string, LeafField>
  min?: number
  max?: number
  /** Singular row label, e.g. "Question" → "Question 1". */
  itemLabel?: string
  default?: Record<string, unknown>[]
  /**
   * Set when a row field marks the correct answer, so a list with nothing marked — or with two
   * marked where one is meant — is rejected on save instead of grading every attempt wrong.
   * `f.options` does this for its own fixed row shape; a repeater has to be told which field it is.
   */
  answerFlag?: AnswerFlag
}

/** One answer. Its position in the list is its identity — nothing stores an index or a letter. */
export interface AnswerOption {
  text: string
  correct?: boolean
}
export interface OptionsOpts extends Common {
  /** `single` → radio group, exactly one flagged. `multi` → checkboxes, at least one. Default `single`. */
  mode?: 'single' | 'multi'
  /** Defaults to 2, and cannot go below it. */
  min?: number
  /** Defaults to 6, and cannot go above it. */
  max?: number
  /** Singular row label, e.g. "Answer" → "Answer 1". */
  itemLabel?: string
  default?: AnswerOption[]
  /** Not accepted: correctness is secret by virtue of the type. */
  secret?: never
}

export type LeafField = { type: string } & Common
export type Field = { type: string } & Common

export interface FieldBuilders {
  text(opts: TextOpts): Field
  textarea(opts: AreaOpts): Field
  richtext(opts: AreaOpts): Field
  url(opts: TextOpts): Field
  color(opts: ColorOpts): Field
  number(opts: NumberOpts): Field
  boolean(opts: BooleanOpts): Field
  select(opts: SelectOpts): Field
  asset(opts: AssetOpts): Field
  /** Legacy a/b/c/d picker. Prefer `options`, or a repeater with a `secret` boolean. */
  correctPicker(opts: CorrectPickerOpts): Field
  repeater(opts: RepeaterOpts): Field
  /**
   * A 2–6 row answer list where `correct` lives on the row, so it cannot point at an option that
   * doesn't exist. A leaf, which is what lets it sit inside a repeater row — where a nested
   * repeater is rejected.
   */
  options(opts?: OptionsOpts): Field
}

export const f: FieldBuilders

export interface SettingsGroup {
  key: string
  label: string
  owner: GroupOwner
  help?: string
  order?: number
}

export interface ThemeToken {
  token: `--kbf-${string}`
  type?: 'color' | 'length' | 'text'
  label: string
  default?: string
}

export interface SettingsSpec {
  /** Library category, e.g. 'Quiz & Assessment'. Replaces the `LIBRARY_CATEGORIES` constant. */
  category: string
  /** Library card icon name. Replaces the `TEMPLATE_ICONS` constant. */
  icon: string
  /** Defaults to `explicit`. Replaces the player querying `.quiz-btn` / `video.player`. */
  completion?: CompletionMode
  /** `--kbf-*` properties this component reads. Replaces `STYLE_INSPECTOR_JS`'s selector map. */
  styleTokens?: `--kbf-${string}`[]
  groups: SettingsGroup[]
  fields: Record<string, Field>
  /** Per-instance overridable design tokens, surfaced as controls on the instance. */
  theme?: Record<string, ThemeToken>
}

/** The v2 schema stored in `ComponentTemplate.schema`. */
export interface ComponentSchemaJson extends SettingsSpec {
  version: 2
  completion: CompletionMode
}

/** Validate and emit the v2 schema. Throws `SettingsError` on anything malformed. */
export function defineSettings(spec: SettingsSpec): ComponentSchemaJson

export class SettingsError extends Error {}

export const FIELD_TYPES: readonly string[]
export const OWNERS: readonly GroupOwner[]
export const COMPLETION_MODES: readonly CompletionMode[]
/** The house bounds on an answer list: never fewer than 2 options, never more than 6. */
export const OPTION_COUNT: { readonly min: 2; readonly max: 6 }
export const OPTION_MODES: readonly ('single' | 'multi')[]
