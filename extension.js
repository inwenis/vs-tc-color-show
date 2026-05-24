const vscode = require('vscode');

const redSquare = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: '■',
    color: 'red',
    margin: '0 0 0 4px'
  }
});

function paint(editor) {
  const text = editor.document.getText();
  const ranges = [];
  const regex = /\$0000FF/g;
  let match;

  while ((match = regex.exec(text))) {
    const start = editor.document.positionAt(match.index);
    const end = editor.document.positionAt(match.index + match[0].length);
    ranges.push(new vscode.Range(start, end));
  }

  editor.setDecorations(redSquare, editor.document.fileName.endsWith('.ini') ? ranges : []);
}

function activate(context) {
  paint(vscode.window.activeTextEditor);
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(paint));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => paint(vscode.window.activeTextEditor)));
}

function deactivate() {}

module.exports = { activate, deactivate };
