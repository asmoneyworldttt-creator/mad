import fs from 'fs';

const path = 'd:\\live p\\medpro\\src\\components\\views\\LabWork.tsx';
let content = fs.readFileSync(path, 'utf-8');

const anchor = '                            })}\n                        </tbody>\n                    </table>';

if (content.includes(anchor)) {
    // Only replacing the nested inner table closures with the outer level DIV template closure setup!
    content = content.replace(anchor, '                            })}\n                    </div>');
    
    // Also, remove the EXCESS tag from the very bottom
    const bottomRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/;
    if (bottomRegex.test(content)) {
        content = content.replace(bottomRegex, '</div>\n\t\t\t</div>\n\t);\n}');
        fs.writeFileSync(path, content, 'utf-8');
        console.log('Layout streamlined perfectly!');
    }
} else {
    console.log('Static anchor bottom closure match failed!');
}
