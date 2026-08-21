/**
 * Client-side script template injected into the sandbox iframe to handle
 * PLAYGROUND_VALIDATE_REQUEST messages, execute DOM, computed_style, and
 * js_evaluation assertions, and reply with PLAYGROUND_VALIDATE_RESPONSE.
 */
export const VALIDATION_RUNNER_SCRIPT = `
(function() {
  var isCurrentlyValidating = false;

  function runAssertion(assertion, timeoutMs) {
    var startTime = performance.now();
    var strategy = assertion.strategy;
    var target = assertion.target;
    var expected = assertion.expected || {};
    var failureMessage = assertion.failureMessage || 'Assertion failed';

    try {
      if (strategy === 'dom_query') {
        if (!target) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'Target CSS selector is required for dom_query strategy.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var elements;
        try {
          elements = document.querySelectorAll(target);
        } catch (selErr) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'Invalid CSS selector "' + target + '": ' + (selErr && selErr.message ? selErr.message : String(selErr)),
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        // 1. Check exists
        if (expected.exists !== undefined) {
          var doesExist = elements.length > 0;
          if (expected.exists === true && !doesExist) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected element matching "' + target + '" to exist in DOM.',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
          if (expected.exists === false && doesExist) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected element matching "' + target + '" NOT to exist in DOM.',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        // If exists was false and succeeded, we can finish early if no count specified
        if (expected.exists === false && elements.length === 0) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        // 2. Check count
        if (expected.count !== undefined) {
          if (elements.length !== expected.count) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected ' + expected.count + ' element(s) matching "' + target + '", but found ' + elements.length + '.',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        var firstEl = elements[0];
        if (!firstEl && (expected.textContains !== undefined || expected.textExact !== undefined || expected.attributes !== undefined || expected.hasClasses !== undefined)) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: failureMessage || 'Cannot check element properties: no element found matching "' + target + '".',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        // 3. Check textContains (matches if ANY matched element contains the text)
        if (expected.textContains !== undefined) {
          var searchStr = String(expected.textContains);
          var anyMatched = false;
          for (var i = 0; i < elements.length; i++) {
            var text = (elements[i].textContent || '').trim();
            if (text.indexOf(searchStr) !== -1) {
              anyMatched = true;
              break;
            }
          }
          if (!anyMatched) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected text matching "' + searchStr + '" not found in "' + target + '".',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        // 4. Check textExact (normalizes surrounding whitespace of first matching element)
        if (expected.textExact !== undefined) {
          var actualExact = (firstEl.textContent || '').trim();
          var expectedExact = String(expected.textExact).trim();
          if (actualExact !== expectedExact) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected exact text "' + expectedExact + '", but found "' + actualExact + '".',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        // 5. Check attributes (checks on first matching element)
        if (expected.attributes && typeof expected.attributes === 'object') {
          var attrKeys = Object.keys(expected.attributes);
          for (var a = 0; a < attrKeys.length; a++) {
            var attrName = attrKeys[a];
            var expectedVal = String(expected.attributes[attrName]);
            var actualVal = firstEl.getAttribute(attrName);
            if (actualVal !== expectedVal) {
              return {
                assertionId: assertion.id,
                description: assertion.description,
                status: 'failed',
                errorMessage: failureMessage || 'Attribute mismatch on "' + target + '": ' + attrName + '="' + actualVal + '" (expected "' + expectedVal + '").',
                durationMs: Math.round(performance.now() - startTime)
              };
            }
          }
        }

        // 6. Check hasClasses (checks on first matching element)
        if (Array.isArray(expected.hasClasses)) {
          for (var c = 0; c < expected.hasClasses.length; c++) {
            var className = expected.hasClasses[c];
            if (!firstEl.classList.contains(className)) {
              return {
                assertionId: assertion.id,
                description: assertion.description,
                status: 'failed',
                errorMessage: failureMessage || 'Expected element "' + target + '" to have class "' + className + '".',
                durationMs: Math.round(performance.now() - startTime)
              };
            }
          }
        }

        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: 'passed',
          durationMs: Math.round(performance.now() - startTime)
        };
      }

      if (strategy === 'computed_style') {
        if (!target) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'Target CSS selector is required for computed_style strategy.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var el;
        try {
          el = document.querySelector(target);
        } catch (selErr2) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'Invalid CSS selector "' + target + '": ' + (selErr2 && selErr2.message ? selErr2.message : String(selErr2)),
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        if (!el) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: failureMessage || 'Cannot compute style: element "' + target + '" not found in DOM.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var computed = window.getComputedStyle(el, expected.pseudoElement || null);
        var prop = expected.property;
        if (!prop) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'CSS property name is required in computed_style expectation.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var actualStyle = (computed.getPropertyValue(prop) || computed[prop] || '').trim();
        var expectedStyle = (String(expected.value) || '').trim();

        // Compare computed values (case-insensitive for keywords)
        if (actualStyle.toLowerCase() !== expectedStyle.toLowerCase()) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: failureMessage || 'Computed style mismatch for ' + prop + ' on "' + target + '": found "' + actualStyle + '" (expected "' + expectedStyle + '").',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: 'passed',
          durationMs: Math.round(performance.now() - startTime)
        };
      }

      if (strategy === 'js_evaluation') {
        var expr = expected.expression;
        if (!expr) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'JavaScript expression is required for js_evaluation expectation.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var evalResult;
        var evalStartTime = performance.now();
        try {
          // Evaluate expression safely within iframe scope
          var evaluator = new Function('return (' + expr + ');');
          evalResult = evaluator();
        } catch (evalErr) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: failureMessage || 'Expression error: ' + (evalErr && evalErr.message ? evalErr.message : String(evalErr)),
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        var evalElapsed = performance.now() - evalStartTime;
        if (evalElapsed > (timeoutMs || 2000)) {
          return {
            assertionId: assertion.id,
            description: assertion.description,
            status: 'failed',
            errorMessage: 'Expression evaluation timed out after ' + Math.round(evalElapsed) + 'ms.',
            durationMs: Math.round(performance.now() - startTime)
          };
        }

        // 1. Check typeOf if requested
        if (expected.typeOf !== undefined) {
          var actualType = typeof evalResult;
          if (actualType !== expected.typeOf) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expected expression typeof to be "' + expected.typeOf + '", but received "' + actualType + '".',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        // 2. Check expectedValue if specified
        if (expected.expectedValue !== undefined) {
          var expectedVal = expected.expectedValue;
          var isEqual = false;
          if (evalResult === expectedVal) {
            isEqual = true;
          } else if (typeof evalResult === 'object' && typeof expectedVal === 'object') {
            try {
              isEqual = JSON.stringify(evalResult) === JSON.stringify(expectedVal);
            } catch (jsonErr) {
              isEqual = false;
            }
          }

          if (!isEqual) {
            return {
              assertionId: assertion.id,
              description: assertion.description,
              status: 'failed',
              errorMessage: failureMessage || 'Expression value mismatch: evaluated to ' + JSON.stringify(evalResult) + ', expected ' + JSON.stringify(expectedVal) + '.',
              durationMs: Math.round(performance.now() - startTime)
            };
          }
        }

        return {
          assertionId: assertion.id,
          description: assertion.description,
          status: 'passed',
          durationMs: Math.round(performance.now() - startTime)
        };
      }

      // Unsupported strategies in Phase 2
      return {
        assertionId: assertion.id,
        description: assertion.description,
        status: 'skipped',
        errorMessage: 'Strategy "' + strategy + '" is not supported in this runtime version.',
        durationMs: Math.round(performance.now() - startTime)
      };

    } catch (unhandledErr) {
      return {
        assertionId: assertion.id,
        description: assertion.description,
        status: 'failed',
        errorMessage: 'Unhandled error evaluating assertion: ' + (unhandledErr && unhandledErr.message ? unhandledErr.message : String(unhandledErr)),
        durationMs: Math.round(performance.now() - startTime)
      };
    }
  }

  function executeValidationSpec(requestId, exerciseId, spec, workspaceRevision) {
    var assertions = (spec && spec.assertions) ? spec.assertions : [];
    var stopOnFirstFailure = !!(spec && spec.stopOnFirstFailure);
    var results = [];
    var passedRequiredCount = 0;
    var totalRequired = 0;
    var hasRequiredFailure = false;

    // Calculate total required upfront
    for (var a = 0; a < assertions.length; a++) {
      if (!assertions[a].isOptional) {
        totalRequired++;
      }
    }

    var stoppedEarly = false;
    for (var i = 0; i < assertions.length; i++) {
      var assertion = assertions[i];

      if (stoppedEarly) {
        results.push({
          assertionId: assertion.id,
          description: assertion.description,
          status: 'skipped',
          errorMessage: 'Skipped due to stopOnFirstFailure.',
          durationMs: 0
        });
        continue;
      }

      var res = runAssertion(assertion, 2000);
      results.push(res);

      if (res.status === 'passed') {
        if (!assertion.isOptional) {
          passedRequiredCount++;
        }
      } else if (res.status === 'failed') {
        if (!assertion.isOptional) {
          hasRequiredFailure = true;
          if (stopOnFirstFailure) {
            stoppedEarly = true;
          }
        }
      }
    }

    var overallStatus = (totalRequired === 0 || (!hasRequiredFailure && passedRequiredCount === totalRequired)) ? 'passed' : 'failed';

    var report = {
      exerciseId: exerciseId,
      status: overallStatus,
      results: results,
      passedCount: passedRequiredCount,
      totalRequired: totalRequired,
      timestamp: Date.now()
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'PLAYGROUND_VALIDATE_RESPONSE',
        requestId: requestId,
        exerciseId: exerciseId,
        report: report,
        workspaceRevision: workspaceRevision
      }, '*');
    }
  }

  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type !== 'PLAYGROUND_VALIDATE_REQUEST') return;

    // Security & isolation hardening: only accept messages from parent window
    if (event.source !== window.parent) return;

    var req = event.data;
    if (!req.requestId || !req.exerciseId || !req.validationSpec) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PLAYGROUND_VALIDATE_RESPONSE',
          requestId: req.requestId || 'unknown',
          exerciseId: req.exerciseId || 'unknown',
          workspaceRevision: req.workspaceRevision,
          report: {
            exerciseId: req.exerciseId || 'unknown',
            status: 'failed',
            results: [{
              assertionId: 'spec-validation-error',
              description: 'Malformed validate request',
              status: 'failed',
              errorMessage: 'Invalid or missing PLAYGROUND_VALIDATE_REQUEST payload.',
              durationMs: 0
            }],
            passedCount: 0,
            totalRequired: 1,
            timestamp: Date.now()
          }
        }, '*');
      }
      return;
    }

    // Single-threaded synchronous execution in iframe microtask queue
    if (isCurrentlyValidating) {
      // Reject concurrent request cleanly
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PLAYGROUND_VALIDATE_RESPONSE',
          requestId: req.requestId,
          exerciseId: req.exerciseId,
          workspaceRevision: req.workspaceRevision,
          report: {
            exerciseId: req.exerciseId,
            status: 'failed',
            results: [{
              assertionId: 'concurrent-request-rejected',
              description: 'Validation in progress',
              status: 'failed',
              errorMessage: 'Another validation request is already executing.',
              durationMs: 0
            }],
            passedCount: 0,
            totalRequired: 1,
            timestamp: Date.now()
          }
        }, '*');
      }
      return;
    }

    isCurrentlyValidating = true;
    try {
      executeValidationSpec(req.requestId, req.exerciseId, req.validationSpec, req.workspaceRevision);
    } finally {
      isCurrentlyValidating = false;
    }
  });
})();
`;
