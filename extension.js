const vscode = require('vscode');

const colorSquare = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: '■',
    margin: '0 0 0 4px'
  }
});

function paint(editor) {
  const text = editor.document.getText();
  const decorations = [];
  const regex = /\$[0-9a-fA-F]{6}/g;
  let match;

  while ((match = regex.exec(text))) {
    const start = editor.document.positionAt(match.index);
    const end = editor.document.positionAt(match.index + match[0].length);
    const bbggrr = match[0].slice(1);
    const color = `#${bbggrr.slice(4, 6)}${bbggrr.slice(2, 4)}${bbggrr.slice(0, 2)}`;

    decorations.push({
      range: new vscode.Range(start, end),
      renderOptions: {
        after: {
          color
        }
      }
    });
  }

  editor.setDecorations(colorSquare, editor.document.fileName.endsWith('.ini') ? decorations : []);
}

function activate(context) {
  paint(vscode.window.activeTextEditor);
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(paint));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => paint(vscode.window.activeTextEditor)));
}

function deactivate() {}

module.exports = { activate, deactivate };
