import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

const RESULTS_FILE = path.join(
    PROJECT_ROOT,
    'test-results',
    'results.json'
);

const ANALYSIS_FILE = path.join(
    PROJECT_ROOT,
    'test-results',
    'ai-analysis.json'
);

const PROPOSAL_FILE = path.join(
    PROJECT_ROOT,
    'test-results',
    'repair-proposal.json'
);

const VALIDATION_FILE = path.join(
    PROJECT_ROOT,
    'test-results',
    'repair-validation.json'
);


// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

interface RepairProposal {
    test: string;
    classification: string;
    repairPossible: boolean;
    file: string;
    line: number;
    originalCode: string;
    replacementCode: string;
    reason: string;
}

interface RepairProposalFile {
    proposals: RepairProposal[];
}


// ---------------------------------------------------------
// Command uitvoeren
// ---------------------------------------------------------

function runCommand(
    command: string,
    args: string[],
    description: string
): boolean {

    console.log('');
    console.log('====================================');
    console.log(` ${description}`);
    console.log('====================================');
    console.log('');

    console.log(`> ${command} ${args.join(' ')}`);
    console.log('');

    const result = spawnSync(
        command,
        args,
        {
            cwd: PROJECT_ROOT,
            stdio: 'inherit',
            shell: true
        }
    );

    if (result.error) {

        console.error('');
        console.error(
            `✗ ${description} failed`
        );

        console.error(result.error);

        return false;
    }

    if (result.status !== 0) {

        console.log('');
        console.log(
            `✗ ${description} returned exit code ${result.status}`
        );

        return false;
    }

    console.log('');
    console.log(
        `✓ ${description} completed`
    );

    return true;
}


// ---------------------------------------------------------
// Playwright uitvoeren
// ---------------------------------------------------------

function runPlaywright(): boolean {

    return runCommand(
        'npx',
        ['playwright', 'test'],
        'Playwright tests'
    );
}


// ---------------------------------------------------------
// Failed tests controleren
// ---------------------------------------------------------

function hasFailedTests(): boolean {

    if (!fs.existsSync(RESULTS_FILE)) {

        console.log(
            '⚠ results.json not found.'
        );

        return false;
    }

    const results = JSON.parse(
        fs.readFileSync(
            RESULTS_FILE,
            'utf-8'
        )
    );

    let failedTests = 0;

    for (
        const suite of results.suites ?? []
    ) {

        for (
            const spec of suite.specs ?? []
        ) {

            if (spec.ok === false) {
                failedTests++;
            }
        }
    }

    console.log('');
    console.log(
        `Aantal failed tests gevonden: ${failedTests}`
    );

    return failedTests > 0;
}


// ---------------------------------------------------------
// Bestand controleren
// ---------------------------------------------------------

function fileExists(
    filePath: string,
    description: string
): boolean {

    if (!fs.existsSync(filePath)) {

        console.error('');
        console.error(
            `✗ ${description} niet gevonden:`
        );

        console.error(filePath);

        return false;
    }

    console.log(
        `✓ ${description} gevonden`
    );

    return true;
}


// ---------------------------------------------------------
// AI Failure Analyzer
// ---------------------------------------------------------

function runAnalyzer(): boolean {

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/analyze-failure.ts'],
        'AI Failure Analyzer'
    );

    if (!success) {
        return false;
    }

    console.log('');

    return fileExists(
        ANALYSIS_FILE,
        'ai-analysis.json'
    );
}


// ---------------------------------------------------------
// AI Repair Analyzer
// ---------------------------------------------------------

function runRepairAnalyzer(): boolean {

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/repair-failure.ts'],
        'AI Repair Analyzer'
    );

    if (!success) {
        return false;
    }

    console.log('');

    return fileExists(
        PROPOSAL_FILE,
        'repair-proposal.json'
    );
}


// ---------------------------------------------------------
// Repair Validator
// ---------------------------------------------------------

function runValidator(): boolean {

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/validate-repair.ts'],
        'Repair Validator'
    );

    if (!success) {
        return false;
    }

    console.log('');

    return fileExists(
        VALIDATION_FILE,
        'repair-validation.json'
    );
}


// ---------------------------------------------------------
// Repair toepassen
// ---------------------------------------------------------

function runApplyRepair(): boolean {

    return runCommand(
        'npx',
        ['tsx', 'scripts/apply-repair.ts'],
        'Apply Repair'
    );
}


// ---------------------------------------------------------
// Gerepareerde tests ophalen
// ---------------------------------------------------------

function getRepairedTests(): string[] {

    if (!fs.existsSync(PROPOSAL_FILE)) {
        return [];
    }

    const proposalData: RepairProposalFile =
        JSON.parse(
            fs.readFileSync(
                PROPOSAL_FILE,
                'utf-8'
            )
        );

    if (
        !proposalData.proposals ||
        !Array.isArray(proposalData.proposals)
    ) {
        return [];
    }

    const tests =
        proposalData.proposals
            .filter(
                proposal =>
                    proposal.repairPossible &&
                    proposal.classification ===
                        'TEST_DEFECT'
            )
            .map(
                proposal =>
                    proposal.test
            );

    return [
        ...new Set(tests)
    ];
}


// ---------------------------------------------------------
// Gerepareerde tests opnieuw uitvoeren
// ---------------------------------------------------------

function runRepairedTests(): boolean {

    const repairedTests =
        getRepairedTests();

    if (
        repairedTests.length === 0
    ) {

        console.log('');

        console.log(
            'Geen gerepareerde tests gevonden.'
        );

        return false;
    }

    console.log('');
    console.log('====================================');
    console.log(' Re-run repaired tests');
    console.log('====================================');
    console.log('');

    console.log(
        `Aantal gerepareerde tests: ${repairedTests.length}`
    );

    for (
        const test of repairedTests
    ) {

        console.log(
            `  → ${test}`
        );
    }

    console.log('');


    // -----------------------------------------------------
    // Iedere gerepareerde test afzonderlijk uitvoeren
    // -----------------------------------------------------

    for (
        const test of repairedTests
    ) {

        console.log('');
        console.log(
            `Test opnieuw uitvoeren: ${test}`
        );

        console.log('');

        const result = spawnSync(
            'npx',
            [
                'playwright',
                'test',
                '--grep',
                test
            ],
            {
                cwd: PROJECT_ROOT,
                stdio: 'inherit',
                shell: true
            }
        );

        if (
            result.error
        ) {

            console.log('');
            console.log(
                `✗ Fout tijdens uitvoeren van: ${test}`
            );

            console.log(
                result.error
            );

            return false;
        }

        if (
            result.status !== 0
        ) {

            console.log('');
            console.log(
                `✗ Gerepareerde test is nog steeds FAILED: ${test}`
            );

            return false;
        }

        console.log('');
        console.log(
            `✓ Gerepareerde test passed: ${test}`
        );
    }

    return true;
}


// ---------------------------------------------------------
// Eindresultaat tonen
// ---------------------------------------------------------

function printFinalResult(
    success: boolean
) {

    console.log('');
    console.log('');
    console.log('====================================');
    console.log(' AI Repair Pipeline');
    console.log('====================================');
    console.log('');

    if (success) {

        console.log(
            '🎉 SUCCESS'
        );

        console.log('');

        console.log(
            'Failures zijn automatisch geanalyseerd,'
        );

        console.log(
            'gevalideerd, gerepareerd en opnieuw getest.'
        );

    } else {

        console.log(
            '❌ PIPELINE FAILED'
        );

        console.log('');

        console.log(
            'Niet alle stappen konden succesvol worden afgerond.'
        );
    }

    console.log('');
    console.log('====================================');
    console.log('');
}


// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

function main() {

    console.log('');
    console.log('====================================');
    console.log(' Playwright AI Repair Pipeline');
    console.log('====================================');
    console.log('');

    console.log(
        'Start volledige AI repair workflow...'
    );

    console.log('');


    // -----------------------------------------------------
    // STEP 1
    // Initial Playwright run
    // -----------------------------------------------------

    runPlaywright();

    /*
     * Playwright mag hier falen.
     *
     * Een failure is juist de aanleiding
     * voor onze AI repair workflow.
     */

    const failures =
        hasFailedTests();


    // -----------------------------------------------------
    // Geen failures
    // -----------------------------------------------------

    if (!failures) {

        console.log('');

        console.log(
            '✓ Alle Playwright tests zijn al groen.'
        );

        printFinalResult(true);

        return;
    }


    console.log('');

    console.log(
        '⚠ Playwright heeft failures gevonden.'
    );


    // -----------------------------------------------------
    // STEP 2
    // AI Failure Analysis
    // -----------------------------------------------------

    if (
        !runAnalyzer()
    ) {

        printFinalResult(false);

        process.exit(1);
    }


    // -----------------------------------------------------
    // STEP 3
    // AI Repair Analysis
    // -----------------------------------------------------

    if (
        !runRepairAnalyzer()
    ) {

        printFinalResult(false);

        process.exit(1);
    }


    // -----------------------------------------------------
    // STEP 4
    // Deterministic validation
    // -----------------------------------------------------

    if (
        !runValidator()
    ) {

        printFinalResult(false);

        process.exit(1);
    }


    // -----------------------------------------------------
    // STEP 5
    // Apply safe repairs
    // -----------------------------------------------------

    if (
        !runApplyRepair()
    ) {

        printFinalResult(false);

        process.exit(1);
    }


    // -----------------------------------------------------
    // STEP 6
    // Re-run repaired tests
    // -----------------------------------------------------

    if (
        !runRepairedTests()
    ) {

        printFinalResult(false);

        process.exit(1);
    }


    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    printFinalResult(true);
}


// ---------------------------------------------------------
// Start
// ---------------------------------------------------------

main();