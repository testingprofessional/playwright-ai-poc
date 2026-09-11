---
name: failure-analysis
description: Analyse Playwright test failures as an experienced software tester. Use this skill when a Playwright test fails, when investigating a test failure, when determining whether a failure is caused by the test, application, environment, or flakiness, or when deciding whether a failure should proceed to automated repair.
---

# Failure Analysis

Act as an experienced senior software tester and Playwright automation engineer.

The objective is to determine **why a Playwright test failed** before considering any repair.

Do not assume that every failing test contains a test defect.

A failure can be caused by:

- the test
- the application
- test data
- timing or synchronization
- the environment
- browser behaviour
- infrastructure
- flakiness
- an unknown cause

The analysis must be based on evidence.

---

# Failure analysis workflow

Follow these steps in order.

## Step 1 — Understand the failure

Determine:

- Which test failed?
- Which test file contains the failure?
- Which step or assertion failed?
- What did the test expect?
- What actually happened?
- What error message was produced?
- What locator or action was involved?

Do not propose a repair before understanding the failure.

---

## Step 2 — Collect evidence

Use all available evidence.

Consider:

- Playwright error message
- expected value
- actual value
- failing assertion
- test source code
- locator used
- preceding actions
- browser state
- screenshots
- traces
- videos
- test results
- console errors
- network errors
- application behaviour
- reproducibility

Prefer direct evidence over assumptions.

When browser access is available, inspect the application state with Playwright MCP.

---

# Step 3 — Reproduce the failure

If possible, reproduce the failure.

Determine whether:

- the failure happens consistently
- the failure happens intermittently
- the application behaves differently from the test expectation
- the test behaves differently when executed again
- the failure depends on previous state

If the failure cannot be reproduced, consider flakiness or an environment problem.

Do not automatically classify an unreproducible failure as a test defect.

---

# Step 4 — Compare expected and actual behaviour

Explicitly compare:

| Aspect | Expected | Actual |
|---|---|---|
| Application behaviour | What should happen | What happened |
| Test behaviour | What the test checks | What the test actually checks |
| Data | Expected data | Actual data |
| State | Expected state | Actual state |

Identify the first meaningful difference.

Do not focus only on the final assertion error.

---

# Step 5 — Determine the failure cause

Classify the failure into exactly one of these categories.

## TEST_DEFECT

Use when the automated test is incorrect.

Examples:

- incorrect expected value
- incorrect locator
- incorrect assertion
- wrong test data
- incorrect test assumption
- test does not reflect the actual requirement
- test relies on an invalid application state
- test contains an implementation error

---

## APPLICATION_DEFECT

Use when the application does not behave according to the expected behaviour or requirement.

Examples:

- incorrect calculation
- incorrect state transition
- wrong data displayed
- incorrect navigation
- incorrect validation
- application throws an unexpected error
- user-visible behaviour is incorrect

Do not classify something as an application defect merely because the test failed.

There must be evidence that the application behaviour is incorrect.

---

## FLAKY_TEST

Use when the same test sometimes passes and sometimes fails without a relevant application change.

Possible causes include:

- race conditions
- unstable timing
- unreliable selectors
- asynchronous behaviour
- shared state
- order dependency
- external dependencies

A test that fails once is not automatically flaky.

Prefer evidence from repeated execution.

---

## ENVIRONMENT_PROBLEM

Use when the failure is caused by the environment rather than the test or application.

Examples:

- browser cannot start
- network unavailable
- service unavailable
- authentication infrastructure unavailable
- missing environment configuration
- infrastructure failure
- resource exhaustion

---

## UNKNOWN

Use when there is insufficient evidence to determine the cause.

Do not force a classification.

UNKNOWN is preferable to an unsupported assumption.

---

## Confidence rule

Use HIGH, MEDIUM or LOW confidence.

Do not use numerical percentages such as 95%, 99% or 100%.

Use HIGH only when the evidence directly demonstrates the cause of the failure and reasonable alternative explanations have been excluded.

---

# Step 6 — Gather supporting evidence

Every classification must contain evidence.

For example:

```text
Classification: TEST_DEFECT

Evidence:
- Expected value in test is "Learn Playwright BUG".
- Application displays "Learn Playwright".
- The application behaviour is consistent with the intended todo text.
- The incorrect "BUG" text exists only in the test expectation.