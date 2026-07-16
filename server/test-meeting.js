const meetingProcessor = require("./services/ai/processors/meeting.processor");

async function main() {

    const transcript = `
John:
Welcome everyone.

Thomas:
The authentication module must be completed by Friday.

Neil:
I'll prepare the deployment report.

John:
We'll deploy on Monday.
`;

    const result = await meetingProcessor.analyze(transcript);

    console.log(JSON.stringify(result, null, 2));

}

main();