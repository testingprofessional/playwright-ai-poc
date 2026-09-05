import ollama from 'ollama';

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

async function main() {
  console.log('Verbinden met Ollama...');

  const response = await ollama.chat({
    model: 'qwen3:8b-q4_K_M',
    format: schema,
    messages: [
      {
        role: 'user',
        content: `
Analyseer deze Playwright failure.

De test verwacht:
"BUG Learn Playwright BUG with AI BUG"

De daadwerkelijke UI bevat:
"Learn Playwright with AI"

Classificeer de oorzaak.

Geef:
- classification
- confidence
- reason
- evidence
- suggested_fix
        `,
      },
    ],
  });

  console.log('');
  console.log('Antwoord van Ollama:');
  console.log(response.message.content);
}

main().catch((error) => {
  console.error('');
  console.error('FOUT:');
  console.error(error);
});