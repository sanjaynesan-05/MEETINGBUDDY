const summaryProcessor = require("./services/ai/processors/meeting.processor");

async function main() {

    const transcript = `
John:
Welcome everyone.

Thomas:
We need to finish the authentication module by Friday.

Neil:
I'll prepare the deployment report.

John:
Let's deploy on Monday.
`;

    const summary = await summaryProcessor.generate(transcript);

    console.log("\n===== AI SUMMARY =====\n");
    console.log(summary);

}

main();