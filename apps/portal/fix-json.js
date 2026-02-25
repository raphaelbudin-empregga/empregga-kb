const fs = require('fs');

function fixJSON(str) {
    let result = '';
    let inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const prev = str[i - 1];

        if (char === '"' && prev !== '\\') {
            inString = !inString;
        }

        if (inString && char === '\n') {
            result += '\\n';
        } else if (inString && char === '\r') {
            // Ignorar carriage returns dentro de strings para padronizar
            result += '';
        } else {
            result += char;
        }
    }
    return result;
}

const content = fs.readFileSync('base_eva.json', 'utf8');
const fixedContent = fixJSON(content);

try {
    JSON.parse(fixedContent);
    fs.writeFileSync('base_eva_fixed.json', fixedContent);
    console.log('JSON corrigido e salvo como base_eva_fixed.json com sucesso!');
} catch (e) {
    console.error('Ainda há erros no JSON mesmo após a correção de novas linhas:', e.message);
}
