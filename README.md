Workflow:

Playwright
    ↓
2 failures gedetecteerd
    ↓
AI Failure Analyzer
    ↓
2 × TEST_DEFECT
    ↓
AI Repair Analyzer
    ↓
2 repair proposals
    ↓
Deterministische Validator
    ↓
2 × SAFE TO APPLY
    ↓
Backup maken
    ↓
2 repairs toepassen
    ↓
Re-run
    ↓
3 tests passed
    ↓
🎉 SUCCESS

Het idee achter deze setup:
Ik zou AI niet onbeperkt toegang geven tot de testcode. Ik zou AI eerst gebruiken om een failure te analyseren en een concrete repair proposal te genereren. Vervolgens laat ik een deterministische validator controleren of de voorgestelde wijziging daadwerkelijk overeenkomt met de huidige broncode en of de wijziging minimaal is. Alleen veilige wijzigingen worden toegepast, waarbij eerst een backup wordt gemaakt. Daarna worden de gerepareerde tests opnieuw uitgevoerd om te verifiëren dat de repair daadwerkelijk werkt.