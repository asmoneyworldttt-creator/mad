const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\index.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add global White-Space and Flex-Shrink rules inside @layer base (before closing })
const baseCloseRegex = /([ ]*button.icon-sm \{[\s\S]*?\}\s*)(\})/;
const ruleAdditions = `
  svg, .lucide {
    flex-shrink: 0 !important;
  }

  button, .badge, [class*="badge"], [class*="status"] {
    white-space: nowrap !important;
  }
`;

if (content.match(baseCloseRegex)) {
    content = content.replace(baseCloseRegex, (m, p1, p2) => p1 + ruleAdditions + p2);
} else {
    console.log("Could not find button.icon-sm closure. Appending to layer base manually.");
    content = content.replace(/(@layer base \{[\s\S]*?)\}/, (m, p1) => p1 + ruleAdditions + "}\n");
}

// 2. Fix mobile overflow-wrap anywhere at line 677
content = content.replace(/p,\s*span\s*\{\s*overflow-wrap:\s*anywhere;\s*\}/g, 'p, span {\n    overflow-wrap: break-word;\n  }');

fs.writeFileSync(filePath, content);
console.log("Success");
