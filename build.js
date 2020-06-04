const fs = require("fs");
const btoa = require("btoa");

const rawClueFile = fs.readFileSync("./clues.json");
const clueData = JSON.parse(rawClueFile);
Object.keys(clueData).forEach((clueId) => {
    const clue = clueData[clueId];
    const fileLines = [
        `---`,
        `layout: secure`,
        `password: ${btoa(clue.password)}`,
        `document: ${btoa(encodeURI(clue.document))}`,
        `preview: ${clue.preview}`,
        `---`
    ];
    fs.writeFileSync(`./_secure/${clueId}.md`, fileLines.join("\n"));
});