const vscode = require('vscode');

const colorSquare = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: '■',
    margin: '0 0 0 4px'
  }
});

const hexBbggrrRegex = /\$[0-9a-fA-F]{6}/g;
const decimalBbggrrRegex = /(^|\r?\n)([^\r\n=]*(?:Color|CursorText)[^\r\n=]*\s*=\s*)(\d{1,8})(?=\s*(?:[;#][^\r\n]*)?(?:\r?\n|$))/gi;

function bbggrrHexToRgb(bbggrr) {
  return `#${bbggrr.slice(4, 6)}${bbggrr.slice(2, 4)}${bbggrr.slice(0, 2)}`;
}

function decimalBbggrrToRgb(decimalBbggrr) {
  const colorValue = Number(decimalBbggrr);

  if (!Number.isInteger(colorValue) || colorValue < 0 || colorValue > 0xffffff) {
    return undefined;
  }

  return bbggrrHexToRgb(colorValue.toString(16).padStart(6, '0'));
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

function paint(editor) {
  if (!editor || !editor.document.fileName.endsWith('.ini')) {
    return;
  }

  const text = editor.document.getText();
  const decorations = [];
  let match;

  while ((match = hexBbggrrRegex.exec(text))) {
    const bbggrr = match[0].slice(1);
    const color = bbggrrHexToRgb(bbggrr);

    addDecoration(editor, decorations, match.index, match[0].length, color);
  }

  while ((match = decimalBbggrrRegex.exec(text))) {
    const color = decimalBbggrrToRgb(match[3]);

    if (!color) {
      continue;
    }

    addDecoration(editor, decorations, match.index + match[1].length + match[2].length, match[3].length, color);
  }

  editor.setDecorations(colorSquare, decorations);
}

function activate(context) {
  paint(vscode.window.activeTextEditor);
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(paint));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => paint(vscode.window.activeTextEditor)));
}

function deactivate() {}

module.exports = { activate, deactivate };
