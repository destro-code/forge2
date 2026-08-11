import fs from "fs";
const file = "src/routes/assessment.$pathId.tsx";
let c = fs.readFileSync(file, "utf8");
c = c.replace(/\s*isFlagged=\{[\s\S]*?\}/g, "");
c = c.replace(/\s*onToggleFlag=\{[\s\S]*?\}/g, "");
fs.writeFileSync(file, c);
