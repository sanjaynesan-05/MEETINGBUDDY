const { default: ollama } = require("ollama");

async function test() {
  try {
    const response = await ollama.chat({
      model: "qwen2.5:7b",
      messages: [
        {
          role: "user",
          content: "Reply with exactly: Ollama connection successful."
        }
      ]
    });

    console.log("\nAI Response:");
    console.log(response.message.content);

  } catch (err) {
    console.error(err);
  }
}

test();