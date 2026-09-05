import fs from 'fs';
import path from 'path';
import ollama from 'ollama';

const PROJECT_ROOT = process.cwd();

const RESULTS_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'results.json'
);

const AI_ANALYSIS_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'ai-analysis.json'
);

const MODEL = 'qwen3:8b-q4_K_M';


// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

type FailureAnalysis = {
  classification:
    | 'TEST_DEFECT'
    | 'APPLICATION_DEFECT'
    | 'FLAKY_TEST'
    | 'ENVIRONMENT_PROBLEM'
    | 'UNKNOWN';

  confidence: number;
  reason: string;
  evidence: string;
  suggested_fix: string;
};


// ---------------------------------------------------------
// JSON schema voor Ollama
// ---------------------------------------------------------

const schema = {
  type: 'object',
  properties: {
    classification: {
      type: 'string',
      enum: [
        'TEST_DEFECT',
        'APPLICATION_DEFECT',
        'FLAKY_TEST',
        'ENVIRONMENT_PROBLEM',
        'UNKNOWN',
      ],
    },

    confidence: {
      type: 'number',
    },

    reason: {
      type: 'string',
    },

    evidence: {
      type: 'string',
    },

    suggested_fix: {
      type: 'string',
    },
  },

  required: [
    'classification',
    'confidence',
    'reason',
    'evidence',
    'suggested_fix',
  ],
};


// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function findTestFile(testTitle: string): string | null {
  const testsDir = path.join(PROJECT_ROOT, 'tests');

  if (!fs.existsSync(testsDir)) {
    return null;
  }

  const parts = testTitle.split(' > ');
  const actualTestTitle = parts[parts.length - 1];

  const files = fs.readdirSync(testsDir);

  for (const file of files) {
    if (!file.endsWith('.spec.ts')) {
      continue;
    }

    const filePath = path.join(testsDir, file);

    const source = fs.readFileSync(
      filePath,
      'utf-8'
    );

    if (
      source.includes(`test('${actualTestTitle}'`)
    ) {
      return filePath;
    }

    if (
      source.includes(`test("${actualTestTitle}"`)
    ) {
      return filePath;
    }
  }

  return null;
}


// ---------------------------------------------------------
// Ollama analyse met retry
// ---------------------------------------------------------

async function analyzeWithRetry(
  prompt: string,
  maxAttempts = 3
) {
  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `AI analyse poging ${attempt}/${maxAttempts}...`
      );

      const response = await ollama.chat({
        model: MODEL,

        format: schema,

        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response;

    } catch (error) {

      console.log(
        `AI analyse mislukt bij poging ${attempt}.`
      );

      if (attempt === maxAttempts) {
        throw error;
      }

      const waitTime = attempt * 2000;

      console.log(
        `Opnieuw proberen over ${waitTime / 1000} seconden...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, waitTime)
      );
    }
  }

  throw new Error(
    'AI analyse kon niet worden uitgevoerd.'
  );
}


// ---------------------------------------------------------
// Failed tests uit Playwright results.json halen
// ---------------------------------------------------------
//
// Playwright gebruikt ongeveer deze structuur:
//
// suites
//   -> specs
//      -> tests
//         -> results
//
// Een failed spec heeft:
//   spec.ok === false
//
// De daadwerkelijke failure staat vervolgens in:
//   result.status === 'failed'
//
// Errors en attachments staan eveneens op result.
// ---------------------------------------------------------

function getFailedTests(results: any[]) {
  const failures: any[] = [];

  for (const suite of results) {

    if (!suite.specs) {
      continue;
    }

    for (const spec of suite.specs) {

      // Alleen daadwerkelijk gefaalde specs verwerken.
      if (spec.ok !== false) {
        continue;
      }

      if (!spec.tests) {
        continue;
      }

      for (const test of spec.tests) {

        if (!test.results) {
          continue;
        }

        for (const result of test.results) {

          if (result.status !== 'failed') {
            continue;
          }

          failures.push({
            title: spec.title,

            // Wordt later gebruikt voor rapportage/debugging.
            spec,

            test,

            result,

            // Maak de relevante informatie direct beschikbaar.
            status: test.status,

            errors: result.errors || [],

            attachments: result.attachments || [],

            errorLocation: result.errorLocation || null,
          });
        }
      }
    }
  }

  return failures;
}


// ---------------------------------------------------------
// Attachment path robuust oplossen
// ---------------------------------------------------------

function resolveAttachmentPath(
  attachmentPath: string
): string {

  if (path.isAbsolute(attachmentPath)) {
    return attachmentPath;
  }

  return path.resolve(
    PROJECT_ROOT,
    attachmentPath
  );
}


// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

async function main() {

  console.log('');
  console.log('========================================');
  console.log(' Playwright AI Failure Analyzer');
  console.log('========================================');
  console.log('');


  // -------------------------------------------------------
  // results.json controleren
  // -------------------------------------------------------

  if (!fs.existsSync(RESULTS_FILE)) {
    throw new Error(
      `results.json niet gevonden: ${RESULTS_FILE}`
    );
  }


  // -------------------------------------------------------
  // results.json lezen
  // -------------------------------------------------------

  const results = JSON.parse(
    fs.readFileSync(
      RESULTS_FILE,
      'utf-8'
    )
  );


  // -------------------------------------------------------
  // Failed tests zoeken
  // -------------------------------------------------------

  const failedTests = getFailedTests(
    results.suites || []
  );

  console.log(
    `Aantal failed tests gevonden: ${failedTests.length}`
  );

  console.log('');


  if (failedTests.length === 0) {

    console.log(
      'Geen failed tests gevonden.'
    );

    return;
  }


  // -------------------------------------------------------
  // AI analyses verzamelen
  // -------------------------------------------------------

  const analyses: any[] = [];


  // -------------------------------------------------------
  // Iedere failure analyseren
  // -------------------------------------------------------

  for (
    const failedTest of failedTests
  ) {

    const testTitle =
      failedTest.title || 'Unknown test';


    console.log(
      `Analyseer: ${testTitle}`
    );


    // -----------------------------------------------------
    // Test source vinden
    // -----------------------------------------------------

    const testFile =
      findTestFile(testTitle);


    let testSource =
      'TEST SOURCE NOT FOUND';


    if (testFile) {

      testSource =
        fs.readFileSync(
          testFile,
          'utf-8'
        );
    }


    // -----------------------------------------------------
    // Playwright failure ophalen
    // -----------------------------------------------------

    const failureInformation =
      failedTest.errors
        ?.map((error: any) =>
          error.message || ''
        )
        .join('\n\n') ||
      'No failure information available.';


    // -----------------------------------------------------
    // Error context ophalen
    // -----------------------------------------------------

    let errorContext =
      'ERROR CONTEXT NOT FOUND';


    if (
      failedTest.attachments &&
      Array.isArray(failedTest.attachments)
    ) {

      const errorContextAttachment =
        failedTest.attachments.find(
          (attachment: any) =>
            attachment.name === 'error-context'
        );


      if (
        errorContextAttachment &&
        errorContextAttachment.path
      ) {

        const attachmentPath =
          resolveAttachmentPath(
            errorContextAttachment.path
          );


        if (
          fs.existsSync(attachmentPath)
        ) {

          errorContext =
            fs.readFileSync(
              attachmentPath,
              'utf-8'
            );
        }
      }
    }


    // -----------------------------------------------------
    // Prompt
    // -----------------------------------------------------

    const prompt = `
You are an expert Playwright test automation engineer.

Analyze the following failed Playwright test.

Your task is to determine the most likely root cause and classify the failure.

You MUST use only the information provided below.

IMPORTANT RULES:
- Do not invent facts.
- Do not invent information about the source files.
- Do not refer to the error context as YAML, JSON, XML, or another format unless that format is explicitly mentioned in the provided information.
- The error context is provided as plain text from a Playwright error-context file.
- Do not assume information that is not explicitly present.
- Base your evidence only on TEST SOURCE, PLAYWRIGHT FAILURE, and ERROR CONTEXT.
- If the evidence is insufficient, use UNKNOWN rather than guessing.
- The suggested fix must be based on the actual test source and failure information.

CLASSIFICATION OPTIONS:
- TEST_DEFECT: The automated test itself is incorrect.
- APPLICATION_DEFECT: The application behaves incorrectly.
- FLAKY_TEST: The failure appears intermittent or timing-related.
- ENVIRONMENT_PROBLEM: The failure is caused by the test environment.
- UNKNOWN: There is insufficient evidence to determine the cause.

Return ONLY valid JSON matching the provided schema.

TEST SOURCE:
${testSource}

PLAYWRIGHT FAILURE:
${failureInformation}

ERROR CONTEXT:
${errorContext}
`;


    // -----------------------------------------------------
    // AI aanroepen met retry
    // -----------------------------------------------------

    try {

      const response =
        await analyzeWithRetry(prompt);


      // ---------------------------------------------------
      // JSON response parsen
      // ---------------------------------------------------

      const analysis: FailureAnalysis =
        JSON.parse(
          response.message.content
        );


      // ---------------------------------------------------
      // Resultaat opslaan
      // ---------------------------------------------------

      const analysisResult = {

        test: testTitle,

        testFile:
          testFile
            ? path.relative(
                PROJECT_ROOT,
                testFile
              )
            : null,

        status:
          failedTest.status,

        failureCount:
          failedTest.errors?.length || 0,

        errorLocation:
          failedTest.errorLocation,

        errorContext,

        classification:
          analysis.classification,

        confidence:
          analysis.confidence,

        reason:
          analysis.reason,

        evidence:
          analysis.evidence,

        suggested_fix:
          analysis.suggested_fix,
      };


      analyses.push(
        analysisResult
      );


      // ---------------------------------------------------
      // Resultaat tonen
      // ---------------------------------------------------

      console.log(
        `Classification: ${analysis.classification}`
      );

      console.log(
        `Confidence: ${analysis.confidence}%`
      );

      console.log(
        `Reason: ${analysis.reason}`
      );

      console.log(
        `Suggested fix: ${analysis.suggested_fix}`
      );

      console.log('');

    } catch (error) {

      console.error(
        `AI analyse definitief mislukt voor: ${testTitle}`
      );

      console.error(error);

      console.log('');
    }
  }


  // -------------------------------------------------------
  // Samenvatting maken
  // -------------------------------------------------------

  const summary = {

    totalFailedTests:
      failedTests.length,

    analyzedTests:
      analyses.length,

    testDefects:
      analyses.filter(
        analysis =>
          analysis.classification ===
          'TEST_DEFECT'
      ).length,

    applicationDefects:
      analyses.filter(
        analysis =>
          analysis.classification ===
          'APPLICATION_DEFECT'
      ).length,

    flakyTests:
      analyses.filter(
        analysis =>
          analysis.classification ===
          'FLAKY_TEST'
      ).length,

    environmentProblems:
      analyses.filter(
        analysis =>
          analysis.classification ===
          'ENVIRONMENT_PROBLEM'
      ).length,

    unknown:
      analyses.filter(
        analysis =>
          analysis.classification ===
          'UNKNOWN'
      ).length,
  };


  // -------------------------------------------------------
  // Definitief AI analysebestand
  // -------------------------------------------------------

  const output = {

    generatedAt:
      new Date().toISOString(),

    model:
      MODEL,

    summary,

    analyses,
  };


  fs.writeFileSync(

    AI_ANALYSIS_FILE,

    JSON.stringify(
      output,
      null,
      2
    ),

    'utf-8'
  );


  // -------------------------------------------------------
  // Eindresultaat
  // -------------------------------------------------------

  console.log(
    '========================================'
  );

  console.log(
    ' AI analyse afgerond'
  );

  console.log(
    '========================================'
  );

  console.log('');

  console.log(
    `Failed tests: ${failedTests.length}`
  );

  console.log(
    `Geanalyseerd: ${analyses.length}`
  );

  console.log(
    `Test defects: ${summary.testDefects}`
  );

  console.log(
    `Application defects: ${summary.applicationDefects}`
  );

  console.log(
    `Flaky tests: ${summary.flakyTests}`
  );

  console.log(
    `Environment problems: ${summary.environmentProblems}`
  );

  console.log(
    `Unknown: ${summary.unknown}`
  );

  console.log('');

  console.log(
    `AI analyse opgeslagen in: ${AI_ANALYSIS_FILE}`
  );

  console.log('');
}


// ---------------------------------------------------------
// Start
// ---------------------------------------------------------

main().catch(error => {

  console.error('');
  console.error(
    'AI failure analyzer gestopt met een fout:'
  );
  console.error(error);
  console.error('');

  process.exit(1);
});