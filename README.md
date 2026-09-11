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
     

Het idee achter deze setup:
Ik zou AI niet onbeperkt toegang geven tot de testcode. Ik zou AI eerst gebruiken om een failure te analyseren en een concrete repair proposal te genereren. Vervolgens laat ik een deterministische validator controleren of de voorgestelde wijziging daadwerkelijk overeenkomt met de huidige broncode en of de wijziging minimaal is. Alleen veilige wijzigingen worden toegepast, waarbij eerst een backup wordt gemaakt. Daarna worden de gerepareerde tests opnieuw uitgevoerd om te verifiëren dat de repair daadwerkelijk werkt.

*** Ollama ***

Ollama is een gratis, open-source programma waarmee je grote taalmodellen (LLM's) lokaal op je eigen computer of server kunt draaien. 

Privacy: Je gegevens en prompts blijven op je eigen computer staan en worden niet naar externe servers gestuurd.

Geen internet nodig: Je kunt de AI-modellen volledig offline gebruiken nadat je ze hebt gedownload.

Geen kosten: Er zijn geen abonnementen of betalingen per gebruik (API-calls) nodig.

Eenvoud: Het vereenvoudigt het installeren en beheren van complexe AI-modellen flink via een duidelijke command-line-workflow

Ollama lokaal opstarten: ollama run qwen3:8b-q4_K_M