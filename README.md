Workflow:

                 START
                   │
          ┌────────┴────────┐
          │                 │
     Handmatig          Pipeline
          │                 │
          └────────┬────────┘
                   ↓
          Playwright tests
                   ↓
             Alles groen?
              /         \
            JA           NEE
            │             │
            ↓             ↓
          KLAAR      Failure Analysis
                          ↓
                  Wat is de oorzaak?
                          ↓
          ┌───────────────┼───────────────┐
          │               │               │
     TEST_DEFECT     APP/ENV/FLAKY      UNKNOWN
          │               │               │
          ↓               └──────→ STOP
   Repair Candidate

          ↓

   Repair Proposal

          ↓

   Deterministische
   Repair Validation

          ↓
      Veilig?
       /    \
     NEE     JA
     │        │
    STOP      ↓
         Backup maken
              ↓
        Repair toepassen
              ↓
       Gerepareerde test
          opnieuw draaien
              ↓
           Passed?
          /       \
        JA         NEE
        │           │
        ↓           ↓
     SUCCESS      FAILURE

Example run:

PS C:\Projecten\playwright-ai-poc\playwright-ai-poc> npm run ai-repair                          
                                
> playwright-ai-poc@1.0.0 ai-repair
> tsx scripts/ai-repair.ts


====================================
 AI Repair Pipeline
====================================

====================================
 Stap 1 - Playwright tests uitvoeren
====================================

▶ Playwright test run
$ npx playwright test

Running 8 tests using 4 workers

  ✓  1 [chromium] › tests\todo.spec.ts:14:5 › user can complete a todo (13.0s)
  ✓  2 [chromium] › tests\todo.spec.ts:3:5 › user can add a todo (12.8s)
  ✘  3 …ium] › tests\todoCopilot.spec.ts:10:5 › allows a user to add multiple todo items (16.2s)
  ✓  4 [chromium] › tests\todo.spec.ts:27:5 › user can delete a todo (12.1s)
  ✓  5 …Copilot.spec.ts:24:5 › allows a user to complete a todo and clear completed items (1.8s)
  ✓  6 …m] › tests\todoCopilot.spec.ts:41:5 › allows a user to edit an existing todo item (1.6s)
  ✓  7 …ot.spec.ts:59:5 › does not add a todo when the input value is empty or whitespace (1.6s)
  ✓  8 …oCopilot.spec.ts:72:5 › filters the todo list by all, active, and completed items (1.5s)


  1) [chromium] › tests\todoCopilot.spec.ts:10:5 › allows a user to add multiple todo items ────

    Error: expect(locator).toBeVisible() failed

    Locator: locator('.todo-list li').filter({ hasText: 'Buy XXX milk' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for locator('.todo-list li').filter({ hasText: 'Buy XXX milk' })


      17 |   const secondTodo = page.locator('.todo-list li').filter({ hasText: 'Write Playwright tests' });
      18 |
    > 19 |   await expect(firstTodo).toBeVisible();
         |                           ^
      20 |   await expect(secondTodo).toBeVisible();
      21 |   await expect(page.getByText('2 items left')).toBeVisible();
      22 | });
        at C:\Projecten\playwright-ai-poc\playwright-ai-poc\tests\todoCopilot.spec.ts:19:27

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────
    test-results\todoCopilot-allows-a-user-to-add-multiple-todo-items-chromium\test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────

    attachment #2: video (video/webm) ──────────────────────────────────────────────────────────
    test-results\todoCopilot-allows-a-user-to-add-multiple-todo-items-chromium\video.webm
    ────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results\todoCopilot-allows-a-user-to-add-multiple-todo-items-chromium\error-context.md

    attachment #4: trace (application/zip) ─────────────────────────────────────────────────────
    test-results\todoCopilot-allows-a-user-to-add-multiple-todo-items-chromium\trace.zip
    Usage:

        npx playwright show-trace test-results\todoCopilot-allows-a-user-to-add-multiple-todo-items-chromium\trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    [chromium] › tests\todoCopilot.spec.ts:10:5 › allows a user to add multiple todo items ─────
  7 passed (18.8s)

To open last HTML report run:

  npx playwright show-report

❌ Playwright test run mislukt.

Aantal gefaalde tests: 1

====================================
 Stap 2 - AI failure analyse
====================================

▶ AI failure analyse
$ npx tsx scripts/analyze-failure.ts

========================================
 Playwright AI Failure Analyzer
========================================

Aantal failed tests gevonden: 1

Analyseer: allows a user to add multiple todo items
AI analyse poging 1/3...
AI analyse mislukt bij poging 1.
Opnieuw proberen over 2 seconden...
AI analyse poging 2/3...
Classification: TEST_DEFECT
Confidence: 0.95%
Reason: The test is looking for text 'Buy XXX milk' but the actual text added is 'Buy milk'. The typo in the hasText filter causes the locator to fail finding the element.
Suggested fix: Update the hasText filter to match the actual text added:

const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy milk' });

========================================
 AI analyse afgerond
========================================

Failed tests: 1
Geanalyseerd: 1
Test defects: 1
Application defects: 0
Flaky tests: 0
Environment problems: 0
Unknown: 0

AI analyse opgeslagen in: C:\Projecten\playwright-ai-poc\playwright-ai-poc\test-results\ai-analysis.json

✓ AI failure analyse geslaagd.
✓ Analysebestand gevonden: test-results/ai-analysis.json

====================================
 Stap 3 - AI repair voorstellen
====================================

▶ AI repair analyse
$ npx tsx scripts/repair-failure.ts

====================================
 Playwright AI Repair Analyzer
====================================

Aantal analyses: 1

------------------------------------
Test: allows a user to add multiple todo items
Classification: TEST_DEFECT
------------------------------------
Broncode rond regel 10 wordt aan Qwen3 gegeven.
Repair proposal wordt gegenereerd door Qwen3...

Repair analyse poging 1/3...
Repair proposal:
Repair possible: true
File: tests\todoCopilot.spec.ts
Line: 15

Original:
  const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy XXX milk' });

Replacement:
  const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy milk' });

Reason:
The test is looking for text 'Buy XXX milk' but the actual text added is 'Buy milk'. The typo in the hasText filter causes the locator to fail finding the element.

====================================
 Repair proposals opgeslagen
====================================

C:\Projecten\playwright-ai-poc\playwright-ai-poc\test-results\repair-proposal.json

✓ AI repair analyse geslaagd.
✓ Repair proposal bestand gevonden: test-results/repair-proposal.json

====================================
 Stap 4 - Repair voorstellen valideren
====================================

▶ Repair validatie
$ npx tsx scripts/validate-repair.ts

====================================
 Playwright AI Repair Validator
====================================

Aantal repair proposals: 1

------------------------------------
Test: allows a user to add multiple todo items
------------------------------------
✓ Test file exists
✓ Original code found
✓ Replacement code is valid
✓ Line number plausible
✓ Minimal change detected

RESULT: SAFE TO APPLY

====================================
 Validation afgerond
====================================

Repair proposals: 1
SAFE TO APPLY: 1
DO NOT APPLY: 0

Validation opgeslagen in:
C:\Projecten\playwright-ai-poc\playwright-ai-poc\test-results\repair-validation.json

✓ Repair validatie geslaagd.
✓ Validatiebestand gevonden: test-results/repair-validation.json

====================================
 Stap 5 - Veilige repairs toepassen
====================================

▶ Repairs toepassen
$ npx tsx scripts/apply-repair.ts

====================================
 Playwright AI Repair Applier
====================================

Repair proposals : 1
Validations       : 1
Safe to apply     : 1
Rejected          : 0

------------------------------------
Test: allows a user to add multiple todo items
------------------------------------
✓ Validation says SAFE TO APPLY
✓ Repair is possible
File: C:\Projecten\playwright-ai-poc\playwright-ai-poc\tests\todoCopilot.spec.ts
Line: 15
✓ Test file exists
✓ Original code still exists
✓ Exactly one matching occurrence found
✓ Replacement code is valid

Original code:
------------------------------------
  const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy XXX milk' });

Replacement code:
------------------------------------
  const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy milk' });

✓ Backup created:
  C:\Projecten\playwright-ai-poc\playwright-ai-poc\tests\todoCopilot.spec.ts.2026-09-11T15-11-42-166Z.backup

Normalized replacement:
------------------------------------
  const firstTodo = page.locator('.todo-list li').filter({ hasText: 'Buy milk' });

✓ Repair applied successfully

====================================
 Repair applicatie afgerond
====================================

Totaal proposals : 1
Applied          : 1
Skipped          : 0

✓ AI repairs zijn toegepast op de testbestanden.

✓ Repairs toepassen geslaagd.

Aantal gerepareerde tests: 1

====================================
 Stap 6 - Gerepareerde tests opnieuw uitvoeren
====================================

Test opnieuw uitvoeren: allows a user to add multiple todo items
Bestand: tests/todoCopilot.spec.ts
Regel repair: 15
Grep: allows a user to add multiple todo items

Running 1 test using 1 worker

  ✓  1 …ium] › tests\todoCopilot.spec.ts:10:5 › allows a user to add multiple todo items (11.1s)

  1 passed (12.6s)

To open last HTML report run:

  npx playwright show-report

✓ Test geslaagd: allows a user to add multiple todo items

====================================
 🎉 SUCCESS

Failures zijn automatisch geanalyseerd,
gevalideerd, gerepareerd en opnieuw getest.

-------------------------------------------------------

Het idee achter deze setup:
Ik zou AI niet onbeperkt toegang geven tot de testcode. Ik zou AI eerst gebruiken om een failure te analyseren en een concrete repair proposal te genereren. Vervolgens laat ik een deterministische validator controleren of de voorgestelde wijziging daadwerkelijk overeenkomt met de huidige broncode en of de wijziging minimaal is. Alleen veilige wijzigingen worden toegepast, waarbij eerst een backup wordt gemaakt. Daarna worden de gerepareerde tests opnieuw uitgevoerd om te verifiëren dat de repair daadwerkelijk werkt.

*** Ollama ***

Ollama is een gratis, open-source programma waarmee je grote taalmodellen (LLM's) lokaal op je eigen computer of server kunt draaien. 

Privacy: Je gegevens en prompts blijven op je eigen computer staan en worden niet naar externe servers gestuurd.

Geen internet nodig: Je kunt de AI-modellen volledig offline gebruiken nadat je ze hebt gedownload.

Geen kosten: Er zijn geen abonnementen of betalingen per gebruik (API-calls) nodig.

Eenvoud: Het vereenvoudigt het installeren en beheren van complexe AI-modellen flink via een duidelijke command-line-workflow

Ollama lokaal opstarten: ollama run qwen3:8b-q4_K_M