const m = '"text": "Hello! How can I help you today?"';
const startIndex = m.indexOf(':"') + 2;
const endIndex = m.length - 1;
const escapedContent = m.substring(startIndex, endIndex);
console.log("escapedContent:", escapedContent);
try {
  console.log(JSON.parse(`"${escapedContent}"`));
} catch(e) {
  console.error("JSON parse failed");
}
