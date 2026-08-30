# Forge Lesson Experience Design Contract

**Status:** Design contract
**Scope:** Content-agnostic lesson experiences
**Reference implementation:** `/dev/lesson-experience-demo`

## 1. Purpose

A Forge lesson is a guided sequence of active learning moments. It should feel like a compact studio: the learner sees a meaningful problem, forms a prediction, manipulates a visible model, runs an experiment, applies the idea, receives precise feedback, retries without penalty, and demonstrates that the concept transfers.

The lesson is not a document to scroll through and not a quiz wrapped around code. Every experience must earn its place by changing what the learner can observe, predict, do, explain, or prove.

### Instructional promise

By the end of a lesson, the learner should be able to:

1. State the target concept in their own words.
2. Predict a relevant outcome before seeing it.
3. Inspect or manipulate a model of the concept.
4. Run an experiment and connect the result to the model.
5. Apply the concept in a constrained challenge.
6. Explain why the solution works.
7. Demonstrate mastery in a fresh check.

## 2. Learner experience principles

- **Active before exhaustive:** learners act before receiving every explanation.
- **Concrete before abstract:** use a visible state, trace, value, or behavior before naming the rule.
- **One idea per moment:** each experience has one instructional purpose.
- **Feedback is evidence:** feedback identifies the observed result and the next useful action; it does not merely report a score.
- **Retry is normal:** incorrect attempts preserve useful work and create a clear next move.
- **Progress is earned:** completion reflects declared interaction or validation rules, never a timer or accidental click.
- **Review is safe:** back navigation and revisiting completed moments never erase progress.
- **Accessibility is part of the model:** keyboard, screen reader, reduced-motion, contrast, and focus behavior are required, not polish.

## 3. Content-agnostic lesson primitives

Every primitive defines a purpose, learner interaction, completion contract, and anti-patterns. A lesson may omit a primitive when its instructional purpose is genuinely unnecessary, but may not add a decorative substitute.

### 3.1 Hook

**Purpose:** Create a motivating question, tension, or observable surprise that makes the target concept matter.

**Interaction:** Read, inspect, or acknowledge a concrete setup. The hook may include a short scenario, artifact, or prediction prompt, but should not require prior terminology.

**Completion:** `acknowledge`. Continue is available after the learner has encountered the setup.

**Anti-patterns:** generic motivational copy; unexplained jargon; a long introduction; claims unrelated to the lesson task; a hook that promises an outcome the lesson never revisits.

### 3.2 Explanation

**Purpose:** Name and connect the rule after the learner has enough evidence to understand it.

**Interaction:** Read concise paragraphs, annotated examples, or a causal summary. Explanation should point back to an observed state or prior attempt.

**Completion:** `acknowledge`.

**Anti-patterns:** replacing practice with a lecture; introducing multiple new concepts at once; explaining an outcome before the learner has a chance to predict; copy that cannot be mapped to an example.

### 3.3 Visual model

**Purpose:** Make an invisible process inspectable through frames, state transitions, traces, values, or relationships.

**Interaction:** Learner advances through or selects declared frames. Each frame must expose a meaningful change and a description of what changed.

**Completion:** `interact-all` for the declared target frame IDs. A frame is not complete merely because it is visible in the viewport.

**Anti-patterns:** decorative animation; frames that differ only cosmetically; a slider with no interpretable state; requiring exploration without indicating what to inspect; relying on color alone.

### 3.4 Prediction

**Purpose:** Elicit a falsifiable mental model before execution or explanation.

**Interaction:** Learner selects or enters an answer to a concrete question about a shown snippet, state, or event.

**Completion:** `correct-response`. Incorrect answers remain visible with corrective feedback and a retry path.

**Anti-patterns:** trivia; ambiguous options; multiple correct answers without explanation; marking a guess complete; revealing the answer before the learner commits.

### 3.5 Experiment

**Purpose:** Let the learner change or run a small program and observe the causal result.

**Interaction:** Learner edits or runs starter source in an isolated runtime. The experiment is exploratory and should have a low-risk, inspectable outcome.

**Completion:** `run-executed`. The learner must execute at least once; an experiment may report output or runtime errors without requiring a correct solution.

**Anti-patterns:** an editor with no observable result; hidden state; destructive access to the host page; treating an exploratory error as failure of the lesson; requiring production-quality code in an experiment.

### 3.6 Challenge

**Purpose:** Require deliberate application of the concept in a bounded task with machine-checkable evidence.

**Interaction:** Learner edits starter source and submits/runs it against declared test cases. Instructions state the expected behavior without prescribing every keystroke.

**Completion:** `validation-passed`. Every required test must pass through the validation adapter.

**Anti-patterns:** tests that accept the starter solution unchanged; checks based only on string matching when behavior is required; hidden requirements; validation coupled to a specific UI renderer; an impossible or under-specified task.

### 3.7 Feedback

**Purpose:** Convert an attempt into actionable evidence.

**Interaction:** Show what happened, which requirement was met or missed, and one concrete next action. Feedback should be associated with the attempt that produced it.

**Completion:** Feedback itself does not advance the lesson. It is emitted by evaluation and is consumed by the current experience state.

**Anti-patterns:** “wrong” without evidence; generic praise; exposing internal errors without translation; changing the task after submission; feedback that leaks the full answer on the first miss.

### 3.8 Retry

**Purpose:** Provide a low-friction second attempt using preserved context and improved understanding.

**Interaction:** Learner revises the response/source and explicitly retries. Prior feedback remains available; the active input is not silently replaced.

**Completion:** Retry is complete when the underlying experience receives a new judged attempt or when the learner returns to an exploratory experiment.

**Anti-patterns:** resetting all work; punitive attempt limits; advancing after a failed attempt; requiring a full lesson restart; hiding why the prior attempt failed.

### 3.9 Mastery check

**Purpose:** Confirm transfer or explanation after practice, using a fresh representation or situation.

**Interaction:** Learner answers a concise check that is not identical to the preceding challenge. The response should require reasoning, not recall of a visible answer.

**Completion:** `correct-response`.

**Anti-patterns:** repeating the same question verbatim; making mastery depend on speed; using mastery as a surprise final exam; allowing an unvalidated click to complete the lesson.

## 4. Canonical learner loop

The default sequence is:

> **orient → observe → predict → experiment → explain → apply → receive feedback → retry → demonstrate mastery**

This is a semantic loop, not a mandatory count of screens. A lesson may combine adjacent moments when the learner’s mental action remains clear.

1. **Orient:** establish the problem and target outcome.
2. **Observe:** expose a concrete model or initial behavior.
3. **Predict:** ask the learner to commit before execution.
4. **Experiment:** let the learner run or manipulate the model.
5. **Explain:** connect evidence to the rule.
6. **Apply:** present a bounded challenge.
7. **Receive feedback:** evaluate the attempt and explain the evidence.
8. **Retry:** let the learner revise without losing context.
9. **Demonstrate mastery:** validate transfer in a fresh check.

### Progression rules

- The controller advances only when the current experience’s declared completion rule is satisfied.
- `acknowledge` is the only intentionally non-judged completion rule.
- Prediction, challenge, and mastery require a valid result; a submitted response is not automatically a completed response.
- Experiments require execution, not correctness, unless the definition explicitly uses a challenge or validation rule.
- Completion is idempotent. Repeated Continue actions cannot duplicate completion records or skip an experience.
- A failed attempt changes runtime status and feedback but does not change lesson position.
- The progress indicator reports declared experience completion, not page views or attempts.

### Failure and retry

- Failure is local to the active experience.
- The learner stays on the failed experience until retry succeeds or they navigate back.
- The controller preserves attempts, prior response, and validation evidence.
- Retry clears transient validation status only as defined by the experience; it must not erase meaningful learner work.
- A successful retry transitions the experience to `passed`/`completed` and enables progression.

### Back navigation and review

- Back navigation is always safe for visited experiences.
- Reviewing a completed experience does not regress completed IDs or lesson status.
- Forward navigation into an unvisited experience remains blocked until the current experience is complete.
- Direct navigation is limited to previously visited experiences unless a future definition explicitly declares branching.
- Branching, if introduced, must be represented in the definition and controller state; renderers must not infer branches from visual conditions.

### Lesson completion

A lesson is complete only when the final declared experience satisfies its completion rule and the controller emits a single completion transition with a timestamp. Completion is a state signal, not a renderer convention. The UI may celebrate completion, but cannot manufacture it.

## 5. Architecture boundaries

The architecture is intentionally split so lesson content can evolve without rewriting the learner state machine or runtime host.

### 5.1 Lesson definition

The definition is serializable, content-agnostic data. It contains lesson metadata, ordered experience IDs, purpose, content, and completion rules. It must not contain React elements, DOM references, callbacks, network clients, or renderer-specific state.

The existing experience types are the reference contract. Definitions should be validated at authoring/build time for unique IDs, valid target IDs, valid correct option IDs, non-empty purpose/copy, and compatible completion rules.

### 5.2 Controller and state machine

The controller is a pure state transition layer. It owns order, current index, visited IDs, completed IDs, per-experience runtime status, attempts, timestamps, and completion semantics.

The controller may record responses, interactions, execution, validation, retry, next, previous, and safe review navigation. It must not render UI, access the DOM, execute source, call a database, or decide whether a string “looks correct.”

### 5.3 Renderers

A renderer maps one `ExperienceKind` to accessible UI and emits learner intents through controller-facing callbacks. Renderers own presentation and local transient interaction state only. They must not mutate lesson state directly, advance the controller optimistically, or duplicate completion rules.

A renderer must work with arbitrary valid content of its kind. It may not special-case the demo lesson ID or a particular sentence of copy.

### 5.4 Interaction state

Interaction state records learner intent and evidence: selected option, response payload, interacted target IDs, source edits, execution occurrence, attempts, validation result, and status. Local UI state may include focus, open panels, and draft text, but durable learner meaning belongs in the controller state.

State transitions should be explicit and idempotent. A response may be recorded before evaluation; evaluation is a separate transition.

### 5.5 Validation adapters

A validation adapter translates an experience’s declared tests into a safe, structured validation result. It returns pass/fail evidence and a learner-facing message without coupling to a component or route.

Adapters must distinguish:

- syntax/runtime failure;
- a failed declared requirement;
- a successful validation;
- an unavailable or timed-out runtime.

Validation must execute against the submitted attempt, not stale starter source. It must be deterministic where possible, bounded in time and memory, and resistant to escaping its isolation boundary.

### 5.6 Sandbox/runtime

The sandbox is an execution boundary, not an instructional decision-maker. It receives source and execution configuration, reports output/errors/status, and never grants the source access to the host document, parent window, cookies, or privileged APIs.

The existing `/dev/lesson-experience-demo` and canonical sandbox frame are architectural proof/reference only. The proof must remain replaceable by another renderer or runtime without changing lesson definitions or controller semantics.

### 5.7 Persistence boundaries

The experience engine is initially usable as an in-memory session model. If persistence is added later, persist learner/session state through an explicit repository boundary; do not put storage calls in definitions, renderers, or pure controller transforms.

Persist only the state required for resume, analytics, or product requirements. Do not persist source or responses without a clear privacy and retention policy.

### 5.8 Completion signals

Completion is emitted by the controller after the final state transition. A renderer may notify the host that an interaction occurred, but may not emit lesson completion based on a button click alone.

Completion consumers may update navigation, progress, analytics, or celebrations. They must treat the signal as idempotent and must not mutate curriculum content.

## 6. Authoring contract

Every future lesson definition must answer these questions:

- What single concept or capability is the lesson trying to change?
- What will the learner observe before terminology is introduced?
- What prediction can the learner make and later verify?
- What experiment exposes causality rather than decoration?
- What challenge requires application rather than copying?
- What evidence proves the challenge and mastery check are correct?
- What happens after an incorrect attempt?
- What prior work remains visible during retry?
- Why is each experience necessary in this order?
- What accessible equivalent exists for every visual or interactive affordance?

## 7. Quality checklist

### Pedagogy

- [ ] The target outcome is observable and specific.
- [ ] The sequence follows a deliberate mental progression.
- [ ] At least one prediction precedes an explanation or execution.
- [ ] The experiment exposes a causal relationship.
- [ ] The challenge requires transfer or construction.
- [ ] The mastery check uses a fresh representation.
- [ ] Copy is concise, concrete, and free of unexplained jargon.

### Interaction clarity

- [ ] The learner can tell what to do next without guessing.
- [ ] Disabled Continue state explains what remains.
- [ ] Submitted, evaluating, passed, failed, and retry states are distinct.
- [ ] Draft work is not silently overwritten.
- [ ] Back and review behavior is predictable.
- [ ] Progress reflects completed experiences, not clicks.

### Accessibility

- [ ] All controls have accessible names and semantic roles.
- [ ] Keyboard users can complete the full lesson.
- [ ] Focus moves predictably after state changes and remains visible.
- [ ] Color is not the sole carrier of status or meaning.
- [ ] Code/output has a readable text equivalent.
- [ ] Motion can be reduced or disabled.
- [ ] Error and success messages are announced appropriately.
- [ ] Touch targets and contrast meet the product standard.

### Validation integrity

- [ ] Completion rules are declared in lesson data.
- [ ] Every challenge requirement has a corresponding test.
- [ ] Tests reject the unchanged starter when it should not pass.
- [ ] Tests evaluate behavior or state where behavior is the learning goal.
- [ ] Validation runs against the current submitted attempt.
- [ ] Syntax, runtime, timeout, and assertion failures are differentiated.
- [ ] Validation cannot be bypassed by a renderer callback.

### Retry and mastery

- [ ] A failed attempt stays local to the current experience.
- [ ] Feedback identifies evidence and a next action.
- [ ] Retry preserves useful learner work.
- [ ] Attempts are counted consistently.
- [ ] Success is idempotent.
- [ ] Mastery cannot be completed by replaying a prior click or copying visible output.

### Content agnosticism

- [ ] The definition contains no React or DOM objects.
- [ ] Renderers contain no lesson-ID special cases.
- [ ] The controller contains no concept-specific branches.
- [ ] Validation is selected by declared rules/adapters, not UI text.
- [ ] The lesson can be replaced without changing production routes.
- [ ] The demo is treated as proof, not as a hidden curriculum dependency.

### Security and privacy

- [ ] Sandboxed code cannot access the parent document or privileged data.
- [ ] Runtime work is bounded by timeout and resource limits.
- [ ] Messages between host and sandbox are validated.
- [ ] User source and responses are handled according to retention policy.
- [ ] No secrets are exposed to learner code or client-rendered definitions.

### Observability and performance

- [ ] Important transitions can be diagnosed without logging learner-sensitive source by default.
- [ ] Validation failures include stable machine-readable categories.
- [ ] Completion and retry events are idempotent for analytics.
- [ ] Large definitions and output are bounded or incrementally rendered.
- [ ] The initial experience is interactive without blocking on unnecessary work.
- [ ] Runtime errors are surfaced as learner-facing states, not unhandled exceptions.

## 8. Non-goals and invariants

This contract does not authorize implementation beyond the document. Specifically, this work must not:

- modify `lessons.json`;
- modify `original_lessons.json`;
- migrate or rewrite legacy lessons;
- author the real curriculum;
- modify curriculum providers or the production lesson route;
- introduce React Native or any new curriculum technology;
- replace the existing production learning engine;
- make the demo route a production dependency;
- add persistence, authentication, analytics, or new external integrations;
- change sandbox security policy as part of authoring.

The invariant is that Forge can define a new content-agnostic lesson experience independently of legacy curriculum data. The `/dev/lesson-experience-demo` exists only to prove the separation between definition, controller, renderers, validation, and runtime; it is not the curriculum and is not a license to couple future content to demo implementation details.

## 9. Decision gate for future implementation

Do not begin real curriculum authoring until this contract is accepted and the implementation can demonstrate, with tests and an accessible browser flow, that:

1. a definition can be replaced without controller changes;
2. a renderer can be replaced without definition changes;
3. failed validation remains local and retryable;
4. completion comes only from controller state;
5. sandbox execution is isolated and bounded;
6. the learner can complete the canonical loop with keyboard and assistive technology support.

Until that gate is met, the correct work is architecture validation—not adding more curriculum content.
