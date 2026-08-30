Forge Lesson Experience Design Contract
Status: Design Contract
Version: 1.0
Scope: Content-agnostic lesson experiences
Reference implementation: /dev/lesson-experience-demo
Purpose: Define what a Forge lesson is, how it should feel, and the architectural rules that allow future curriculum to be authored independently of the current legacy lesson data.
1. Purpose
Forge is not intended to be a traditional documentation-style learning platform.
A Forge lesson should feel like a guided interactive learning session: the learner encounters a problem, becomes curious, observes something, makes a prediction, manipulates or runs something, receives evidence, applies the concept, makes mistakes safely, retries, and eventually demonstrates mastery.
The learner should spend significantly more time thinking, choosing, predicting, manipulating, running, debugging, and explaining than passively reading.
A lesson is therefore not:
heading → paragraph → paragraph → paragraph → code block → paragraph → quiz
It is a sequence of meaningful learning moments.
The experience should feel closer to a compact interactive workshop or laboratory than a textbook.
1.1 Instructional promise
By the end of a lesson, the learner should be able to:
State the target concept in their own words.
Recognize the concept when encountered in a new situation.
Predict a relevant outcome before seeing it.
Inspect or manipulate a visual or conceptual model.
Run an experiment and connect the result to the model.
Apply the concept in a constrained challenge.
Explain why the solution works.
Recover from an incorrect attempt.
Demonstrate mastery using a fresh representation or situation.
The learner should leave the lesson feeling:
“I understand this because I actually did it.”
rather than:
“I read a lot about this, so I hope I understand it.”
2. Core Product Philosophy
2.1 Active before exhaustive
The learner should interact with the idea before receiving every possible explanation.
Do not front-load the entire theory.
Give the learner enough information to form a useful mental model, then let interaction and evidence complete that model.
2.2 Concrete before abstract
Whenever possible:
behavior → observation → model → terminology → rule
rather than:
terminology → definition → theory → example
If JavaScript changes a value, show the value changing.
If a variable points to a value, visualize that relationship.
If a CSS property changes an element, let the learner see the element change.
If execution produces a result, let the learner predict the result before running it.
2.3 One meaningful idea per moment
Each experience should have one primary instructional purpose.
A single interaction should not simultaneously attempt to:
teach a new concept;
test three concepts;
introduce five new terms;
explain syntax;
and evaluate mastery.
Complex lessons may contain many experiences, but each experience should have a clear cognitive job.
2.4 Evidence over assertion
Forge should prefer:
“Run this and see what happens.”
over:
“Trust me, this is what happens.”
The learner should frequently be able to connect:
action → result → explanation
2.5 Failure is part of learning
Incorrect answers are not exceptional states.
They are expected learning states.
A failed prediction, challenge, or experiment should create a useful next step rather than a dead end.
The interface should communicate:
“Interesting. That prediction didn't match what happened. Let's figure out why.”
rather than:
“Wrong.”
2.6 Progress is earned
A learner advances because the declared completion condition has been satisfied.
A click is not automatically evidence of learning.
A timer is not evidence of learning.
Opening a panel is not evidence of learning.
Scrolling to the bottom is not evidence of learning.
3. The Forge Lesson Experience
A Forge lesson should behave like an interactive learning journey.
The default conceptual loop is:
orient → observe → predict → experiment → explain → apply → receive feedback → retry → demonstrate mastery
This is a semantic learning loop rather than a fixed number of screens.
Not every lesson must literally contain nine separate screens.
Adjacent moments may be combined when doing so does not remove the learner's cognitive action.
For example:
observe + predict
may exist inside one experience.
Similarly:
explain + visual model
may be combined.
The important requirement is that the learner performs the intended mental action.
4. Learner Experience Principles
4.1 The learner should rarely be passive for long
Long uninterrupted reading should be treated as a warning sign.
As a default design heuristic:
short explanation;
then interaction;
then evidence;
then another interaction.
A long text section must justify its existence.
4.2 No wall-of-text lessons
Forge must actively resist recreating traditional documentation pages.
A lesson should not become:
12 paragraphs → code block → 10 paragraphs → quiz.
If substantial explanation is required, it should be broken into meaningful experiences.
Examples:
explanation → prediction;
explanation → visual model;
explanation → interaction;
explanation → experiment.
4.3 Visual-first where the concept benefits from visualization
When a concept has a useful visual representation, Forge should prefer showing it.
Examples:
JavaScript
variable/value relationships;
scope;
execution order;
call stack;
event loop;
state transitions;
object references.
HTML
DOM structure;
parent/child relationships;
rendered result.
CSS
box model;
computed properties;
layout;
selectors;
cascade;
before/after visual comparison.
Browser concepts
browser/server communication;
requests;
responses;
rendering;
events;
storage;
execution.
Visuals should communicate information rather than merely decorate the page.
5. Personality and Humor
Forge should have personality.
Humor is part of the learning experience, but it must remain subordinate to comprehension.
5.1 Humor is an instructional layer
Humor may be used to:
reduce intimidation;
make abstract concepts memorable;
create surprise;
acknowledge common mistakes;
make feedback less punishing;
create memorable metaphors;
give the product a recognizable voice.
Example:
“Your variable has officially gone on vacation. Unfortunately, JavaScript still expects you to know where it went.”
The humor should support the concept.
5.2 Humor must never obstruct learning
Avoid:
jokes longer than the explanation;
jokes requiring cultural context;
excessive memes;
humor that humiliates the learner;
sarcasm directed at the learner;
jokes inside every sentence;
humor that hides the actual instruction.
5.3 Personality should be consistent
Forge should feel like one product.
The tone can be:
playful;
clever;
encouraging;
slightly irreverent;
technically serious underneath.
The learner should feel that Forge is teaching with them, not talking down to them.
6. Visual Design Principles
Forge lessons should communicate hierarchy immediately.
Every experience should make it obvious:
What am I looking at?
Why does it matter?
What am I supposed to do?
What happened?
What should I do next?
6.1 Visual hierarchy
The primary interaction should receive the greatest visual emphasis.
Do not give equal visual weight to:
instructions;
metadata;
decorative cards;
controls;
feedback;
the actual learning interaction.
6.2 State should be visible
Interactive elements should communicate states such as:
idle;
active;
selected;
running;
evaluating;
passed;
failed;
retrying;
completed.
6.3 Avoid decorative complexity
Animation, gradients, 3D effects, particles, and motion are acceptable only when they improve comprehension or product personality.
They must never compete with the learning interaction.
7. Content-Agnostic Lesson Primitives
Every primitive defines:
purpose;
learner interaction;
completion contract;
anti-patterns.
A lesson may omit a primitive when it genuinely has no instructional purpose.
A lesson must never add an interaction merely because the UI supports it.
8. Hook
Purpose
Create a motivating question, tension, surprise, or observable problem that makes the target concept matter.
Interaction
The learner encounters a concrete setup.
The hook may include:
a short scenario;
a surprising output;
a visual;
a broken example;
a prediction;
a small mystery.
Prior terminology should not be required.
Completion
acknowledge
The learner has encountered the setup.
Anti-patterns
generic motivational copy;
long introductions;
unexplained jargon;
unrelated jokes;
fake urgency;
promises never revisited by the lesson.
9. Explanation
Purpose
Name and connect the rule after the learner has enough evidence to understand it.
Interaction
The learner encounters concise explanatory material.
Possible forms:
short text;
annotated code;
visual explanation;
step-by-step trace;
comparison;
causal diagram.
Completion
acknowledge
Anti-patterns
replacing practice with lecture;
giant text blocks;
introducing several unrelated concepts;
explaining everything before allowing prediction;
terminology without an observable example.
10. Visual Model
Purpose
Make an invisible process inspectable.
Examples:
state changes;
execution flow;
DOM relationships;
variable references;
event sequences;
request/response flow.
Interaction
The learner:
advances through frames;
selects elements;
changes state;
inspects relationships;
scrubs through a sequence;
compares states.
Each interaction must expose meaningful information.
Completion
interact-all
All declared target interactions must be completed.
Simply viewing a frame is insufficient unless the definition explicitly declares viewing as the interaction.
Anti-patterns
decorative animation;
meaningless sliders;
visual differences without conceptual differences;
requiring exploration without telling the learner what to inspect;
relying exclusively on color.
11. Prediction
Purpose
Force the learner to commit to a mental model before execution or explanation.
Interaction
The learner predicts:
output;
state;
behavior;
ordering;
visual result;
runtime behavior.
Possible input types:
multiple choice;
ordering;
short response;
selecting a predicted state;
positioning values.
Completion
correct-response
Incorrect answers remain retryable.
Anti-patterns
trivia;
ambiguous answers;
hidden multiple-correct responses;
accepting guesses as mastery;
revealing the answer before commitment.
12. Experiment
Purpose
Let the learner manipulate or execute a concept with minimal risk.
The experiment should answer:
“What happens if I try this?”
Interaction
The learner may:
edit code;
change a value;
toggle a property;
run code;
manipulate a visual model;
alter a small configuration.
The experiment should provide an observable result.
Completion
run-executed
Execution itself proves participation.
An experiment does not necessarily require correctness.
Anti-patterns
editor without output;
hidden result;
destructive host access;
treating exploratory errors as lesson failure;
demanding production-quality code.
13. Challenge
Purpose
Require deliberate application.
The learner must construct or modify something rather than merely recognize the answer.
Interaction
The learner:
receives a bounded task;
modifies starter material;
runs/checks the result;
receives structured evidence.
Completion
validation-passed
Every required test must pass.
Anti-patterns
starter solution already passing;
string matching when behavior matters;
hidden requirements;
impossible requirements;
validation coupled to a particular UI;
requiring the learner to guess what is being tested.
14. Feedback
Purpose
Convert an attempt into useful evidence.
Feedback should answer:
What happened?
What requirement passed or failed?
What should I try next?
Interaction
Feedback appears as part of the current experience state.
Feedback may include:
observed output;
failed requirement;
relevant hint;
targeted explanation;
runtime error translation.
Completion
Feedback itself does not complete an experience.
Anti-patterns
“Wrong.”
generic praise;
raw internal stack traces;
immediately revealing the entire answer;
feedback unrelated to the learner's attempt.
15. Retry
Purpose
Make another attempt easy and safe.
Interaction
The learner modifies their work and explicitly retries.
Previous feedback remains accessible.
Useful work is preserved.
Completion
A retry is recorded when the experience receives another meaningful judged attempt.
Anti-patterns
resetting everything;
punitive attempt limits;
hiding the previous error;
forcing a lesson restart;
silently replacing learner work.
16. Mastery Check
Purpose
Determine whether the learner can transfer the concept.
The mastery check should represent the concept differently from the preceding challenge.
Interaction
The learner solves a concise fresh problem.
Examples:
new code;
new scenario;
new output;
new visual;
explanation;
prediction.
Completion
correct-response
Anti-patterns
repeating the challenge verbatim;
speed requirements;
surprise difficulty spike;
allowing a button click to count as mastery;
testing irrelevant details.
17. Canonical Learner Loop
The default loop is:
ORIENT → OBSERVE → PREDICT → EXPERIMENT → EXPLAIN → APPLY → FEEDBACK → RETRY → MASTERY
17.1 Orient
Establish:
what is happening;
why it matters;
what the learner will eventually be able to do.
17.2 Observe
Show concrete behavior or a model.
17.3 Predict
Ask the learner to commit.
17.4 Experiment
Let the learner test the idea.
17.5 Explain
Connect evidence to the underlying concept.
17.6 Apply
Give a bounded challenge.
17.7 Feedback
Explain the evidence.
17.8 Retry
Allow improvement without punishment.
17.9 Mastery
Test transfer.
18. Progression Rules
The controller advances only after the declared completion rule is satisfied.
acknowledge is the only intentionally non-judged completion rule.
Prediction requires a correct response.
Challenge requires validation.
Mastery requires a correct response.
Experiment requires execution.
Failure never automatically advances the lesson.
Repeated Continue actions cannot skip experiences.
Completion transitions are idempotent.
Progress reflects completed experiences, not page views.
Rendering an experience does not complete it unless its declared rule explicitly says so.
19. Failure and Retry Rules
Failure is local to the current experience.
When validation fails:
remain on the experience;
preserve the learner's work;
preserve useful feedback;
expose the next useful action;
allow retry.
A failed challenge must never force the learner to restart the lesson.
20. Back Navigation and Review
Back navigation is safe.
Reviewing completed experiences must not:
erase progress;
reset completion;
duplicate attempts;
invalidate mastery.
Forward navigation into unvisited experiences remains blocked unless branching is explicitly declared.
If branching is introduced later:
branches must exist in lesson data;
branch transitions must be explicit;
renderers cannot infer branches;
controller state remains authoritative.
21. Lesson Completion
A lesson is complete only when the final declared experience satisfies its completion rule.
The controller emits one idempotent completion transition.
The renderer may celebrate completion.
The renderer may not manufacture completion.
Completion is a state transition, not a UI convention.
22. Pacing and Cognitive Load
Forge should actively prevent lesson fatigue.
22.1 Experience size
Experiences should be small enough that the learner understands:
“What am I doing right now?”
without needing to reread the entire screen.
22.2 Long lessons must be decomposed
A lesson containing many concepts should be divided into meaningful experiences rather than creating one enormous scrollable page.
22.3 Text budget
Text should be treated as a limited resource.
When the same information can be communicated through:
an interaction;
a visual;
a code experiment;
a comparison;
a prediction;
prefer the interactive representation.
22.4 Interaction rhythm
Avoid sequences such as:
read → read → read → read → quiz
Prefer:
hook → observe → predict → experiment → explain → apply
The exact sequence may vary, but the lesson should maintain an active rhythm.
23. Experience Composition Rules
A lesson should not contain primitives simply because they exist.
Every experience must answer:
Why does the learner need to do this?
Each experience should have:
one primary learning purpose;
one primary interaction;
one completion contract;
one clear next step.
Multiple UI elements may exist, but only one should dominate the learner's attention.
24. Architecture Boundaries
The architecture separates:
lesson definition;
controller/state;
renderer;
interaction state;
validation;
runtime;
persistence;
completion signals.
The /dev/lesson-experience-demo proves these boundaries.
It is not production curriculum.
25. Lesson Definition
Lesson definitions are serializable content.
They must contain:
metadata;
experience IDs;
experience order;
instructional purpose;
learner-facing content;
interaction requirements;
completion rules;
validation declarations;
optional hints;
optional branching declarations.
They must not contain:
React elements;
DOM references;
callbacks;
database clients;
network clients;
renderer instances;
runtime objects;
component state.
Definitions must be independently replaceable.
26. Controller / State Machine
The controller owns:
current experience;
experience order;
visited IDs;
completed IDs;
attempts;
responses;
interaction evidence;
validation state;
retry state;
lesson completion.
The controller must not:
render UI;
access the DOM;
execute code;
inspect component implementation;
perform regex-based “looks correct” decisions;
contain concept-specific branches.
27. Renderers
Renderers translate an experience definition into accessible UI.
They:
display content;
collect interaction;
display state;
emit learner intents.
They must not:
decide lesson completion;
mutate controller state directly;
duplicate validation logic;
contain lesson-ID special cases;
infer completion from visual state.
A renderer must work with arbitrary valid content of its declared kind.
28. Interaction State
Interaction state represents learner evidence.
Examples:
selected option;
prediction;
interacted frame;
changed value;
edited source;
execution occurred;
validation result;
attempt count.
Transient presentation state may include:
focused element;
expanded panel;
active tab;
draft visual state.
Durable learning meaning belongs to the controller.
29. Validation Adapters
Validation translates declared requirements into structured evidence.
Validation must distinguish:
syntax failure;
runtime failure;
timeout;
failed assertion;
successful validation;
unavailable runtime.
Validation must operate against the learner's submitted attempt.
Validation must not depend on:
renderer implementation;
page layout;
button labels;
route;
lesson ID.
30. Sandbox / Runtime
The runtime is an execution boundary.
It is not an instructional decision-maker.
The existing canonical sandbox remains authoritative.
It must preserve:
source authenticity checks;
request IDs;
revision filtering;
runtime isolation;
bounded execution;
existing sandbox permissions.
The canonical iframe sandbox policy remains:
allow-scripts allow-modals
allow-same-origin must not be introduced as part of this architecture.
The lesson experience engine must not create a competing execution system.
31. Persistence Boundary
The first implementation may be entirely in memory.
Future persistence must sit behind an explicit repository boundary.
Renderers must never directly write to persistence.
Definitions must remain persistence-agnostic.
The system should persist only what future product requirements justify.
32. Completion Signals
Completion is emitted by the controller.
Consumers may:
update progress;
navigate;
display celebration;
record analytics in a future implementation.
Completion must be idempotent.
A renderer must never emit:
“Lesson complete”
simply because the learner clicked a button.
33. Mobile Experience
Mobile is not a compressed desktop experience.
Experiences must remain usable on small screens.
When multiple panels exist, layouts should adapt intentionally.
Examples:
HTML
Task → Preview → Code
or an intelligently stacked combined Code/Preview experience.
CSS
Code ↔ Visual Preview
with preview remaining easily accessible.
JavaScript
Code → Console → Optional Preview
Visual model
Focused interaction → explanation
Controls must remain touch-friendly.
Horizontal scrolling should not be required for ordinary interaction.
34. Accessibility Contract
Accessibility is part of the architecture.
Every experience must support:
keyboard operation;
semantic controls;
visible focus;
screen-reader labels;
meaningful status announcements;
reduced motion;
sufficient contrast;
non-color status indicators;
text equivalents for visual output;
accessible code/output presentation.
Interactive visualizations must provide a meaningful non-visual representation.
35. Authoring Contract
Every future lesson author must answer:
What single concept is changing?
What does the learner observe?
What prediction can they make?
What evidence will confirm or challenge the prediction?
What experiment exposes causality?
What challenge requires application?
What feedback will appear after failure?
How can the learner retry?
What demonstrates mastery?
Why is every experience necessary?
What visual representation helps?
Where can humor make the concept memorable?
What accessibility equivalent exists?
What prevents the lesson from becoming a wall of text?
36. Humor Authoring Checklist
For every humorous element:

Does it reinforce or support the concept?

Is the joke short?

Is the learner the target of the joke? If yes, remove it.

Does the instruction remain obvious?

Does the humor remain understandable without cultural context?

Would removing the joke damage comprehension? If not, it is optional.

Is the overall lesson still technically serious?
37. Visual Authoring Checklist

Is there a visual representation where one would materially improve understanding?

Does the visual show meaningful information?

Can the learner interact with it?

Can the learner explain what changed?

Is there a non-visual equivalent?

Does animation communicate state rather than decorate?

Is the visual still understandable without motion?
38. Quality Checklist
Pedagogy

Target outcome is specific.

Learner acts early.

At least one prediction precedes explanation or execution.

Experiment exposes causality.

Challenge requires application.

Mastery checks transfer.

Copy is concise.
Interaction

Next action is obvious.

Current state is visible.

Failed state is understandable.

Retry is obvious.

Work is preserved.

Back navigation is safe.

Progress reflects actual completion.
Accessibility

Full keyboard completion works.

Screen-reader users can understand every interaction.

Focus behavior is predictable.

Status is not conveyed through color alone.

Visual output has text equivalents.

Reduced motion works.

Error/success messages are announced.
Validation

Completion rules are declared.

Every requirement has a corresponding test.

Starter source cannot accidentally pass when it should not.

Tests evaluate the intended behavior.

Current submitted source is evaluated.

Runtime and assertion failures are differentiated.

Validation cannot be bypassed through renderer callbacks.
Retry

Failure remains local.

Feedback is actionable.

Learner work survives retry.

Attempts are tracked consistently.

Successful completion is idempotent.
Content Agnosticism

No lesson-ID special cases.

No hardcoded demo copy.

No React/DOM objects in definitions.

Controller has no concept-specific branches.

Renderer works with arbitrary valid content.

Validation is definition-driven.
Security

Sandbox isolation is preserved.

Parent document is inaccessible.

Privileged data is inaccessible.

Runtime is bounded.

Messages are validated.

No secrets are exposed.
Performance

Initial experience becomes interactive quickly.

Large outputs are bounded.

Unnecessary runtime work is avoided.

Experiences do not load unnecessary resources.

Animations do not cause interaction lag.
39. Testing Contract
The architecture must be tested independently of production curriculum content.
Tests should prove:
Definition
valid definitions load;
invalid definitions are rejected;
IDs are unique;
completion rules are valid.
Controller
progression works;
failure does not advance;
retry works;
completion is idempotent;
back navigation preserves progress;
completed experiences remain completed.
Renderers
each renderer accepts arbitrary valid content;
renderer state does not control lesson progression;
interaction events reach the controller;
accessible interaction works.
Validation
correct attempts pass;
incorrect attempts fail;
stale attempts are rejected;
runtime errors are represented correctly.
Runtime
sandbox isolation remains intact;
revision filtering works;
request filtering works;
source authenticity checks remain intact.
Integration
The demo must prove:
definition → controller → renderer → interaction → validation/runtime → controller → progression → completion
40. Demo Requirements
The demo exists solely to prove the architecture.
Route:
/dev/lesson-experience-demo
It should demonstrate a small synthetic lesson around JavaScript state/variables.
Suggested sequence:
Humorous hook.
Visual state explanation.
Click-to-change state visualization.
Prediction.
Real sandboxed experiment.
Short code challenge.
Feedback.
Retry.
Post-interaction explanation.
Final mastery check.
Completion.
The demo must remain synthetic.
It must not become the hidden production curriculum.
41. Demo Independence Requirements
The demo must prove:
Definition replacement
Replacing the demo lesson definition does not require controller changes.
Renderer replacement
Replacing a renderer does not require definition changes.
Validation replacement
Changing a validation adapter does not require renderer changes.
Runtime replacement
Changing the runtime implementation does not require lesson-definition changes.
Controller independence
The controller does not know the concept being taught.
42. Production Boundary
The following remain authoritative for the existing production system:
lessons.json;
original_lessons.json;
curriculum providers;
existing production lesson routes;
existing canonical learning engine;
existing useLessonSession;
existing useActivityRuntime;
existing sandbox/runtime security boundary.
The new experience engine must not silently replace them.
43. Non-Goals
This contract does not authorize:
modifying lessons.json;
modifying original_lessons.json;
migrating legacy lessons;
rewriting production curriculum;
replacing production lesson routes;
replacing useLessonSession;
replacing the existing learning engine;
introducing React Native;
introducing a new curriculum technology;
adding backend infrastructure;
adding authentication;
adding analytics;
adding AI;
adding persistence;
adding external integrations;
changing sandbox security policy;
creating a second code-execution architecture;
implementing the actual curriculum.
This document defines the architecture and experience model.
It does not authorize curriculum production.
44. Explicit Architectural Invariants
The following must remain true:
Invariant 1 — Content independence
The new lesson model does not depend on lessons.json.
Invariant 2 — Renderer independence
Lesson definitions do not contain renderer implementation details.
Invariant 3 — Controller authority
Only the lesson controller determines progression and completion.
Invariant 4 — Validation authority
Challenges and mastery are completed only through declared validation rules.
Invariant 5 — Runtime isolation
Executable code remains inside the existing sandbox boundary.
Invariant 6 — Retry safety
Failure never destroys meaningful learner work.
Invariant 7 — Review safety
Back navigation never regresses completed progress.
Invariant 8 — Demo isolation
The demo is proof, not production curriculum.
Invariant 9 — Legacy safety
Existing production lesson behavior remains untouched until a deliberate future migration decision.
Invariant 10 — No wall of text
The new experience architecture must not be used merely to recreate the old document-style lesson UI.
45. Future Authoring Pipeline
The intended future pipeline is:
Lesson Idea
    ↓
Learning Objective
    ↓
Experience Sequence
    ↓
Content Definition
    ↓
Validation Definition
    ↓
Experience Renderer
    ↓
Runtime / Sandbox
    ↓
Learner Interaction
    ↓
Evidence
    ↓
Feedback
    ↓
Retry
    ↓
Mastery
The curriculum author should primarily define:
what the learner should experience
rather than:
how the React component should render it.
46. Future Content Generation
The architecture must support future curriculum authoring through tools such as Google AI Studio or other authoring systems without requiring those systems to understand Forge's UI implementation.
An authoring system should eventually be able to produce a validated lesson definition containing:
objective;
experience sequence;
learner-facing content;
interactions;
completion rules;
validation requirements;
hints;
feedback;
mastery check.
The Forge application then determines how those definitions are rendered.
This keeps:
content creation
separate from:
application architecture.
47. What Makes a Forge Lesson Different
A Forge lesson should not compete with traditional documentation by simply presenting the same information in a prettier interface.
Its advantage should be:
The learner experiences the concept instead of merely reading about it.
For a JavaScript concept, the learner should ideally:
see state;
predict state;
manipulate state;
execute code;
observe output;
debug a mistake;
apply the concept;
explain the behavior;
prove mastery.
For CSS:
see the interface;
change the styling;
observe visual consequences;
inspect properties;
predict changes;
fix a layout;
prove mastery.
For HTML:
construct structure;
see the DOM;
observe rendering;
manipulate elements;
fix structure;
prove mastery.
The exact curriculum can evolve.
The underlying learning philosophy should not.
48. Decision Gate Before Real Curriculum Authoring
Real curriculum authoring must not begin until the architecture can demonstrate:
A lesson definition can be replaced without controller changes.
A renderer can be replaced without definition changes.
A validation adapter can be replaced without renderer changes.
Failed validation remains local and retryable.
Completion comes only from controller state.
Sandbox execution remains isolated.
The learner can complete the canonical loop.
Keyboard interaction is supported.
Accessibility states are represented.
The demo contains meaningful interaction rather than simulated interaction.
The system can support multiple experience types without a giant renderer containing boolean switches.
The architecture does not require lessons.json.
The architecture does not require the legacy learning engine.
The experience model can support future curriculum authoring independently.
Until these conditions are satisfied:
Architecture validation is the work.
Do not compensate for architectural uncertainty by writing more curriculum.
49. Current Proof Surface
The current proof surface is:
/dev/lesson-experience-demo
Its purpose is to answer one question:
“Can Forge deliver the kind of interactive learning experience we actually want before we commit hundreds of lessons to this architecture?”
The answer must be demonstrated through actual interaction, not screenshots or static mockups.
50. Final Design Principle
Forge should optimize for:
Understand → Try → See → Think → Fix → Prove
rather than:
Read → Read → Read → Quiz
The goal is not to eliminate explanations.
The goal is to make explanations serve interaction.
The goal is not to turn every lesson into a game.
The goal is to make learning active, visual, memorable, practical, and enjoyable.
The goal is not to make the UI impressive.
The goal is to make the learner think:
“Ohhh. Now I actually get it.”
That is the standard every future Forge lesson should be judged against.
51. Implementation Boundary
This document is a design contract.
It does not authorize implementation changes beyond the explicitly approved architecture-validation work.
At the current stage:
do not migrate the curriculum;
do not rewrite lessons.json;
do not replace production lessons;
do not redesign the existing production lesson route;
do not add new curriculum technology;
do not create production content;
do not add backend infrastructure.
The next phase after architectural acceptance is curriculum authoring against this contract, not further modification of the legacy lesson model.
52. Acceptance Statement
The Forge lesson experience is considered architecturally approved when the implementation demonstrates that:
Content defines the learning experience.
The controller owns progression.
Renderers present the experience.
Validation produces evidence.
The runtime executes safely.
Feedback supports retry.
Mastery proves understanding.
And none of these layers need to know the implementation details of the others.
Only after this boundary is proven should the real Forge curriculum be authored.
