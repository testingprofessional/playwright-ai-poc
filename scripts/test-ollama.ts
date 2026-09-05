import ollama from 'ollama';

async function main() {
  console.log('Verbinden met Ollama...');

  const response = await ollama.chat({
    model: 'qwen3:8b-q4_K_M',
    messages: [
      {
        role: 'user',
        content: 'Antwoord uitsluitend met: OLLAMA OK',
      },
    ],
  });

  console.log('Antwoord van Ollama:');
  console.log(response.message.content);
}

main().catch((error) => {
  console.error('FOUT:');
  console.error(error);
});