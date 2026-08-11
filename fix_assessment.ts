import fs from "fs";

const file = "src/routes/assessment.$pathId.tsx";
let c = fs.readFileSync(file, "utf8");

c = c.replace(
  /<MultipleQuestionCard([\s\S]*?)answer={([\s\S]*?)}([\s\S]*?)onChangeAnswer={([\s\S]*?)}/g,
  "<MultipleQuestionCard$1selectedAnswers={$2}$3onSelectAnswer={$4}",
);
c = c.replace(
  /<OrderingQuestionCard([\s\S]*?)answer={([\s\S]*?)}([\s\S]*?)onChangeAnswer={([\s\S]*?)}/g,
  "<OrderingQuestionCard$1currentOrder={$2}$3onOrderChange={$4}",
);
c = c.replace(
  /<DragDropQuestionCard([\s\S]*?)answer={([\s\S]*?)}([\s\S]*?)onChangeAnswer={([\s\S]*?)}/g,
  "<DragDropQuestionCard$1currentMatches={$2}$3onMatchChange={$4}",
);
c = c.replace(
  /<CodeQuestionCard([\s\S]*?)answer={([\s\S]*?)}([\s\S]*?)onChangeAnswer={([\s\S]*?)}/g,
  "<CodeQuestionCard$1selectedAnswer={$2}$3onSelectAnswer={$4}",
);
c = c.replace(
  /<FillInBlankQuestionCard([\s\S]*?)answer={([\s\S]*?)}([\s\S]*?)onChangeAnswer={([\s\S]*?)}/g,
  "<FillInBlankQuestionCard$1userAnswer={$2}$3onAnswerChange={$4}",
);

fs.writeFileSync(file, c);
