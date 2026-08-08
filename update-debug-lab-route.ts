import fs from "fs";

let content = fs.readFileSync("src/routes/debug-lab.$bugId.tsx", "utf8");

// 1. imports
content = content.replace(
  'import { useState } from "react";',
  'import { useState, lazy, Suspense, useEffect } from "react";',
);

content = content.replace(
  'import { InteractiveBugSimulator } from "@/components/debug-lab/interactive-bug-simulator";',
  `import { InteractiveBugSimulator } from "@/components/debug-lab/interactive-bug-simulator";
import { ErrorBoundary } from "@/components/shared/error-boundary";
const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);`,
);

// 2. update state
content = content.replace(
  'const [investigationNote, setInvestigationNote] = useState(notes[`bug:${bugId}`] || "");',
  `const [investigationNote, setInvestigationNote] = useState(notes[\`bug:\${bugId}\`] || "");
  const [userCode, setUserCode] = useState(bug?.brokenCode || "");
  
  useEffect(() => {
    if (bug && userCode === "") {
      setUserCode(bug.brokenCode);
    }
  }, [bug, userCode]);`,
);

// 3. handle tests pass
content = content.replace(
  "const handleMarkSolved = () => {",
  `const handleTestsPass = () => {
    if (!isSolved) {
      completeBug(bug.id);
      toast.success(\`Challenge Completed! You solved '\${bug.title}' 🎉\`);
    }
  };

  const handleMarkSolved = () => {`,
);

// 4. Update the interactive simulator invocation
content = content.replace(
  /<InteractiveBugSimulator[\s\S]*?\/>/,
  `<ErrorBoundary
                  title="Interactive Simulator Error"
                  description="An unexpected exception occurred inside this bug diagnostic simulator."
                >
                  <InteractiveBugSimulator
                    bug={bug}
                    userCode={activeCodeTab === "fixed" ? bug.fixedCode : userCode}
                    onAllTestsPass={handleTestsPass}
                  />
                </ErrorBoundary>`,
);

// 5. Update code inspector tabs
content = content.replace(/Broken Code/g, `Your Fix`);

content = content.replace(/Broken Code Implementation/g, `Editable Code Workspace`);

content = content.replace(
  /<CodeBlock language="tsx" code=\{bug.brokenCode\} \/>/,
  `<div className="h-[400px] mt-2 rounded overflow-hidden border border-border">
                    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading editor...</div>}>
                      <MonacoEditor
                        height="100%"
                        language="typescript"
                        theme="vs-dark"
                        value={userCode}
                        onChange={(val) => setUserCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
                          padding: { top: 16 },
                        }}
                      />
                    </Suspense>
                  </div>`,
);

// Also remove the manual 'Test Broken Bug' buttons from top of simulator
content = content.replace(
  /<div className="flex gap-1">[\s\S]*?Test Fixed Version[\s\S]*?<\/Button>\s*<\/div>/,
  "",
);

fs.writeFileSync("src/routes/debug-lab.$bugId.tsx", content);
