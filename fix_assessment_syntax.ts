import fs from "fs";
const file = "src/routes/assessment.$pathId.tsx";
let c = fs.readFileSync(file, "utf8");
c = c.replace(/\(ans: any\)/g, "(ans)");
c = c.replace(/\(ans: any: any\)/g, "(ans: any)");
c = c.replace(/ans: any ===/g, "ans ===");
c = c.replace(/ans: any\)/g, "ans)");
fs.writeFileSync(file, c);
