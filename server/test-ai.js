const ai = require("./services/ai/ollama.service");

async function main() {
    const reply = await ai.chat(
        "Reply ONLY with: AI Service Working"
    );

    console.log(reply);
}

main();