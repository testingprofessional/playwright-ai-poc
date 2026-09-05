import fs from 'fs';
import path from 'path';

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
    generatedAt: string;
    model: string;
    proposals: RepairProposal[];
}

interface ValidationResult {
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
}

interface ValidationFile {
    generatedAt: string;
    summary: {
        total: number;
        safeToApply: number;
        rejected: number;
    };
    results: ValidationResult[];
}

const PROJECT_ROOT = process.cwd();

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

function normalizeCode(code: string): string {
    return code
        .replace(/\r\n/g, '\n')
        .trim();
}

function createBackup(filePath: string): string {
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-');

    const backupPath = `${filePath}.${timestamp}.backup`;

    fs.copyFileSync(filePath, backupPath);

    return backupPath;
}

function applySingleRepair(
    proposal: RepairProposal,
    validation: ValidationResult
): boolean {

    console.log('');
    console.log('------------------------------------');
    console.log(`Test: ${proposal.test}`);
    console.log('------------------------------------');

    // --------------------------------------------------
    // 1. Controleer validatie
    // --------------------------------------------------

    if (!validation.safeToApply) {
        console.log('✗ Validation says this repair is NOT safe');
        console.log('  Skipping repair.');

        return false;
    }

    console.log('✓ Validation says SAFE TO APPLY');

    // --------------------------------------------------
    // 2. Controleer repairPossible
    // --------------------------------------------------

    if (!proposal.repairPossible) {
        console.log('✗ Repair is not possible');
        console.log('  Skipping repair.');

        return false;
    }

    console.log('✓ Repair is possible');

    // --------------------------------------------------
    // 3. Bepaal bestand
    // --------------------------------------------------

    const filePath = path.resolve(
        PROJECT_ROOT,
        proposal.file
    );

    console.log(`File: ${filePath}`);
    console.log(`Line: ${proposal.line}`);

    // --------------------------------------------------
    // 4. Controleer of bestand bestaat
    // --------------------------------------------------

    if (!fs.existsSync(filePath)) {
        console.log('✗ Test file does not exist');

        return false;
    }

    console.log('✓ Test file exists');

    // --------------------------------------------------
    // 5. Lees actuele broncode
    // --------------------------------------------------

    const source = fs.readFileSync(
        filePath,
        'utf-8'
    );

    const normalizedSource = normalizeCode(source);
    const normalizedOriginal = normalizeCode(
        proposal.originalCode
    );

    // --------------------------------------------------
    // 6. BELANGRIJK:
    //    Controleer opnieuw of originalCode bestaat
    // --------------------------------------------------

    if (!normalizedSource.includes(normalizedOriginal)) {

        console.log(
            '✗ Original code is no longer present'
        );

        console.log('');
        console.log(
            '  The file may have changed since validation.'
        );

        console.log(
            '  NO changes will be made.'
        );

        return false;
    }

    console.log(
        '✓ Original code still exists'
    );

    // --------------------------------------------------
    // 7. Controleer aantal matches
    // --------------------------------------------------

    const occurrences =
        normalizedSource
            .split(normalizedOriginal)
            .length - 1;

    if (occurrences !== 1) {

        console.log(
            `✗ Original code occurs ${occurrences} times`
        );

        console.log(
            '  Exactly one occurrence is required.'
        );

        return false;
    }

    console.log(
        '✓ Exactly one matching occurrence found'
    );

    // --------------------------------------------------
    // 8. Controleer replacement
    // --------------------------------------------------

    if (!proposal.replacementCode.trim()) {

        console.log(
            '✗ Replacement code is empty'
        );

        return false;
    }

    if (
        normalizeCode(proposal.originalCode) ===
        normalizeCode(proposal.replacementCode)
    ) {

        console.log(
            '✗ Replacement is identical to original'
        );

        return false;
    }

    console.log(
        '✓ Replacement code is valid'
    );

    // --------------------------------------------------
    // 9. Toon wijziging
    // --------------------------------------------------

    console.log('');
    console.log('Original code:');
    console.log('------------------------------------');
    console.log(proposal.originalCode);

    console.log('');
    console.log('Replacement code:');
    console.log('------------------------------------');
    console.log(proposal.replacementCode);

    // --------------------------------------------------
    // 10. Maak backup
    // --------------------------------------------------

    const backupPath = createBackup(filePath);

    console.log('');
    console.log('✓ Backup created:');
    console.log(`  ${backupPath}`);

    // --------------------------------------------------
    // 11. Voer exacte replacement uit
    // --------------------------------------------------

    const index =
        normalizedSource.indexOf(
            normalizedOriginal
        );

    const updatedSource =
        normalizedSource.substring(0, index) +
        proposal.replacementCode +
        normalizedSource.substring(
            index + normalizedOriginal.length
        );

    // --------------------------------------------------
    // 12. Controleer of er daadwerkelijk iets veranderd is
    // --------------------------------------------------

    if (updatedSource === normalizedSource) {

        console.log(
            '✗ No change detected'
        );

        return false;
    }

    // --------------------------------------------------
    // 13. Schrijf bestand
    // --------------------------------------------------

    fs.writeFileSync(
        filePath,
        updatedSource,
        'utf-8'
    );

    console.log('');
    console.log(
        '✓ Repair applied successfully'
    );

    return true;
}

function main() {

    console.log('');
    console.log('====================================');
    console.log(' Playwright AI Repair Applier');
    console.log('====================================');
    console.log('');

    // --------------------------------------------------
    // Controleer proposal file
    // --------------------------------------------------

    if (!fs.existsSync(PROPOSAL_FILE)) {

        console.error(
            `Repair proposal file not found:\n${PROPOSAL_FILE}`
        );

        process.exit(1);
    }

    // --------------------------------------------------
    // Controleer validation file
    // --------------------------------------------------

    if (!fs.existsSync(VALIDATION_FILE)) {

        console.error(
            `Repair validation file not found:\n${VALIDATION_FILE}`
        );

        process.exit(1);
    }

    // --------------------------------------------------
    // Lees proposal file
    // --------------------------------------------------

    const proposalData: RepairProposalFile =
        JSON.parse(
            fs.readFileSync(
                PROPOSAL_FILE,
                'utf-8'
            )
        );

    // --------------------------------------------------
    // Lees validation file
    // --------------------------------------------------

    const validationData: ValidationFile =
        JSON.parse(
            fs.readFileSync(
                VALIDATION_FILE,
                'utf-8'
            )
        );

    console.log(
        `Repair proposals : ${proposalData.proposals.length}`
    );

    console.log(
        `Validations       : ${validationData.results.length}`
    );

    console.log(
        `Safe to apply     : ${validationData.summary.safeToApply}`
    );

    console.log(
        `Rejected          : ${validationData.summary.rejected}`
    );

    let applied = 0;
    let skipped = 0;

    // --------------------------------------------------
    // Verwerk iedere proposal
    // --------------------------------------------------

    for (const proposal of proposalData.proposals) {

        // Zoek bijbehorende validatie
        const validation =
            validationData.results.find(
                result =>
                    result.test === proposal.test
            );

        if (!validation) {

            console.log('');
            console.log('------------------------------------');
            console.log(`Test: ${proposal.test}`);
            console.log('------------------------------------');

            console.log(
                '✗ No matching validation result found'
            );

            skipped++;

            continue;
        }

        const result =
            applySingleRepair(
                proposal,
                validation
            );

        if (result) {
            applied++;
        } else {
            skipped++;
        }
    }

    // --------------------------------------------------
    // Eindresultaat
    // --------------------------------------------------

    console.log('');
    console.log('====================================');
    console.log(' Repair applicatie afgerond');
    console.log('====================================');
    console.log('');

    console.log(
        `Totaal proposals : ${proposalData.proposals.length}`
    );

    console.log(
        `Applied          : ${applied}`
    );

    console.log(
        `Skipped          : ${skipped}`
    );

    console.log('');

    if (applied > 0) {

        console.log(
            '✓ AI repairs zijn toegepast op de testbestanden.'
        );

    } else {

        console.log(
            'Geen repairs toegepast.'
        );
    }

    console.log('');
}

main();