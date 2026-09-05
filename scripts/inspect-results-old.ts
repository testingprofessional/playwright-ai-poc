import fs from 'fs';

const resultsPath = 'test-results/results.json';

const data = JSON.parse(
  fs.readFileSync(resultsPath, 'utf-8')
);

console.log('=== PLAYWRIGHT RUN ===');
console.log(`Status: ${data.status}`);
console.log('');

function inspectSuite(suite: any, parentTitle = '') {
  const title = parentTitle
    ? `${parentTitle} > ${suite.title}`
    : suite.title;

  if (suite.specs) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {

        console.log(`Test: ${title} > ${spec.title}`);
        console.log(`Status: ${test.status}`);

        if (test.results) {
          for (const result of test.results) {
            if (result.error) {
              console.log('Error:');
              console.log(result.error.message);
            }
          }
        }

        console.log('---');
      }
    }
  }

  if (suite.suites) {
    for (const childSuite of suite.suites) {
      inspectSuite(childSuite, title);
    }
  }
}

for (const suite of data.suites) {
  inspectSuite(suite);
}