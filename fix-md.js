const fs = require('fs');

const files = ['DEMO_GUIDE.md', 'DEMO_SCRIPT.md'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    // Normalize newlines
    text = text.replace(/\r\n/g, '\n');
    
    // Fix trailing spaces
    text = text.replace(/[ \t]+$/gm, '');
    
    // Fix list item spacing
    text = text.replace(/^(\s*[\*\-])[ \t]{2,}/gm, '$1 ');
    
    // Fix heading spacing (blank line before and after)
    text = text.replace(/([^\n])\n(#{1,6} .+)/g, '$1\n\n$2');
    text = text.replace(/(#{1,6} .+)\n([^\n])/g, '$1\n\n$2');
    
    // Fix list block spacing
    text = text.replace(/([^\n]*)\n(\s*[\*\-] .+)/g, (match, p1, p2) => {
        if (!p1.trim() || p1.match(/^#{1,6}/) || p1.match(/^\s*[\*\-]/)) return match;
        return `${p1}\n\n${p2}`;
    });

    fs.writeFileSync(f, text);
  }
});
console.log("Fixed markdown files!");
