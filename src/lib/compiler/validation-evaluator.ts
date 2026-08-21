import type {
  ExerciseValidationSpec,
  ValidationAssertion,
  ValidationReport,
  ValidationTestResult,
} from "./types/validation";

/**
 * Pure evaluation function for running assertions against an environment object
 * representing the iframe's DOM window and document.
 * Used both for node/unit testing and direct execution.
 */
export function executeAssertion(
  assertion: ValidationAssertion,
  doc: Document,
  win: Window,
  timeoutMs: number = 2000,
): ValidationTestResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const { strategy, expected, failureMessage = "Assertion failed" } = assertion;
  const target = "target" in assertion ? assertion.target : undefined;

  try {
    if (strategy === "dom_query") {
      if (!target) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: "Target CSS selector is required for dom_query strategy.",
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      let elements: NodeListOf<Element>;
      try {
        elements = doc.querySelectorAll(target);
      } catch (selErr) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: `Invalid CSS selector "${target}": ${selErr instanceof Error ? selErr.message : String(selErr)}`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      // 1. Check exists
      if (expected.exists !== undefined) {
        const doesExist = elements.length > 0;
        if (expected.exists === true && !doesExist) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage || `Expected element matching "${target}" to exist in DOM.`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
        if (expected.exists === false && doesExist) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage || `Expected element matching "${target}" NOT to exist in DOM.`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      if (expected.exists === false && elements.length === 0) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "passed",
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      // 2. Check count
      if (expected.count !== undefined) {
        if (elements.length !== expected.count) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage ||
              `Expected ${expected.count} element(s) matching "${target}", but found ${elements.length}.`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      const firstEl = elements[0];
      if (
        !firstEl &&
        (expected.textContains !== undefined ||
          expected.textExact !== undefined ||
          expected.attributes !== undefined ||
          expected.hasClasses !== undefined)
      ) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage:
            failureMessage ||
            `Cannot check element properties: no element found matching "${target}".`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      // 3. Check textContains
      if (expected.textContains !== undefined) {
        const searchStr = String(expected.textContains);
        let anyMatched = false;
        for (let i = 0; i < elements.length; i++) {
          const text = (elements[i].textContent || "").trim();
          if (text.indexOf(searchStr) !== -1) {
            anyMatched = true;
            break;
          }
        }
        if (!anyMatched) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage || `Expected text matching "${searchStr}" not found in "${target}".`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      // 4. Check textExact
      if (expected.textExact !== undefined) {
        const actualExact = (firstEl.textContent || "").trim();
        const expectedExact = String(expected.textExact).trim();
        if (actualExact !== expectedExact) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage ||
              `Expected exact text "${expectedExact}", but found "${actualExact}".`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      // 5. Check attributes
      if (expected.attributes && typeof expected.attributes === "object") {
        for (const [attrName, val] of Object.entries(expected.attributes)) {
          const expectedVal = String(val);
          const actualVal = firstEl.getAttribute(attrName);
          if (actualVal !== expectedVal) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: "failed",
              errorMessage:
                failureMessage ||
                `Attribute mismatch on "${target}": ${attrName}="${actualVal}" (expected "${expectedVal}").`,
              durationMs: Math.round(
                (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
              ),
            };
          }
        }
      }

      // 6. Check hasClasses
      if (Array.isArray(expected.hasClasses)) {
        for (const className of expected.hasClasses) {
          if (!firstEl.classList.contains(className)) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: "failed",
              errorMessage:
                failureMessage || `Expected element "${target}" to have class "${className}".`,
              durationMs: Math.round(
                (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
              ),
            };
          }
        }
      }

      return {
        assertionId: assertion.id,
        description: assertion.description,
        status: "passed",
        durationMs: Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
        ),
      };
    }

    if (strategy === "computed_style") {
      if (!target) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: "Target CSS selector is required for computed_style strategy.",
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      let el: Element | null;
      try {
        el = doc.querySelector(target);
      } catch (selErr2) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: `Invalid CSS selector "${target}": ${selErr2 instanceof Error ? selErr2.message : String(selErr2)}`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      if (!el) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage:
            failureMessage || `Cannot compute style: element "${target}" not found in DOM.`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      const computed = win.getComputedStyle(el, expected.pseudoElement || null);
      const prop = expected.property;
      if (!prop) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: "CSS property name is required in computed_style expectation.",
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      const actualStyle = (
        computed.getPropertyValue(prop) ||
        (computed as unknown as Record<string, string>)[prop] ||
        ""
      ).trim();
      const expectedStyle = (String(expected.value) || "").trim();

      if (actualStyle.toLowerCase() !== expectedStyle.toLowerCase()) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage:
            failureMessage ||
            `Computed style mismatch for ${prop} on "${target}": found "${actualStyle}" (expected "${expectedStyle}").`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      return {
        assertionId: assertion.id,
        description: assertion.description,
        status: "passed",
        durationMs: Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
        ),
      };
    }

    if (strategy === "js_evaluation") {
      const expr = expected.expression;
      if (!expr) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: "JavaScript expression is required for js_evaluation expectation.",
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      let evalResult: unknown;
      const evalStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      try {
        const evaluator = new Function("return (" + expr + ");");
        evalResult = evaluator();
      } catch (evalErr) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage:
            failureMessage ||
            `Expression error: ${evalErr instanceof Error ? evalErr.message : String(evalErr)}`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      const evalElapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - evalStartTime;
      if (evalElapsed > (timeoutMs || 2000)) {
        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: "failed",
          errorMessage: `Expression evaluation timed out after ${Math.round(evalElapsed)}ms.`,
          durationMs: Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
          ),
        };
      }

      if (expected.typeOf !== undefined) {
        const actualType = typeof evalResult;
        if (actualType !== expected.typeOf) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage ||
              `Expected expression typeof to be "${expected.typeOf}", but received "${actualType}".`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      if (expected.expectedValue !== undefined) {
        const expectedVal = expected.expectedValue;
        let isEqual = false;
        if (evalResult === expectedVal) {
          isEqual = true;
        } else if (typeof evalResult === "object" && typeof expectedVal === "object") {
          try {
            isEqual = JSON.stringify(evalResult) === JSON.stringify(expectedVal);
          } catch {
            isEqual = false;
          }
        }

        if (!isEqual) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: "failed",
            errorMessage:
              failureMessage ||
              `Expression value mismatch: evaluated to ${JSON.stringify(evalResult)}, expected ${JSON.stringify(expectedVal)}.`,
            durationMs: Math.round(
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
            ),
          };
        }
      }

      return {
        assertionId: assertion.id,
        description: assertion.description,
        status: "passed",
        durationMs: Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
        ),
      };
    }

    return {
      assertionId: assertion.id,
      description: assertion.description,
      status: "skipped",
      errorMessage: `Strategy "${strategy}" is not supported in this runtime version.`,
      durationMs: Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
      ),
    };
  } catch (unhandledErr) {
    return {
      assertionId: assertion.id,
      description: assertion.description,
      status: "failed",
      errorMessage: `Unhandled error evaluating assertion: ${unhandledErr instanceof Error ? unhandledErr.message : String(unhandledErr)}`,
      durationMs: Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime,
      ),
    };
  }
}

/**
 * Executes an entire validation specification against a document/window context.
 */
export function executeValidationSuite(
  spec: ExerciseValidationSpec,
  doc: Document,
  win: Window,
): ValidationReport {
  const assertions = spec.assertions || [];
  const stopOnFirstFailure = Boolean(spec.stopOnFirstFailure);
  const results: ValidationTestResult[] = [];
  let passedRequiredCount = 0;
  let totalRequired = 0;
  let hasRequiredFailure = false;

  for (const a of assertions) {
    if (!a.isOptional) {
      totalRequired++;
    }
  }

  let stoppedEarly = false;
  for (const assertion of assertions) {
    if (stoppedEarly) {
      results.push({
        assertionId: assertion.id,
        description: assertion.description,
        status: "skipped",
        errorMessage: "Skipped due to stopOnFirstFailure.",
        durationMs: 0,
      });
      continue;
    }

    const res = executeAssertion(assertion, doc, win, 2000);
    results.push(res);

    if (res.status === "passed") {
      if (!assertion.isOptional) {
        passedRequiredCount++;
      }
    } else if (res.status === "failed") {
      if (!assertion.isOptional) {
        hasRequiredFailure = true;
        if (stopOnFirstFailure) {
          stoppedEarly = true;
        }
      }
    }
  }

  const overallStatus =
    totalRequired === 0 || (!hasRequiredFailure && passedRequiredCount === totalRequired)
      ? "passed"
      : "failed";

  return {
    exerciseId: spec.exerciseId,
    status: overallStatus,
    results,
    passedCount: passedRequiredCount,
    totalRequired,
    timestamp: Date.now(),
  };
}
