const fs = require('fs');
const file = 'src/routes/learn.topics.$topicId.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<Link to={\`\/lesson\/\$\{lesson.id\}\`}>/g, '<Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>');
fs.writeFileSync(file, content);
