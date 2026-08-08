import fs from 'fs';

const file1 = 'src/routes/learn.topics.tsx';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/validateSearch: \(search: Record<string, unknown>\) => \(\{([\s\S]*?)\}\),/, "validateSearch: (search: Record<string, unknown>): { query?: string, moduleId?: string } => ({\n$1}),");
fs.writeFileSync(file1, c1);

const file2 = 'src/routes/learn.lessons.tsx';
let c2 = fs.readFileSync(file2, 'utf8');
c2 = c2.replace(/validateSearch: \(search: Record<string, unknown>\) => \(\{([\s\S]*?)\}\),/, "validateSearch: (search: Record<string, unknown>): { query?: string, moduleId?: string, topicId?: string, pathId?: string, difficulty?: string, status?: string } => ({\n$1}),");
fs.writeFileSync(file2, c2);

const file3 = 'src/routes/learn.topics.$topicId.tsx';
if (fs.existsSync(file3)) {
  let c3 = fs.readFileSync(file3, 'utf8');
  c3 = c3.replace(/validateSearch: \(search: Record<string, unknown>\) => \(\{([\s\S]*?)\}\),/, "validateSearch: (search: Record<string, unknown>): { query?: string } => ({\n$1}),");
  fs.writeFileSync(file3, c3);
}

