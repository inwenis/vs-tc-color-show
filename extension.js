const vscode = require('vscode');

const colorSquare = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: '■',
    margin: '0 0 0 4px'
  }
});

const hexBbggrrRegex = /\$[0-9a-fA-F]{6}/g;
const decimalColorKeyRegex = /^(?:BackColor2?|ForeColor|MarkColor|CursorColor|CursorText|ColorFilter\d+Color)$/i;
const decimalValueRegex = /^\d{1,8}$/;

function bbggrrToCssHex(bbggrr) {
  return `#${bbggrr.slice(4, 6)}${bbggrr.slice(2, 4)}${bbggrr.slice(0, 2)}`;
}

function decimalBbggrrToCssHex(decimalBbggrr) {
  const colorValue = Number(decimalBbggrr);

  if (!Number.isInteger(colorValue) || colorValue < 0 || colorValue > 0xffffff) {
    return undefined;
  }

  return bbggrrToCssHex(colorValue.toString(16).padStart(6, '0'));
}

function isDecimalColorKey(key) {
  return decimalColorKeyRegex.test(key);
}

function addDecoration(editor, decorations, startIndex, length, color) {
  const start = editor.document.positionAt(startIndex);
  const end = editor.document.positionAt(startIndex + length);

  decorations.push({
    range: new vscode.Range(start, end),
    renderOptions: {
      after: {
        color
      }
    }
  });
}

function addDecimalColorDecorations(editor, decorations) {
  for (let lineNumber = 0; lineNumber < editor.document.lineCount; lineNumber++) {
    const line = editor.document.lineAt(lineNumber).text;
    const trimmedLine = line.trimStart();

    if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();

    if (!isDecimalColorKey(key)) {
      continue;
    }

    const value = line.slice(equalsIndex + 1).split(/[;#]/)[0].trim();

    if (!decimalValueRegex.test(value)) {
      continue;
    }

    const color = decimalBbggrrToCssHex(value);

    if (!color) {
      continue;
    }

    const valueStartCharacter = line.indexOf(value, equalsIndex + 1);
    const valueStart = editor.document.offsetAt(new vscode.Position(lineNumber, valueStartCharacter));

    addDecoration(editor, decorations, valueStart, value.length, color);
  }
}

function paint(editor) {
  if (!editor || !editor.document.fileName.toLowerCase().endsWith('.ini')) {
    return;
  }

  const text = editor.document.getText();
  const decorations = [];
  let match;

  while ((match = hexBbggrrRegex.exec(text))) {
    const bbggrr = match[0].slice(1);
    const color = bbggrrToCssHex(bbggrr);

    addDecoration(editor, decorations, match.index, match[0].length, color);
  }

  addDecimalColorDecorations(editor, decorations);

  editor.setDecorations(colorSquare, decorations);
}

function activate(context) {
  paint(vscode.window.activeTextEditor);
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(paint));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => paint(vscode.window.activeTextEditor)));
}

function deactivate() {}

module.exports = { activate, deactivate };
