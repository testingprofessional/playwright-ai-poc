import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const results = fs.readFileSync(
  'test-results/results.xml',
  'utf-8'
);

const errorContext = fs.readFileSync(
  'test-results/todo-user-can-add-a-todo-chromium/error-context.md',
  'utf-8'
);

const testSource = fs.readFileSync(
  'tests/todo.spec.ts',
  'utf-8'
);

const prompt = `
You are an expert Playwright test engineer.

Analyze the following failed Playwright test.

Determine whether the failure is most likely:

- TEST_DEFECT
- APPLICATION_DEFECT
- FLAKY_TEST
- ENVIRONMENT_PROBLEM
- UNKNOWN

Be concise.

Explain:
1. What failed?
2. Why did it fail?
3. What is most likely the root cause?
4. What should be changed?

If a code fix is possible, provide the corrected code.

=== TEST SOURCE ===

${testSource}

=== PLAYWRIGHT FAILURE ===

${results}

=== ERROR CONTEXT ===

${errorContext}
`;

const response = await client.responses.create({
  model: 'gpt-5.6',
  input: prompt,
});

console.log(response.output_text);