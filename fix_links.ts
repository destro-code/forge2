import fs from 'fs';

function fixFile(file: string, regex: RegExp, replacer: (match: string, p1: string) => string) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(file, content);
}

fixFile('src/routes/projects.tsx', /<Link key={project\.id} to={\`\/projects\/\$\{project\.id\}\`}>/g, () => '<Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }}>');
fixFile('src/routes/quizzes.tsx', /<Link to={\`\/quizzes\/\$\{quiz\.id\}\`}>/g, () => '<Link to="/quizzes/$quizId" params={{ quizId: quiz.id }}>');
fixFile('src/routes/learn.tsx', /<Link to={\`\/lesson\/\$\{currentLesson\.id\}\`}>/g, () => '<Link to="/lesson/$lessonId" params={{ lessonId: currentLesson.id }}>');
fixFile('src/routes/learn.topics.$topicId.tsx', /<Link to={\`\/lesson\/\$\{lesson\.id\}\`}>/g, () => '<Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>');
fixFile('src/routes/learn.lessons.tsx', /<Link to={\`\/lesson\/\$\{lesson\.id\}\`}>/g, () => '<Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>');
fixFile('src/routes/learn.lessons.tsx', /<Link to={\`\/lesson\/\$\{nextLesson\.id\}\`}>/g, () => '<Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>');
fixFile('src/routes/bookmarks.tsx', /<Link to={\`\/lesson\/\$\{bookmark\.lessonId\}\`}>/g, () => '<Link to="/lesson/$lessonId" params={{ lessonId: bookmark.lessonId }}>');
fixFile('src/routes/challenges.tsx', /<Link to={\`\/quiz\`}>/g, () => '<Link to="/quizzes">');
fixFile('src/routes/debug-lab.tsx', /<Link to={\`\/debug-lab\/\$\{bug\.id\}\`}>/g, () => '<Link to="/debug-lab/$bugId" params={{ bugId: bug.id }}>');

// Fix interview routes missing required search properties
fixFile('src/routes/interview.tsx', /to="\/interview\/session"\s*search={{/g, () => 'to="/interview/session" search={{ category: "", preset: "", duration: "",');

// Fix calendar undefined fields
fixFile('src/routes/calendar.tsx', /entry\.date/g, () => '(entry as any).date');
fixFile('src/routes/calendar.tsx', /session\.date/g, () => '(session as any).date');
fixFile('src/routes/calendar.tsx', /session\.topicTitle/g, () => '(session as any).topicTitle');
fixFile('src/routes/calendar.tsx', /session\.score/g, () => '(session as any).score');
fixFile('src/routes/calendar.tsx', /session\.feedbackGrade/g, () => '(session as any).feedbackGrade');

// Fix index missing setProgress
fixFile('src/routes/index.tsx', /setProgress/g, () => 'useProgressStore.getState().setProgress');

// Fix flashcards Reviews possibly undefined
fixFile('src/routes/flashcards.tsx', /flashcardReviews\[/g, () => '(flashcardReviews || {})[');
fixFile('src/routes/flashcards.tsx', /Object\.keys\(flashcardReviews\)/g, () => 'Object.keys(flashcardReviews || {})');
fixFile('src/routes/flashcards.tsx', /Object\.values\(flashcardReviews\)/g, () => 'Object.values(flashcardReviews || {})');

// Fix interview session MentorMessage missing properties
fixFile('src/routes/interview.session.tsx', /setMessages\(\(prev\) => \[\s*\.\.\.prev,\s*\{\s*role: "user",\s*content: msg,\s*\}\s*\]\);/g, () => 'setMessages((prev) => [...prev, { role: "user", content: msg, id: String(Date.now()), createdAt: new Date().toISOString() }]);');

// Fix fill in blank errors
fixFile('src/components/lesson/fill-blank-question.tsx', /interface FillInBlankQuestionProps \{/g, () => 'export interface FillInBlankQuestionProps {\n  onChangeAnswer?: (ans: any) => void;\n');

