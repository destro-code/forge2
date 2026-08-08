const fs = require('fs');

const filesToFix = [
  'src/routes/learn.topics.tsx',
  'src/routes/learn.lessons.tsx',
  'src/routes/learn.paths.tsx',
  'src/routes/learn.modules.tsx',
  'src/routes/playground.tsx',
  'src/routes/projects.tsx',
  'src/routes/quizzes.tsx'
];

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('learn.topics.tsx')) {
    content = content.replace(/validateSearch:\s*\(\w+:\s*Record<string, unknown>\)\s*=>\s*\(\{([\s\S]*?)\}\),/, (match, p1) => {
       return match.replace(/query: typeof search.query === "string" \? search.query : "",/, \`query: (search.query as string) || undefined,\`)
                   .replace(/moduleId: typeof search.moduleId === "string" \? search.moduleId : "all",/, \`moduleId: (search.moduleId as string) || undefined,\`);
    });
  } else if (file.includes('learn.lessons.tsx')) {
    content = content.replace(/validateSearch:\s*\(\w+:\s*Record<string, unknown>\)\s*=>\s*\(\{([\s\S]*?)\}\),/, (match, p1) => {
       return match.replace(/query: typeof search.query === "string" \? search.query : "",/g, \`query: (search.query as string) || undefined,\`)
                   .replace(/moduleId: typeof search.moduleId === "string" \? search.moduleId : "all",/g, \`moduleId: (search.moduleId as string) || undefined,\`)
                   .replace(/topicId: typeof search.topicId === "string" \? search.topicId : "all",/g, \`topicId: (search.topicId as string) || undefined,\`)
                   .replace(/pathId: typeof search.pathId === "string" \? search.pathId : "all",/g, \`pathId: (search.pathId as string) || undefined,\`)
                   .replace(/difficulty: typeof search.difficulty === "string" \? search.difficulty : "all",/g, \`difficulty: (search.difficulty as string) || undefined,\`)
                   .replace(/status: typeof search.status === "string" \? search.status : "all",/g, \`status: (search.status as string) || undefined,\`);
    });
  }
  
  fs.writeFileSync(file, content);
});
