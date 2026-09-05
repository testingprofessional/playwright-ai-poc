import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

const REPAIR_PROPOSAL_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'repair-proposal.json'
);

const VALIDATION_RESULT_FILE = path.join(
  PROJECT_ROOT,
  'test-results',
  'repair-validation.json'
);


// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

type RepairProposal = {
  test: string;
  classification: string;
  repairPossible: boolean;
  file: string;
  line: number;
  originalCode: string;
  replacementCode: string;
  reason: string;
};

type ValidationResult = {
  test: string;
  file: string;
  line: number;

  repairPossible: boolean;

  checks: {
    fileExists: boolean;
    originalCodeFound: boolean;
    replacementCodeValid: boolean;
    lineNumberPlausible: boolean;
    minimalChange: boolean;
  };

  safeToApply: boolean;

  reason: string;
};


// ---------------------------------------------------------
// Helper: absoluut pad bepalen
// ---------------------------------------------------------

function resolveTestFile(file: string): string {

  if (path.isAbsolute(file)) {
    return file;
  }

  return path.join(
    PROJECT_ROOT,
    file
  );
}


// ---------------------------------------------------------
// Helper: whitespace normaliseren
// ---------------------------------------------------------

function normalizeCode(code: string): string {

  return code
    .replace(/\r\n/g, '\n')
    .trim();
}


// ---------------------------------------------------------
// Helper: controle minimale wijziging
// ---------------------------------------------------------

function isMinimalChange(
  originalCode: string,
  replacementCode: string
): boolean {

  const original = normalizeCode(originalCode);
  const replacement = normalizeCode(replacementCode);

  if (!original || !replacement) {
    return false;
  }

  // Exact dezelfde code is geen reparatie
  if (original === replacement) {
    return false;
  }

  // Een extreem grote replacement ten opzichte
  // van de originele code is verdacht.
  //
  // We staan maximaal 3x zoveel tekens toe.
  if (replacement.length > original.length * 3) {
    return false;
  }

  // Een repair proposal hoort geen compleet bestand
  // te vervangen.
  const replacementLines =
    replacement.split('\n').length;

  if (replacementLines > 10) {
    return false;
  }

  return true;
}


// ---------------------------------------------------------
// Helper: controleren of regelnummer plausibel is
// ---------------------------------------------------------

function isLineNumberPlausible(
  source: string,
  line: number
): boolean {

  const lines = source.split('\n');

  return (
    Number.isInteger(line) &&
    line >= 1 &&
    line <= lines.length
  );
}


// ---------------------------------------------------------
// Eén repair proposal valideren
// ---------------------------------------------------------

function validateProposal(
  proposal: RepairProposal
): ValidationResult {

  console.log('');
  console.log('------------------------------------');
  console.log(`Test: ${proposal.test}`);
  console.log('------------------------------------');


  // -------------------------------------------------------
  // Basiscontrole
  // -------------------------------------------------------

  if (!proposal.repairPossible) {

    console.log(
      '✗ AI geeft aan dat repair niet mogelijk is.'
    );

    return {
      test: proposal.test,
      file: proposal.file,
      line: proposal.line,

      repairPossible: false,

      checks: {
        fileExists: false,
        originalCodeFound: false,
        replacementCodeValid: false,
        lineNumberPlausible: false,
        minimalChange: false,
      },

      safeToApply: false,

      reason:
        'AI heeft aangegeven dat een veilige repair niet mogelijk is.',
    };
  }


  // -------------------------------------------------------
  // Bestand controleren
  // -------------------------------------------------------

  const testFile =
    resolveTestFile(proposal.file);

  const fileExists =
    fs.existsSync(testFile);


  if (fileExists) {

    console.log(
      '✓ Test file exists'
    );

  } else {

    console.log(
      '✗ Test file does not exist'
    );
  }


  if (!fileExists) {

    return {
      test: proposal.test,
      file: proposal.file,
      line: proposal.line,

      repairPossible: proposal.repairPossible,

      checks: {
        fileExists: false,
        originalCodeFound: false,
        replacementCodeValid: false,
        lineNumberPlausible: false,
        minimalChange: false,
      },

      safeToApply: false,

      reason:
        `Testbestand bestaat niet: ${testFile}`,
    };
  }


  // -------------------------------------------------------
  // Source lezen
  // -------------------------------------------------------

  const source =
    fs.readFileSync(
      testFile,
      'utf-8'
    );


  // -------------------------------------------------------
  // Original code controleren
  // -------------------------------------------------------

  const originalCode =
    normalizeCode(
      proposal.originalCode
    );

  const normalizedSource =
    normalizeCode(source);


  const originalCodeFound =
    normalizedSource.includes(
      originalCode
    );


  if (originalCodeFound) {

    console.log(
      '✓ Original code found'
    );

  } else {

    console.log(
      '✗ Original code NOT found'
    );
  }


  // -------------------------------------------------------
  // Replacement controleren
  // -------------------------------------------------------

  const replacementCode =
    normalizeCode(
      proposal.replacementCode
    );


  const replacementCodeValid =
    replacementCode.length > 0 &&
    replacementCode !== originalCode;


  if (replacementCodeValid) {

    console.log(
      '✓ Replacement code is valid'
    );

  } else {

    console.log(
      '✗ Replacement code is invalid'
    );
  }


  // -------------------------------------------------------
  // Regelnummer controleren
  // -------------------------------------------------------

  const lineNumberPlausible =
    isLineNumberPlausible(
      source,
      proposal.line
    );


  if (lineNumberPlausible) {

    console.log(
      '✓ Line number plausible'
    );

  } else {

    console.log(
      '✗ Line number is not plausible'
    );
  }


  // -------------------------------------------------------
  // Minimale wijziging controleren
  // -------------------------------------------------------

  const minimalChange =
    isMinimalChange(
      proposal.originalCode,
      proposal.replacementCode
    );


  if (minimalChange) {

    console.log(
      '✓ Minimal change detected'
    );

  } else {

    console.log(
      '✗ Change is not considered minimal'
    );
  }


  // -------------------------------------------------------
  // Eindbeoordeling
  // -------------------------------------------------------

  const safeToApply =
    proposal.repairPossible &&
    fileExists &&
    originalCodeFound &&
    replacementCodeValid &&
    lineNumberPlausible &&
    minimalChange;


  let reason = '';


  if (safeToApply) {

    reason =
      'All validation checks passed. Repair is safe to apply.';

    console.log('');
    console.log(
      'RESULT: SAFE TO APPLY'
    );

  } else {

    const failedChecks: string[] = [];

    if (!fileExists) {
      failedChecks.push(
        'test file does not exist'
      );
    }

    if (!originalCodeFound) {
      failedChecks.push(
        'original code was not found'
      );
    }

    if (!replacementCodeValid) {
      failedChecks.push(
        'replacement code is invalid'
      );
    }

    if (!lineNumberPlausible) {
      failedChecks.push(
        'line number is not plausible'
      );
    }

    if (!minimalChange) {
      failedChecks.push(
        'change is not minimal'
      );
    }

    reason =
      `Repair rejected: ${failedChecks.join(', ')}.`;

    console.log('');
    console.log(
      'RESULT: DO NOT APPLY'
    );
  }


  return {
    test: proposal.test,
    file: proposal.file,
    line: proposal.line,

    repairPossible:
      proposal.repairPossible,

    checks: {
      fileExists,
      originalCodeFound,
      replacementCodeValid,
      lineNumberPlausible,
      minimalChange,
    },

    safeToApply,

    reason,
  };
}


// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

function main() {

  console.log('');
  console.log(
    '===================================='
  );
  console.log(
    ' Playwright AI Repair Validator'
  );
  console.log(
    '===================================='
  );
  console.log('');


  // -------------------------------------------------------
  // Repair proposal controleren
  // -------------------------------------------------------

  if (
    !fs.existsSync(
      REPAIR_PROPOSAL_FILE
    )
  ) {

    throw new Error(
      `Repair proposal niet gevonden: ${REPAIR_PROPOSAL_FILE}`
    );
  }


  // -------------------------------------------------------
  // Proposal lezen
  // -------------------------------------------------------

  const repairData =
    JSON.parse(
      fs.readFileSync(
        REPAIR_PROPOSAL_FILE,
        'utf-8'
      )
    );


  const proposals:
    RepairProposal[] =
    repairData.proposals || [];


  console.log(
    `Aantal repair proposals: ${proposals.length}`
  );


  if (proposals.length === 0) {

    console.log('');
    console.log(
      'Geen repair proposals gevonden.'
    );

    return;
  }


  // -------------------------------------------------------
  // Proposals valideren
  // -------------------------------------------------------

  const validationResults:
    ValidationResult[] = [];


  for (
    const proposal of proposals
  ) {

    const result =
      validateProposal(
        proposal
      );

    validationResults.push(
      result
    );
  }


  // -------------------------------------------------------
  // Samenvatting
  // -------------------------------------------------------

  const safeCount =
    validationResults.filter(
      result =>
        result.safeToApply
    ).length;


  const rejectedCount =
    validationResults.filter(
      result =>
        !result.safeToApply
    ).length;


  // -------------------------------------------------------
  // Output
  // -------------------------------------------------------

  const output = {

    generatedAt:
      new Date().toISOString(),

    summary: {

      total:
        validationResults.length,

      safeToApply:
        safeCount,

      rejected:
        rejectedCount,
    },

    results:
      validationResults,
  };


  fs.writeFileSync(

    VALIDATION_RESULT_FILE,

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

  console.log('');
  console.log(
    '===================================='
  );
  console.log(
    ' Validation afgerond'
  );
  console.log(
    '===================================='
  );
  console.log('');

  console.log(
    `Repair proposals: ${validationResults.length}`
  );

  console.log(
    `SAFE TO APPLY: ${safeCount}`
  );

  console.log(
    `DO NOT APPLY: ${rejectedCount}`
  );

  console.log('');

  console.log(
    `Validation opgeslagen in:`
  );

  console.log(
    VALIDATION_RESULT_FILE
  );

  console.log('');
}


// ---------------------------------------------------------
// Start
// ---------------------------------------------------------

try {

  main();

} catch (error) {

  console.error('');
  console.error(
    'Repair validator gestopt met een fout:'
  );
  console.error(error);
  console.error('');

  process.exit(1);
}