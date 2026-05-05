const buffer = '{"candidates":[{"content":{"parts":[{"text": "The word \\"kaa\\" in Swahili is a homograph, meaning it is spelled the same but...."}]}}]}';

const textMatches = Array.from(buffer.matchAll(/"text":\s*"((?:\\.|[^"\\])*)"/g));
console.log(textMatches.length);
if (textMatches.length > 0) {
  textMatches.forEach(m => {
     console.log("MATCH 1:", m[1]);
     try {
       console.log("PARSED:", JSON.parse(`"${m[1]}"`));
     } catch (e) {
       console.error("FAILED PARSE", e);
     }
  });
}
