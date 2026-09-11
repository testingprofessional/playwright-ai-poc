---
name: risk-based-testing
description: Perform risk-based software testing analysis. Use this skill when exploring an application, identifying testing risks, designing test scenarios, prioritizing automation, or determining which tests provide the highest regression value.
---

# Risk-Based Testing

Act as an experienced senior software tester.

The objective is not to identify the largest possible number of tests.

The objective is to identify the tests that provide the highest value based on business impact, defect risk, user behaviour and automation value.

---

# Risk-based testing workflow

When asked to perform a risk-based testing analysis, follow these steps in order.

## Step 1 — Explore the application

If the application is available, explore it before making recommendations.

Use the available browser automation tools to understand:

- main user workflows
- available functionality
- application state
- different UI states
- navigation
- filters
- forms
- validation
- error handling
- state transitions
- interactions between features

Do not base the analysis only on assumptions.

Use observed application behaviour as evidence whenever possible.

---

## Step 2 — Identify user-facing functionality

Create a list of the important functionality discovered during exploration.

Do not simply list UI elements.

Think in terms of user goals and workflows.

For example:

Good:

- User can create a todo
- User can complete a todo
- User can filter todos

Less useful:

- There is an input field
- There is a button
- There is a checkbox

---

## Step 3 — Identify risks

For every important functionality, identify potential risks.

Consider at least:

- incorrect application state
- incorrect data
- incorrect calculations
- wrong item being modified
- wrong item being deleted
- incorrect visibility
- incorrect navigation
- invalid input
- empty input
- boundary conditions
- duplicate actions
- unexpected user behaviour
- state transitions
- interactions between features
- persistence problems
- error handling

Do not limit the analysis to happy-path failures.

---

# Risk scoring

Evaluate each important test scenario using four dimensions.

## Business Impact

How serious would the defect be for the user or business?

Score:

1 = very low impact

2 = low impact

3 = moderate impact

4 = high impact

5 = very high impact

---

## Likelihood

How likely is this scenario to contain defects?

Consider:

- complexity
- state changes
- number of interacting components
- validation
- calculations
- asynchronous behaviour
- boundary conditions
- historical defect patterns if known

Score:

1 = very unlikely

2 = unlikely

3 = possible

4 = likely

5 = very likely

Do not assign a high likelihood merely because a scenario sounds complicated.

Base the score on observable evidence or explain the assumption.

---

## Usage Frequency

How frequently is this functionality likely to be used?

Score:

1 = very rarely

2 = rarely

3 = occasionally

4 = frequently

5 = very frequently

If actual usage data is unavailable, explicitly state that the score is an assumption.

---

## Automation Value

How valuable would automated regression testing be for this scenario?

Consider:

- repeatability
- regression value
- execution frequency
- stability
- maintenance effort
- ability to detect important defects
- suitability for automated testing

Score:

1 = very low value

2 = low value

3 = moderate value

4 = high value

5 = very high value

---

# Calculations

Calculate:

Risk Score = Business Impact × Likelihood

Automation Score = Risk Score × Usage Frequency × Automation Value

Use the scores to support prioritization.

Do not blindly prioritize based only on the numerical score.

Professional testing judgement takes precedence.

---

# Interaction risks

Always consider whether functionality works correctly when combined with other functionality.

Examples:

- add → filter
- toggle → filter
- filter → delete
- toggle → clear completed
- edit → filter
- add → refresh
- delete → empty state

Interaction risks should be considered separately from individual feature risks.

---

# Boundary and negative scenarios

For important functionality, actively look for:

- empty values
- invalid values
- whitespace
- minimum values
- maximum values
- very long values
- special characters
- duplicate actions
- repeated actions
- zero items
- one item
- many items
- invalid state transitions

Do not automatically recommend every possible edge case.

Select the cases that provide meaningful risk coverage.

---

# Test prioritization

Classify scenarios as:

## High

Important regression coverage.

The scenario represents significant business or user risk and has strong automation value.

## Medium

Useful regression coverage but less critical.

## Low

Limited risk, limited usage or limited automation value.

Low-priority scenarios should not automatically be automated simply because they are technically possible.

---

# Priority decision

Priority must not be determined automatically from the numerical score.

Use the scores as supporting evidence.

When assigning High, Medium or Low priority, explicitly consider:

- Business Impact
- Risk Score
- Usage Frequency
- Automation Value
- Unique risk coverage
- Whether the scenario covers a critical interaction
- Whether another recommended scenario already covers the same risk

A High priority scenario should normally have at least one of these characteristics:

- High business impact
- High defect likelihood
- Critical state transition
- Important data integrity risk
- Destructive action
- High regression value
- Unique risk not covered by another High priority scenario

If a scenario has a relatively low numerical score but receives High priority, explicitly explain why.

Do not assign High priority simply because a negative or boundary test is easy to automate.

---

# Recommended automation set

After completing the analysis:

1. Rank the scenarios by overall value.
2. Consider risk and automation value.
3. Remove redundant scenarios.
4. Ensure important risk areas are represented.
5. Recommend the smallest practical set of tests that provides strong coverage.

The recommended test set should provide coverage across different risk categories rather than five variations of the same happy path.

---

# Output format

Use this structure when presenting the analysis.

## Important functionality

Briefly describe the main user-facing functionality discovered.

## Risk analysis

Use:

| Scenario | Business Impact | Likelihood | Usage Frequency | Risk Score | Automation Value | Automation Score | Priority | Reason |
|---|---:|---:|---:|---:|---:|---:|---|---|

## Interaction risks

List important risks involving combinations of functionality.

## Boundary and negative risks

List the most valuable boundary and negative scenarios.

## Recommended automated tests

Recommend the highest-value scenarios.

For each recommendation explain:

- what is being tested
- which risk it covers
- why it should be automated

---

# Important rules

Do not invent business requirements.

If the business rule is unknown, explicitly state the uncertainty.

Do not assign scores simply to make a scenario High priority.

Do not confuse functionality with risk.

Do not confuse complexity with business impact.

Do not recommend automation simply because a scenario is easy to automate.

Do not optimize for the number of automated tests.

Optimize for risk coverage and regression value.

Always use professional testing judgement.