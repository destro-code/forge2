import type {
  CanonicalActivity,
  Misconception,
  MultipleChoiceActivity,
  MultiSelectActivity,
  DebugActivity,
  InteractiveCodeActivity,
  FillBlankActivity,
  OutputPredictionActivity,
} from "@/lib/curriculum/types";
import type { ActivityEvaluationResult, MisconceptionMatchResult } from "./types";

interface MisconceptionMatchCandidate {
  misconception: Misconception;
  confidence: number;
  matchedIndicator: string;
  explanation: string;
  correction: string;
}

/**
 * Normalizes strings for deterministic, case-insensitive keyword analysis.
 */
function normalizeText(text: unknown): string {
  if (typeof text !== "string") {
    if (text === null || text === undefined) return "";
    return String(text).toLowerCase();
  }
  return text.toLowerCase().trim();
}

/**
 * Deterministically evaluates whether a learner's incorrect activity response
 * exhibits a known misconception from the curriculum ontology.
 *
 * Guaranteed Invariants:
 * - If response is valid (`validationResult.isValid === true`), returns `null`.
 * - If response is empty or unidentifiable, returns `null`.
 * - Non-LLM, strictly deterministic pattern and indicator matcher.
 * - Always includes the curated misconception correction guidance.
 */
export function matchMisconception(
  activity: CanonicalActivity,
  response: unknown,
  validationResult: ActivityEvaluationResult,
  misconceptions: Misconception[],
  context?: {
    attempts?: number;
    previousResponses?: unknown[];
  },
): MisconceptionMatchResult | null {
  // Gating 1: Never diagnose a misconception on a correct response
  if (!validationResult || validationResult.isValid) {
    return null;
  }

  // Gating 2: Empty or absent response cannot be diagnosed
  if (response === null || response === undefined || response === "") {
    return null;
  }

  if (!Array.isArray(misconceptions) || misconceptions.length === 0) {
    return null;
  }

  const candidates: MisconceptionMatchCandidate[] = [];
  const responseStr = typeof response === "object" ? JSON.stringify(response) : String(response);
  const normalizedResponse = normalizeText(responseStr);

  // -------------------------------------------------------------------------
  // Rule 1: Shotgun Debugging (misc-random-code-tweaking)
  // -------------------------------------------------------------------------
  const shotgunMisc = misconceptions.find((m) => m.id === "misc-random-code-tweaking");
  if (shotgunMisc && (context?.attempts ?? 0) >= 4) {
    candidates.push({
      misconception: shotgunMisc,
      confidence: 0.95,
      matchedIndicator: shotgunMisc.indicators[0] || "Multiple rapid speculative attempts",
      explanation:
        "Multiple failed attempts were submitted without isolating the bug's root cause.",
      correction: shotgunMisc.correction,
    });
  }

  // -------------------------------------------------------------------------
  // Rule 2: HTML Void Elements Closing Tags (misc-all-tags-need-closing-tags)
  // -------------------------------------------------------------------------
  const voidTagMisc = misconceptions.find((m) => m.id === "misc-all-tags-need-closing-tags");
  if (voidTagMisc) {
    const hasVoidClosing =
      normalizedResponse.includes("</img>") ||
      normalizedResponse.includes("</input>") ||
      normalizedResponse.includes("</br>") ||
      normalizedResponse.includes("</hr>") ||
      normalizedResponse.includes("</meta>") ||
      normalizedResponse.includes("</link>");

    if (hasVoidClosing) {
      candidates.push({
        misconception: voidTagMisc,
        confidence: 0.98,
        matchedIndicator: voidTagMisc.indicators[0] || "Writing closing tags for void elements",
        explanation:
          "Void elements like <img>, <input>, and <br> cannot have closing tags in HTML5.",
        correction: voidTagMisc.correction,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rule 3: JS Return vs Console.log (misc-return-vs-console-log)
  // -------------------------------------------------------------------------
  const returnLogMisc = misconceptions.find((m) => m.id === "misc-return-vs-console-log");
  if (returnLogMisc) {
    const isConsoleLogWithoutReturn =
      (normalizedResponse.includes("console.log") && !normalizedResponse.includes("return")) ||
      normalizedResponse === "undefined" ||
      normalizedResponse === '"undefined"';

    if (isConsoleLogWithoutReturn) {
      candidates.push({
        misconception: returnLogMisc,
        confidence: 0.92,
        matchedIndicator:
          returnLogMisc.indicators[0] || "Using console.log() and expecting return value",
        explanation:
          "console.log() prints side-effects to developer tools, but does not return a value.",
        correction: returnLogMisc.correction,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rule 4: Frontend Definition & Aesthetics (misc-frontend-is-just-ui-styling)
  // -------------------------------------------------------------------------
  const frontendDefMisc = misconceptions.find((m) => m.id === "misc-frontend-is-just-ui-styling");
  if (frontendDefMisc && activity.type === "multiple-choice") {
    const mcActivity = activity as MultipleChoiceActivity;
    // Check if user selected visual design / aesthetics option
    const selectedOption = mcActivity.content.options.find(
      (opt) => opt.id === response || opt.text === response,
    );
    if (selectedOption) {
      const optText = normalizeText(selectedOption.text);
      if (
        optText.includes("illustration") ||
        optText.includes("vector") ||
        optText.includes("drawing") ||
        optText.includes("mockup") ||
        optText.includes("graphic")
      ) {
        candidates.push({
          misconception: frontendDefMisc,
          confidence: 0.9,
          matchedIndicator:
            frontendDefMisc.indicators[1] || "Treating frontend solely as visual design",
          explanation:
            "Frontend engineering includes client architecture, accessibility, and state management, not just visual art.",
          correction: frontendDefMisc.correction,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Rule 5: Flexbox Alignment Axes (misc-justify-vs-align-items)
  // -------------------------------------------------------------------------
  const flexAxesMisc = misconceptions.find((m) => m.id === "misc-justify-vs-align-items");
  if (flexAxesMisc) {
    if (
      normalizedResponse.includes("justify-content") &&
      (normalizedResponse.includes("vertical") || normalizedResponse.includes("cross"))
    ) {
      candidates.push({
        misconception: flexAxesMisc,
        confidence: 0.88,
        matchedIndicator:
          flexAxesMisc.indicators[0] || "Assuming justify-content is always horizontal",
        explanation:
          "justify-content always aligns along the main axis, which changes direction with flex-direction.",
        correction: flexAxesMisc.correction,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rule 6: Box Model Padding vs Margin (misc-padding-vs-margin)
  // -------------------------------------------------------------------------
  const boxModelMisc = misconceptions.find((m) => m.id === "misc-padding-vs-margin");
  if (boxModelMisc) {
    if (
      normalizedResponse.includes("margin") &&
      (normalizedResponse.includes("click") ||
        normalizedResponse.includes("background") ||
        normalizedResponse.includes("inside"))
    ) {
      candidates.push({
        misconception: boxModelMisc,
        confidence: 0.88,
        matchedIndicator: boxModelMisc.indicators[0] || "Using margin where padding is required",
        explanation:
          "Padding is inside the border (affecting background & click area), while margin is external clearance.",
        correction: boxModelMisc.correction,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rule 7: Generic Indicator Keyword Matching
  // -------------------------------------------------------------------------
  for (const misc of misconceptions) {
    // Avoid re-evaluating already matched misconceptions
    if (candidates.some((c) => c.misconception.id === misc.id)) {
      continue;
    }

    for (const indicator of misc.indicators) {
      const normalizedIndicator = normalizeText(indicator);
      const indicatorKeywords = normalizedIndicator
        .split(/[^a-z0-9_-]+/)
        .filter((w) => w.length > 4);

      let matchedKeywordsCount = 0;
      for (const kw of indicatorKeywords) {
        if (normalizedResponse.includes(kw)) {
          matchedKeywordsCount++;
        }
      }

      if (indicatorKeywords.length > 0 && matchedKeywordsCount >= 2) {
        candidates.push({
          misconception: misc,
          confidence: Math.min(
            0.85,
            0.5 + (matchedKeywordsCount / indicatorKeywords.length) * 0.35,
          ),
          matchedIndicator: indicator,
          explanation: `Response patterns align with known indicator: "${indicator}".`,
          correction: misc.correction,
        });
        break;
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort deterministically: highest confidence first, then alphabetical by misconception.id
  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.misconception.id.localeCompare(b.misconception.id);
  });

  const bestMatch = candidates[0];

  return {
    misconceptionId: bestMatch.misconception.id,
    misconceptionTitle: bestMatch.misconception.title,
    conceptId: bestMatch.misconception.conceptId,
    matchedIndicator: bestMatch.matchedIndicator,
    confidence: Math.round(bestMatch.confidence * 100) / 100,
    explanation: bestMatch.explanation,
    correction: bestMatch.correction,
  };
}
