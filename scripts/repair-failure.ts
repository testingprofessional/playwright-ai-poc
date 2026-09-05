import fs from 'fs';
import path from 'path';
import ollama from 'ollama';

const PROJECT_ROOT = process.cwd();

const AI_ANALYSIS_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'ai-analysis.json'
);

const REPAIR_PROPOSAL_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'repair-proposal.json'
);

const MODEL = 'qwen3:8b-q4_K_M';


// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

type RepairProposal = {
  repairPossible: boolean;
  file: string;
  line: number;
  originalCode: string;
  replacementCode: string;
  reason: string;
};


// ---------------------------------------------------------
// JSON schema voor Ollama
// ---------------------------------------------------------

const schema = {
  type: 'object',

  properties: {

    repairPossible: {
      type: 'boolean',
    },

    file: {
      type: 'string',
    },

    line: {
      type: 'number',
    },

    originalCode: {
      type: 'string',
    },

    replacementCode: {
      type: 'string',
    },

    reason: {
      type: 'string',
    },
  },

  required: [
    'repairPossible',
    'file',
    'line',
    'originalCode',
    'replacementCode',
    'reason',
  ],
};


// ---------------------------------------------------------
// Source code rond een bepaalde regel ophalen
// ---------------------------------------------------------

function getSourceAroundLine(
  source: string,
  lineNumber: number,
  radius = 4
): string {

  const lines = source.split('\n');

  const start =
    Math.max(
      0,
      lineNumber - radius - 1
    );

  const end =
    Math.min(
      lines.length,
      lineNumber + radius
    );

  const result: string[] = [];

  for (
    let i = start;
    i < end;
    i++
  ) {

    result.push(
      `Line ${i + 1}: ${lines[i]}`
    );
  }

  return result.join('\n');
}


// ---------------------------------------------------------
// Ollama analyse met retry
// ---------------------------------------------------------

async function repairWithRetry(
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
        `Repair analyse poging ${attempt}/${maxAttempts}...`
      );

      const response =
        await ollama.chat({

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
        `Repair analyse mislukt bij poging ${attempt}.`
      );

      if (
        attempt === maxAttempts
      ) {

        throw error;
      }

      const waitTime =
        attempt * 2000;

      console.log(
        `Opnieuw proberen over ${waitTime / 1000} seconden...`
      );

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            waitTime
          )
      );
    }
  }

  throw new Error(
    'Repair analyse kon niet worden uitgevoerd.'
  );
}


// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

async function main() {

  console.log('');
  console.log(
    '===================================='
  );
  console.log(
    ' Playwright AI Repair Analyzer'
  );
  console.log(
    '===================================='
  );
  console.log('');


  // -------------------------------------------------------
  // AI analysis controleren
  // -------------------------------------------------------

  if (
    !fs.existsSync(
      AI_ANALYSIS_FILE
    )
  ) {

    throw new Error(
      `AI analysis niet gevonden: ${AI_ANALYSIS_FILE}`
    );
  }


  // -------------------------------------------------------
  // AI analysis lezen
  // -------------------------------------------------------

  const analysisData =
    JSON.parse(
      fs.readFileSync(
        AI_ANALYSIS_FILE,
        'utf-8'
      )
    );


  const analyses =
    analysisData.analyses || [];


  console.log(
    `Aantal analyses: ${analyses.length}`
  );

  console.log('');


  // -------------------------------------------------------
  // Repair proposals verzamelen
  // -------------------------------------------------------

  const repairProposals:
    any[] = [];


  // -------------------------------------------------------
  // Iedere analyse verwerken
  // -------------------------------------------------------

  for (
    const analysis of analyses
  ) {

    console.log(
      '------------------------------------'
    );

    console.log(
      `Test: ${analysis.test}`
    );

    console.log(
      `Classification: ${analysis.classification}`
    );

    console.log(
      '------------------------------------'
    );


    // -----------------------------------------------------
    // Alleen TEST_DEFECT repareren
    // -----------------------------------------------------

    if (
      analysis.classification !==
      'TEST_DEFECT'
    ) {

      console.log(
        'Geen TEST_DEFECT. Repair wordt overgeslagen.'
      );

      console.log('');

      continue;
    }


    // -----------------------------------------------------
    // Testbestand bepalen
    // -----------------------------------------------------

    if (!analysis.testFile) {

      console.log(
        'Geen testbestand gevonden. Repair overgeslagen.'
      );

      console.log('');

      continue;
    }


    const testFile =
      path.isAbsolute(
        analysis.testFile
      )
        ? analysis.testFile
        : path.join(
            PROJECT_ROOT,
            analysis.testFile
          );


    // -----------------------------------------------------
    // Testbestand controleren
    // -----------------------------------------------------

    if (
      !fs.existsSync(testFile)
    ) {

      console.log(
        `Testbestand bestaat niet: ${testFile}`
      );

      console.log('');

      continue;
    }


    // -----------------------------------------------------
    // Test source lezen
    // -----------------------------------------------------

    const testSource =
      fs.readFileSync(
        testFile,
        'utf-8'
      );


    // -----------------------------------------------------
    // Failure line bepalen
    // -----------------------------------------------------

    let failureLine =
      analysis.line || 1;


    /*
     * Probeer het regelnummer uit de Playwright
     * failure informatie te halen.
     *
     * Bijvoorbeeld:
     *
     * tests\todo.spec.ts:18:5
     */

    const locationMatch =
      analysis.errorContext?.match(
        /(?:tests[\\/][^:\n]+):(\d+):(\d+)/
      );


    if (
      locationMatch
    ) {

      failureLine =
        Number(
          locationMatch[1]
        );
    }


    // -----------------------------------------------------
    // Source code rond failure ophalen
    // -----------------------------------------------------

    const sourceAroundFailure =
      getSourceAroundLine(
        testSource,
        failureLine,
        5
      );


    console.log(
      `Broncode rond regel ${failureLine} wordt aan Qwen3 gegeven.`
    );


    // -----------------------------------------------------
    // Prompt
    // -----------------------------------------------------

    const prompt = `
You are an expert Playwright test automation engineer.

A Playwright test has failed and another AI has already analyzed the failure.

Your task is to propose ONE safe and minimal code repair.

You MUST use only the information provided below.

IMPORTANT RULES:

- Do NOT modify any files.
- Only propose a repair.
- Preserve the original intent of the test.
- Prefer the smallest possible code change.
- Do not change unrelated code.
- Do not invent application behavior.
- The repair must be valid TypeScript Playwright code.

CRITICAL RULES FOR originalCode:

- originalCode MUST be copied EXACTLY from CURRENT TEST SOURCE.
- originalCode MUST be an exact substring of CURRENT TEST SOURCE.
- Copy originalCode character-for-character.
- Do NOT reconstruct originalCode.
- Do NOT rewrite originalCode.
- Do NOT simplify originalCode.
- Do NOT invent originalCode.
- Do NOT combine separate source lines unless those exact lines appear together in CURRENT TEST SOURCE.
- Before returning the answer, verify that originalCode exists literally in CURRENT TEST SOURCE.
- If you cannot identify an exact existing code fragment, set repairPossible to false.

CRITICAL RULES FOR replacementCode:

- replacementCode must contain ONLY the replacement code.
- replacementCode must replace originalCode directly.
- replacementCode must preserve the test's original intent.
- replacementCode must be valid TypeScript Playwright code.

CRITICAL RULES FOR line:

- line must refer to the approximate source line where originalCode occurs.
- Prefer the line number shown in SOURCE CODE AROUND FAILURE.
- Do not invent a line number.

IMPORTANT:

The SOURCE CODE AROUND FAILURE below is the most important source for determining originalCode.

If the failure can be repaired by changing a locator declaration, prefer changing the locator declaration rather than rewriting the assertion.

Return ONLY valid JSON matching the provided schema.

TEST:
${analysis.test}

TEST FILE:
${analysis.testFile}

CLASSIFICATION:
${analysis.classification}

FAILURE REASON:
${analysis.reason}

EVIDENCE:
${analysis.evidence}

SUGGESTED FIX:
${analysis.suggested_fix}

SOURCE CODE AROUND FAILURE:
${sourceAroundFailure}

CURRENT TEST SOURCE:
${testSource}
`;


    // -----------------------------------------------------
    // AI repair proposal genereren
    // -----------------------------------------------------

    console.log(
      'Repair proposal wordt gegenereerd door Qwen3...'
    );

    console.log('');


    try {

      const response =
        await repairWithRetry(
          prompt
        );


      // ---------------------------------------------------
      // JSON response parsen
      // ---------------------------------------------------

      const repair:
        RepairProposal =
        JSON.parse(
          response.message.content
        );


      // ---------------------------------------------------
      // Relatief bestandspad
      // ---------------------------------------------------

      const relativeFile =
        path.relative(
          PROJECT_ROOT,
          testFile
        );


      // ---------------------------------------------------
      // Proposal opslaan
      // ---------------------------------------------------

      const proposal = {

        test:
          analysis.test,

        classification:
          analysis.classification,

        repairPossible:
          repair.repairPossible,

        file:
          relativeFile,

        line:
          repair.line,

        originalCode:
          repair.originalCode,

        replacementCode:
          repair.replacementCode,

        reason:
          repair.reason,
      };


      repairProposals.push(
        proposal
      );


      // ---------------------------------------------------
      // Resultaat tonen
      // ---------------------------------------------------

      console.log(
        'Repair proposal:'
      );

      console.log(
        `Repair possible: ${repair.repairPossible}`
      );

      console.log(
        `File: ${relativeFile}`
      );

      console.log(
        `Line: ${repair.line}`
      );

      console.log('');

      console.log(
        'Original:'
      );

      console.log(
        repair.originalCode
      );

      console.log('');

      console.log(
        'Replacement:'
      );

      console.log(
        repair.replacementCode
      );

      console.log('');

      console.log(
        'Reason:'
      );

      console.log(
        repair.reason
      );

      console.log('');

    } catch (error) {

      console.error(
        `Repair analyse mislukt voor: ${analysis.test}`
      );

      console.error(error);

      console.log('');
    }
  }


  // -------------------------------------------------------
  // Repair proposals opslaan
  // -------------------------------------------------------

  const output = {

    generatedAt:
      new Date().toISOString(),

    model:
      MODEL,

    proposals:
      repairProposals,
  };


  fs.writeFileSync(

    REPAIR_PROPOSAL_FILE,

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
    '===================================='
  );

  console.log(
    ' Repair proposals opgeslagen'
  );

  console.log(
    '===================================='
  );

  console.log('');

  console.log(
    REPAIR_PROPOSAL_FILE
  );

  console.log('');
}


// ---------------------------------------------------------
// Start
// ---------------------------------------------------------

main().catch(
  error => {

    console.error('');
    console.error(
      'Repair analyzer gestopt met een fout:'
    );
    console.error(error);
    console.error('');

    process.exit(1);
  }
);