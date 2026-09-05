import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const RESULTS_FILE = 'test-results/results.json';
const ANALYSIS_FILE = 'test-results/ai-analysis.json';
const PROPOSAL_FILE = 'test-results/repair-proposal.json';
const VALIDATION_FILE = 'test-results/repair-validation.json';

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

function runCommand(
    command: string,
    args: string[],
    label: string
): boolean {
    console.log(`\n▶ ${label}`);
    console.log(`$ ${command} ${args.join(' ')}`);

    const result = spawnSync(command, args, {
        stdio: 'inherit',
        shell: true
    });

    if (result.status !== 0) {
        console.error(`❌ ${label} mislukt.`);
        return false;
    }

    console.log(`✓ ${label} geslaagd.`);
    return true;
}

function runPlaywright(): boolean {
    console.log('\n====================================');
    console.log(' Stap 1 - Playwright tests uitvoeren');
    console.log('====================================');

    return runCommand(
        'npx',
        ['playwright', 'test'],
        'Playwright test run'
    );
}

function hasFailedTests(): boolean {
    if (!fs.existsSync(RESULTS_FILE)) {
        console.error(`❌ Resultaatbestand niet gevonden: ${RESULTS_FILE}`);
        return false;
    }

    const results = JSON.parse(
        fs.readFileSync(RESULTS_FILE, 'utf-8')
    );

    let failedTests = 0;

    for (const suite of results.suites || []) {
        for (const spec of suite.specs || []) {
            if (spec.ok === false) {
                failedTests++;
            }
        }
    }

    console.log(`\nAantal gefaalde tests: ${failedTests}`);

    return failedTests > 0;
}

function runAnalyzer(): boolean {
    console.log('\n====================================');
    console.log(' Stap 2 - AI failure analyse');
    console.log('====================================');

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/analyze-failure.ts'],
        'AI failure analyse'
    );

    if (!success) {
        return false;
    }

    if (!fs.existsSync(ANALYSIS_FILE)) {
        console.error(
            `❌ AI analysebestand niet gevonden: ${ANALYSIS_FILE}`
        );
        return false;
    }

    console.log(`✓ Analysebestand gevonden: ${ANALYSIS_FILE}`);

    return true;
}

function runRepairAnalyzer(): boolean {
    console.log('\n====================================');
    console.log(' Stap 3 - AI repair voorstellen');
    console.log('====================================');

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/repair-failure.ts'],
        'AI repair analyse'
    );

    if (!success) {
        return false;
    }

    if (!fs.existsSync(PROPOSAL_FILE)) {
        console.error(
            `❌ Repair proposal bestand niet gevonden: ${PROPOSAL_FILE}`
        );
        return false;
    }

    console.log(
        `✓ Repair proposal bestand gevonden: ${PROPOSAL_FILE}`
    );

    return true;
}

function runValidator(): boolean {
    console.log('\n====================================');
    console.log(' Stap 4 - Repair voorstellen valideren');
    console.log('====================================');

    const success = runCommand(
        'npx',
        ['tsx', 'scripts/validate-repair.ts'],
        'Repair validatie'
    );

    if (!success) {
        return false;
    }

    if (!fs.existsSync(VALIDATION_FILE)) {
        console.error(
            `❌ Validatiebestand niet gevonden: ${VALIDATION_FILE}`
        );
        return false;
    }

    console.log(
        `✓ Validatiebestand gevonden: ${VALIDATION_FILE}`
    );

    return true;
}

function runApplyRepair(): boolean {
    console.log('\n====================================');
    console.log(' Stap 5 - Veilige repairs toepassen');
    console.log('====================================');

    return runCommand(
        'npx',
        ['tsx', 'scripts/apply-repair.ts'],
        'Repairs toepassen'
    );
}

function getRepairedTests(): {
    test: string;
    file: string;
    line: number;
}[] {
    if (!fs.existsSync(PROPOSAL_FILE)) {
        return [];
    }

    const proposal = JSON.parse(
        fs.readFileSync(PROPOSAL_FILE, 'utf-8')
    );

    return (proposal.proposals || [])
        .filter(
            (proposal: RepairProposal) =>
                proposal.repairPossible === true &&
                proposal.classification === 'TEST_DEFECT'
        )
        .map((proposal: RepairProposal) => ({
            test: proposal.test,
            file: proposal.file,
            line: proposal.line
        }));
}

function runRepairedTests(
    repairedTests: {
        test: string;
        file: string;
        line: number;
    }[]
): boolean {
    console.log('\n====================================');
    console.log(' Stap 6 - Gerepareerde tests opnieuw uitvoeren');
    console.log('====================================');

    let allPassed = true;

    for (const repairedTest of repairedTests) {
        const testName = repairedTest.test;
        const file = repairedTest.file.replace(/\\/g, '/');
        const line = repairedTest.line;

        console.log(`\nTest opnieuw uitvoeren: ${testName}`);
        console.log(`Bestand: ${file}`);
        console.log(`Regel repair: ${line}`);
        console.log(`Grep: ${testName}`);

        const result = spawnSync(
            'npx.cmd',
            [
                'playwright',
                'test',
                file,
                '--grep',
                testName
            ],
            {
                stdio: 'inherit',
                shell: false
            }
        );

        if (result.status !== 0) {
            console.log(`❌ Test gefaald: ${testName}`);
            allPassed = false;
        } else {
            console.log(`✓ Test geslaagd: ${testName}`);
        }
    }

    return allPassed;
}

function main(): void {
    console.log('\n====================================');
    console.log(' AI Repair Pipeline');
    console.log('====================================');

    // --------------------------------------------------
    // Stap 1: originele tests uitvoeren
    // --------------------------------------------------

    const initialRunPassed = runPlaywright();

    /*
     * Een failure in de eerste Playwright run is hier
     * geen pipeline failure. Het is juist de trigger
     * voor de AI repair workflow.
     */
    if (initialRunPassed) {
        console.log('\n🎉 SUCCESS');
        console.log('Alle Playwright tests zijn al geslaagd.');
        console.log('\n====================================');
        return;
    }

    // --------------------------------------------------
    // Controleren of er daadwerkelijk failures zijn
    // --------------------------------------------------

    if (!hasFailedTests()) {
        console.log('\n⚠️ Playwright gaf een foutmelding, maar er');
        console.log('zijn geen gefaalde tests gevonden.');
        process.exit(1);
    }

    // --------------------------------------------------
    // Stap 2: failures analyseren
    // --------------------------------------------------

    if (!runAnalyzer()) {
        process.exit(1);
    }

    // --------------------------------------------------
    // Stap 3: repair voorstellen genereren
    // --------------------------------------------------

    if (!runRepairAnalyzer()) {
        process.exit(1);
    }

    // --------------------------------------------------
    // Stap 4: repair voorstellen valideren
    // --------------------------------------------------

    if (!runValidator()) {
        process.exit(1);
    }

    // --------------------------------------------------
    // Stap 5: gevalideerde repairs toepassen
    // --------------------------------------------------

    if (!runApplyRepair()) {
        process.exit(1);
    }

    // --------------------------------------------------
    // Stap 6: alleen gerepareerde tests opnieuw uitvoeren
    // --------------------------------------------------

    const repairedTests = getRepairedTests();

    if (repairedTests.length === 0) {
        console.log('\n⚠️ Geen gerepareerde tests gevonden.');
        process.exit(1);
    }

    console.log(
        `\nAantal gerepareerde tests: ${repairedTests.length}`
    );

    const repairedTestsPassed = runRepairedTests(repairedTests);

    // --------------------------------------------------
    // Eindresultaat
    // --------------------------------------------------

    console.log('\n====================================');

    if (!repairedTestsPassed) {
        console.log(' ❌ FAILURE');
        console.log('');
        console.log(
            'De voorgestelde repairs zijn toegepast,'
        );
        console.log(
            'maar één of meer gerepareerde tests falen nog steeds.'
        );
        console.log('====================================');

        process.exit(1);
    }

    console.log(' 🎉 SUCCESS');
    console.log('');
    console.log(
        'Failures zijn automatisch geanalyseerd,'
    );
    console.log(
        'gevalideerd, gerepareerd en opnieuw getest.'
    );
    console.log('');
    console.log('====================================');
}

main();

