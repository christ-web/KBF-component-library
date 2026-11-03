# KBF component library

This repository is the component library for **KBForge (KBF)**, KnowBe4's course-building platform. A
*component* is one reusable piece of a course page: a flip card, a quiz, a video player. Instructional
designers place components on pages and fill in the words, Graphics supplies the pictures, and KBF
exports the finished course as a SCORM package that runs in a customer's learning system (LMS).

You build components here, in your own editor, without a KBF login. This README covers everything that
connects a component to KBF.

- [Quick start](#quick-start)
- [The five files](#the-five-files)
- [Settings: `settings.js`](#settings-settingsjs)
- [The `kbf` object](#the-kbf-object)
- [Styling](#styling)
- [Rules QA checks](#rules-qa-checks)
- [Changing a component later](#changing-a-component-later)
- [Branches, and how a component reaches courses](#branches-and-how-a-component-reaches-courses)

## Quick start

You need **Node.js 18 or later**, and nothing else. There are no packages to install.

```bash
# 1. Start your component from the starter
cp -R starter components/my-component        # lowercase, words joined by dashes

# 2. Give it a name: edit components/my-component/component.json
#    { "name": "My Component", "version": "1.0.0" }

# 3. After every change to settings.js, compile it
node bin/kbf-settings.mjs --only my-component

# 4. Preview it, the way KBF will run it
node preview/serve.mjs                       # then open http://localhost:4173
```

The preview rebuilds whenever you save a file. You can:

- switch between every course look, in light and dark, and three screen sizes;
- turn on **Lock Next**, to check your component tells KBF when it's finished;
- **Reload as a resume**, to check a returning learner lands where they left off;
- edit the settings your component receives;
- run the **accessibility check** (axe);
- read **What your component told KBF**, a live log of every call your component makes to the platform.

Read `starter/` before writing anything. It is a small, working component that uses every connection
a display component needs, and each line that touches the platform has a comment saying why.

## The five files

Every component is one folder in `components/`:

| File | What it is |
|---|---|
| `component.json` | The name KBF shows, the version, and (from the second version on) a `changes` line saying what changed |
| `settings.js` | The settings panel KBF shows for your component. You edit this one |
| `schema.json` | `settings.js`, compiled by `node bin/kbf-settings.mjs`. Never edit it by hand; commit it with `settings.js` |
| `component.html` | Markup only, with empty elements your code fills in |
| `component.css` | Styling. It applies only inside your component |
| `component.js` | Your code: one call to `KBF.define(...)` |

KBF renders each component inside its own **shadow root**, so your CSS can't leak onto the page and the
page's CSS can't reach in. Find your elements through the `root` you're given (`root.querySelector`),
never through `document`.

## Settings: `settings.js`

`settings.js` describes the fields someone fills in when they place your component. KBF builds the
settings panel from it, checks saved values against it, and hands the filled-in values to your code
as `kbf.config`.

```js
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',  // Text, Slides & Layout, Media, Interactives, or Quiz & Assessment
  icon: 'eye',
  completion: 'explicit',    // or 'auto'; see "Completion" below
  styleTokens: ['--kbf-color-surface', '--kbf-color-text'],
  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'setup', label: 'Setup', owner: 'dev', order: 1 },
  ],
  fields: {
    heading: f.text({ label: 'Heading', group: 'content', required: true }),
  },
})
```

Your editor autocompletes all of this from `components/_sdk/index.d.ts`.

**Groups say who fills a field in.** `owner: 'id'` fields are the Instructional Designer's: the
course's words. `owner: 'dev'` fields are set by the developer assembling the page. A field marked
`ga: true` is the Graphic Artist's whatever its group, and only `select`, `boolean` and `color` fields
can be.

**Field types:** `f.text`, `f.textarea`, `f.richtext`, `f.number`, `f.boolean`, `f.select`, `f.color`,
`f.url`, `f.repeater` (a list of rows, e.g. tabs or cards, and not nested), and `f.options` (an answer
list, for quizzes).

**Field settings worth knowing:**

| Setting | What it does |
|---|---|
| `required: true` | The panel insists on a value |
| `default` | The value until someone changes it. Your code receives it |
| `help` | A line of help under the field |
| `visibleWhen: { field, eq }` | Shows the field only when another field matches |
| `whenLocked: true` | Shows the field only when the page's Lock Next is on |
| `accept: 'image'` (or `'audio'`, `'video'`, `'caption'`) | On an `f.url`: makes it a media slot. Graphics picks or uploads the file from KBF's asset library, and the slot goes on their parts list |
| `altField: 'key'` | On an image slot: the text field that describes the picture, which is the learner's alt text |
| `size: { width, height, crop, note }` | On an image slot: the size Graphics should supply, at twice the size you draw it |
| `optional: true` | On a media slot: keep an empty slot off the parts list |
| `warnWhenEmpty: 'message'` | Warns, without refusing, when the field is left empty. For captions, say |
| `secret: true` | Answer data, scrambled in the exported course. Talk to the KBF team before building anything graded |

**Completion.** `'auto'` is for components with nothing to finish (a picture, a heading): they count as
finished as soon as they show. `'explicit'` means your code calls `kbf.complete()` when the learner is
done. It matters when a page has **Lock Next** on: the learner can't move on until every locked
component on the page has completed. Pass the same value to `KBF.define` in `component.js`.

After every change, run `node bin/kbf-settings.mjs --only <folder>`. It refuses a malformed field with a
message naming it, and the preview warns you if you forget.

## The `kbf` object

`component.js` is one call:

```js
KBF.define({ completion: 'explicit' }, function (root, kbf) {
  // root: your shadow root. kbf: everything below.
})
```

KBF calls your function once for every place the component appears on a page. Everything your
component does with the platform goes through `kbf`:

| | What it does |
|---|---|
| `kbf.config` | The settings: each field's default, then what was filled in. Plain values; image slots hold a working URL |
| `kbf.complete()` | Tells KBF the learner has finished this component. Opens Lock Next once every locked component on the page has called it. Calling it twice is harmless |
| `kbf.state.save(data)` | Remembers where the learner is (which tab is open, which card is flipped), so they come back to it. Small, plain data only |
| `kbf.state.load()` | What you last saved, or `null` on a first visit. Read it when your function starts |
| `kbf.a11y.announce(text)` | Has a screen reader say something that changed somewhere other than where the learner is |
| `kbf.glossary.show(term)` | Opens the course glossary at a term. KBF already marks glossary words in your text by itself, so you'll rarely need this |
| `kbf.instanceId`, `kbf.root` | This placement's id, and your shadow root again |

**When to use `announce`.** Only when something changes *away from* the learner's focus. A button that
opens a panel says so through `aria-expanded`, so announcing it as well makes a screen reader say it
twice. A good use is a result appearing elsewhere on the card after a drag:

```js
kbf.a11y.announce('Matched: phishing goes with "Suspicious link".')
```

**Quizzes** report through `kbf.quiz.answered(...)` and `kbf.quiz.score(...)`, and there are rules about
when answers may be anywhere a learner could read them. If you're building anything graded, ask the KBF
team first; the starter deliberately leaves these out.

## Styling

**Take colours, type and corners from KBF's design tokens**, never from your own values. Each course's
Graphic Artist sets these once for the whole series, in light or dark, and a component that reads them
looks right in every course. Write each one with a fallback for a page with no theme:

```css
.card {
  background: var(--kbf-color-surface, #ffffff);
  color: var(--kbf-color-text, #1e293b);
  border-radius: var(--kbf-radius-lg, 12px);
}
.card-title { font: var(--kbf-type-heading-m, 700 1.5rem/1.3 system-ui, sans-serif); }
```

The ones you'll use most:

- **Colours:** `--kbf-color-surface` (cards), `--kbf-color-bg` (the page), `--kbf-color-text`,
  `--kbf-color-heading`, `--kbf-color-muted`, `--kbf-color-border`, `--kbf-color-primary`,
  `--kbf-color-on-primary` (text on primary), `--kbf-color-correct` / `--kbf-color-incorrect`.
- **Type:** whole `font` values, one per role: `--kbf-type-display-l`, `--kbf-type-heading-l`,
  `--kbf-type-heading-m`, `--kbf-type-body`, `--kbf-type-body-strong`, `--kbf-type-caption`,
  `--kbf-type-eyebrow`. Or the families alone: `--kbf-font-body`, `--kbf-font-heading`.
- **Shape and motion:** `--kbf-radius-sm` / `-md` / `-lg` / `-full`, `--kbf-shadow-low` / `-mid` /
  `-high`, `--kbf-duration-quick` / `-base`, `--kbf-ease-standard`.

List the tokens you use in `styleTokens` in `settings.js`, so KBF can show Graphics and QA what your
component depends on. To see the full set, pick a look in the preview and inspect the page's `:root`.

**Don't style controls from scratch.** KBF puts one style for each kind of control into every
component, with fills, hover, a keyboard focus ring and a 44px touch target already solved for contrast
in every look. Add the class, then add layout:

| Class | For |
|---|---|
| `kbf-btn`, `kbf-btn kbf-btn--secondary` | Buttons |
| `kbf-field` | Text inputs and selects |
| `kbf-option` (+ `kbf-option-key`) | Answer options |
| `kbf-disclosure` | A header that opens a section (accordion) |
| `kbf-tab` | Tabs |
| `kbf-tile` | A tile that opens something |
| `kbf-scrim`, `kbf-close` | A modal's backdrop and close button |

**The page is 1000 × 596 pixels on a desktop**, and narrower on a tablet or phone; the preview has all
three. Design for it: nothing off the side, no text spilling out of its box, and no scrolling on a
desktop unless the content truly needs it. Reduced motion is handled for you: KBF shortens every
animation and transition for learners who ask for less motion.

## Rules QA checks

QA tests every component before it reaches a course, against these rules:

- [ ] **Text goes in with `textContent`**, never `innerHTML`. The words are typed by people.
- [ ] **No network requests, and no outside URLs** in your code or CSS (no CDNs, no web fonts, no
      analytics). A finished course runs in a customer's LMS with no route to KBF or the internet.
      Media comes only through media slots, which KBF bundles into the package.
- [ ] **One self-contained `component.js`**: no `import`, no build step, no libraries.
- [ ] **Keyboard:** everything works with Tab, Enter and Space (and arrow keys where expected), and you
      can see where focus is.
- [ ] **Screen readers:** real `<button>`s for buttons, ARIA where a control is custom, alt text from
      the slot's `altField`, headings starting at `<h2>` (the page has its own `<h1>`).
- [ ] **Contrast** at least 4.5:1 for text and 3:1 for large text and controls (WCAG 2.1 AA), in every
      look, light and dark. Tokens get you most of the way; the accessibility check finds the rest.
- [ ] **No time limits** the learner must beat, and **nothing flashing** more than 3 times a second.
- [ ] **Words are text, never pictures of text.**
- [ ] **`kbf.complete()` only when the learner is genuinely done**, and again on a resume if they already were.
- [ ] **State is small and harmless:** never save anything a learner shouldn't read, like quiz answers.
- [ ] **Fits the page** at desktop, tablet and phone sizes.

The accessibility check in the preview catches much of this, but not all of it: try the keyboard, and a
screen reader (VoiceOver: ⌘F5).

## Changing a component later

What can't change is a component's **settings**: their keys, types, defaults, groups and answer
shapes. Pages across many courses hold values saved against them. So:

- **A fix** (a bug, an accessibility fix, a style change) is a new version of the same component:
  raise `version` in `component.json` (`1.0.0` → `1.0.1`) and set `changes` to a sentence saying what
  it fixes. KBF shows that sentence to the designers and QA.
- **New settings, or changed ones**, make a new component: a new folder with a new name. The old one
  keeps working on the pages that use it.

KBF checks this itself and refuses a new version whose settings changed, naming the setting.

## Branches, and how a component reaches courses

KBF reads this repository (on GitHub) directly: on KBF's **Component libraries** screen, a developer presses
**Sync now** for a library, and KBF reads that library's branch at its latest commit. Ask the KBF team
to add a library for a new branch. Each branch is a **library** in KBF:

| Branch | Library | Who uses it |
|---|---|---|
| `master` | The main library | Every course. **Merging into `master` publishes.** |
| `testing` | The testing library | QA and instructional designers, trying components on real pages before they go live |
| Others | A custom or experimental library | Courses whose project manager has turned that library on. Custom libraries can go to customers; experimental ones can't |

The path to the main library is always the same:

1. Build on a branch of your own and preview locally.
2. Open a pull request into `testing` and merge it. KBF picks it up at the next sync, and QA tests it on
   real pages.
3. Fix what QA finds (each fix a new version, as above) until QA approves it.
4. Open a pull request from `testing` into `master`, and merge it once its checks pass.

**Only approved components can reach `master`.** KBF remembers the exact code QA approved, by a
fingerprint of its HTML, CSS, JS and settings. A component on `master` that doesn't match is refused,
and the version already live stays live; change one character after approval and it needs approving
again.

**You'll see it on the pull request as a check called `KBF / approved`.** KBF sets it on `testing`'s
latest commit whenever that library is synced or QA approves something: green once every component on
the commit is approved, red naming the ones that aren't. `master` won't merge a pull request without a
green one, so a commit KBF hasn't checked yet (pushed since the last sync) waits until the next sync.
The other check, `settings`, makes sure every `schema.json` was compiled from its `settings.js`.

Approval follows the fingerprint everywhere: code identical to a version QA already approved, in any
library, is accepted without another review. A testing branch cut from `master` doesn't send every
live component back to QA; only what you changed.

**Setting up the repo** (once, on GitHub, by its owner):

1. **Settings → Branches → Add branch ruleset** (or a classic protection rule) for `master`:
   - Require a pull request before merging.
   - Require status checks to pass, and add **`KBF / approved`** and **`settings`**. (A check appears in
     the list once it has reported at least once.)
   - Block force pushes, and don't allow bypassing.
2. Do the same for `testing` with only **`settings`** required, so what QA tests came through review.
3. On KBF's server: `KBF_COMPONENT_REPO=github:christ-web/KBF-component-library`, and `KBF_GITHUB_TOKEN`,
   a fine-grained token for this repository only with **Contents: read** and **Commit statuses: read and
   write**. KBF only calls out to GitHub, so it needn't be reachable from the internet.
