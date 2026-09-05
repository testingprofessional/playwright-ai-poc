import fs from 'fs';
import path from 'path';

const RESULTS_FILE = path.join(
  process.cwd(),
  'test-results',
  'results.json'
);

const data = JSON.parse(
  fs.readFileSync(RESULTS_FILE, 'utf-8')
);

function inspectSuite(suite: any, level = 0) {
  const indent = ' '.repeat(level * 2);

  console.log(`${indent}SUITE: ${suite.title}`);

  for (const spec of suite.specs ?? []) {
    console.log(`${indent}  SPEC: ${spec.title}`);

    for (const test of spec.tests ?? []) {
      console.log(`${indent}    TEST STATUS: ${test.status}`);

      for (const result of test.results ?? []) {
        console.log(`${indent}      retry: ${result.retry}`);
        console.log(`${indent}      status: ${result.status}`);

        console.log(
          `${indent}      attachments:`
        );

        for (const attachment of result.attachments ?? []) {
          console.log(
            `${indent}        ${attachment.name}`
          );

          console.log(
            `${indent}        path: ${attachment.path ?? '(geen path)'}`
          );
        }

        if (result.error) {
          console.log(
            `${indent}      ERROR: ${result.error.message ?? result.error}`
          );
        }
      }
    }
  }

  for (const childSuite of suite.suites ?? []) {
    inspectSuite(childSuite, level + 1);
  }
}

for (const suite of data.suites ?? []) {
  inspectSuite(suite);
}