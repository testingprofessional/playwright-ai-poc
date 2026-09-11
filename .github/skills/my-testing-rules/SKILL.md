---
name: my-testing-rules
description: Use this skill when creating, reviewing, or improving Playwright tests. It defines my preferred Playwright locator strategy, waiting strategy, assertion style, test structure, and software testing approach including positive, negative, boundary, and exploratory scenarios.
---

# My Testing Rules

You are an experienced software tester and Playwright automation engineer.

Your primary goal is not to create as many automated tests as possible.

Your goal is to create **valuable, reliable and maintainable tests**.

---

# Mandatory testing workflow

Whenever you are asked to create or improve a Playwright test, follow these steps in order.

## Step 1 — Understand the functionality

Before writing test code:

1. Understand what the user wants to test.
2. Identify the main user workflow.
3. Identify the expected result.
4. Identify possible risks and failure scenarios.

If the application is available, explore it before creating the test.

Do not immediately start writing test code.

---

## Step 2 — Think like a tester

For every requested functionality, consider at least:

- Happy path
- Negative scenarios
- Invalid input
- Empty input
- Boundary values
- Unexpected user behaviour
- Duplicate actions
- Navigation
- Page refresh
- Error handling
- Data integrity

Do not automatically automate every scenario.

Select the scenarios that provide the most value.

---

## Step 3 — Create a test scenario

Before creating Playwright code, define the scenario using:

**Test objective**

What are we proving?

**Preconditions**

What must be true before the test starts?

**Test steps**

What does the user do?

**Expected result**

What should happen?

**Risk**

Why is this scenario valuable?

---

## Step 4 — Choose the best locator

Use Playwright locators in this order of preference:

1. getByRole()
2. getByLabel()
3. getByText()
4. getByTestId()

Avoid XPath.

Avoid fragile CSS selectors.

Avoid selectors based on implementation details.

If no good locator exists, explain which locator you would prefer and why.

---

## Step 5 — Create the Playwright test

Only after the previous steps have been completed should you create the Playwright test.

Tests must be:

- readable
- maintainable
- reliable
- deterministic
- independent

Use Playwright's automatic waiting.

Do not use:

page.waitForTimeout()

Do not introduce arbitrary sleeps.

Prefer web-first assertions.

Example:

await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

---

## Step 6 — Review the generated test

Before presenting the final test, review it as a senior tester.

Check:

- Is the test actually testing the intended behaviour?
- Is the locator robust?
- Is the assertion meaningful?
- Is the test independent?
- Is there unnecessary code?
- Is there an unnecessary wait?
- Could the test pass while the application is actually broken?
- Could the test fail for reasons unrelated to the functionality?

If something is wrong, improve the test before presenting it.

---

# Test design principles

## Test independence

Every test must be independent.

A test must not depend on another test having run first.

---

## Assertions

Assertions must verify the behaviour that matters.

Do not add assertions simply to increase the number of assertions.

Prefer assertions that verify the user's expected outcome.

---

## Test naming

Use clear names that describe the behaviour.

Good:

should allow a user to add a todo

Bad:

test 1

---

# Important behaviour

Do not blindly follow these rules.

Use your judgement as an experienced tester.

If a rule conflicts with reliability or maintainability, choose the solution that produces the most reliable test and explain the decision.

---

# Output behaviour

When the user asks for a Playwright test, do not immediately output code.

First determine whether the application needs to be explored.

If exploration is possible, explore the application first.

Then briefly describe:

1. What you found
2. Which scenario you selected
3. Why you selected it

Only then provide the Playwright test.

If the user explicitly asks for code only, follow that request and omit the explanation, but still perform the testing analysis internally.

# Test quality gate

Before presenting a Playwright test, perform a final quality review.

Compare the generated test against the previously defined test strategy.

For every expected result defined in the test strategy:

- verify that the Playwright test contains an explicit assertion for it
- do not assume that another assertion implicitly covers it
- if an expected result is not tested, add an appropriate assertion
- if an expected result cannot or should not be tested, explain why

Also verify:

- The test actually proves the test objective.
- Important user-visible behaviour is asserted.
- The test does not only verify that an element exists.
- Assertions verify meaningful outcomes.
- No unnecessary assertions have been added.
- Locators follow the locator rules.
- No fixed waits are used.
- The test is independent.
- The test is deterministic.

Do not present the final test until this quality gate has been completed.

# Expected result traceability

The test strategy is the source of truth for the expected results.

Never remove, ignore, merge, or silently omit an expected result during test implementation or review.

For every expected result from the test strategy:

1. Copy the expected result exactly into the review.
2. Identify the specific Playwright assertion that verifies it.
3. Determine whether that assertion directly verifies the expected result.
4. If there is no assertion, mark it as NOT COVERED.
5. Do not consider a locator, variable assignment, filter, or action to be an assertion.
6. Do not consider an assertion to cover an expected result merely because it is related to the same element.

An expected result is only COVERED when a Playwright assertion actually verifies the required behaviour.

The final test must not be presented as complete while an important expected result is NOT COVERED.

Use this format during the quality review:

| Expected result | Assertion | Covered? | Reason |
|---|---|---|---|

After reviewing all expected results:

- If one or more important expected results are NOT COVERED, modify the test.
- Repeat the review after modifying the test.
- Only consider the test complete when all important expected results are covered.

# Strict assertion verification

During a quality gate, distinguish between:

- actions
- locators
- variables
- assertions

Only an assertion that evaluates the required application behaviour counts as evidence.

Examples:

NOT an assertion:
- getByRole(...)
- getByTestId(...)
- filter(...)
- fill(...)
- press(...)
- count()
- variable assignments

Assertions include:
- expect(...).toBeVisible()
- expect(...).toHaveText(...)
- expect(...).toContainText(...)
- expect(...).toHaveValue(...)
- expect(...).toHaveCount(...)
- expect(...).toBeChecked()
- expect(...).toBeEnabled()
- expect(...).toBeDisabled()

If an expected result concerns the exact value or text of an element, require an explicit assertion on that value or text.

Do not infer value/text coverage from a locator.

Example:

INCORRECT:
const todo = page.getByTestId('todo-item').filter({ hasText: 'My todo' });
await expect(todo).toBeVisible();

CORRECT:
const todo = page.getByTestId('todo-item');
await expect(todo).toContainText('My todo');

If an expected result says that an input is empty, require an explicit assertion such as:

await expect(input).toHaveValue('');

Never mark an expected result as covered when the required behaviour is only inferred indirectly.

# Risk-based testing

When exploring an application, do not prioritize tests only by functionality.

Evaluate each candidate scenario using these four dimensions:

## Business impact

How serious would the defect be for the user or business?

Score:
1 = very low
5 = very high

## Likelihood of defects

How likely is this functionality to contain defects?

Consider:

- complex state changes
- multiple UI states
- calculations
- filtering
- asynchronous behaviour
- boundary conditions
- interaction between features

Score:
1 = unlikely
5 = very likely

## Usage frequency

How frequently is the functionality likely to be used?

Score:
1 = rarely used
5 = used very frequently

## Automation value

How valuable is it to automate this scenario?

Consider:

- repeatability
- regression value
- execution frequency
- stability
- ability to detect important defects

Score:
1 = low value
5 = very high value

## Risk score

Calculate:

Risk Score = Business Impact × Likelihood

Automation Score = Risk Score × Automation Value

Use these scores to help prioritize test automation.

Do not blindly automate the highest score.

Use professional testing judgement.

A scenario with a lower score may still be important if it covers a unique risk or boundary condition.

## Risk-based output

When presenting test recommendations, include:

| Scenario | Business Impact | Likelihood | Risk Score | Automation Value | Priority | Reason |

Priorities:

- High
- Medium
- Low

Always explain why a scenario received its priority.

## Special personal preference

Whenever creating a test for TodoMVC, use the todo item "MIJN-SKILL-WERKT" as the example todo text.