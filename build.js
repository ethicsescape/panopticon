const fs = require("fs");
const btoa = require("btoa");

const rawClueFile = fs.readFileSync("./clues.json");
const clueData = JSON.parse(rawClueFile);
let hintData = [];
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
    if (clue.hint) {
        hintData.push({
            id: clueId,
            hint: btoa(clue.hint),
            preview: clue.preview
        });
    }
});
fs.writeFileSync(`./_data/hints.json`, JSON.stringify(hintData, undefined, 2));
