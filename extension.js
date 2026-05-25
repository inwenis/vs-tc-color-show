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

function decimalBbggrrToCssHex(decimalBbggrr) {
  const colorValue = Number(decimalBbggrr);

  if (!Number.isInteger(colorValue) || colorValue < 0 || colorValue > 0xffffff) {
    return undefined;
  }

  const bbggrr = colorValue.toString(16).padStart(6, '0');
  const blue = bbggrr.slice(0, 2);
  const green = bbggrr.slice(2, 4);
  const red = bbggrr.slice(4, 6);

  return `#${red}${green}${blue}`;
}

function isDecimalColorKey(key) {
  return decimalColorKeyRegex.test(key);
}

function getLineContent(line) {
  const contentStartCharacter = line.search(/\S/);

  if (contentStartCharacter === -1) {
    return undefined;
  }

  const firstCharacter = line[contentStartCharacter];

  if (firstCharacter !== ';' && firstCharacter !== '#') {
    return {
      text: line.slice(contentStartCharacter),
      startCharacter: contentStartCharacter
    };
  }

  const contentAfterCommentMarker = line.slice(contentStartCharacter + 1);
  const spacesAfterCommentMarker = contentAfterCommentMarker.length - contentAfterCommentMarker.trimStart().length;

  return {
    text: contentAfterCommentMarker.trimStart(),
    startCharacter: contentStartCharacter + 1 + spacesAfterCommentMarker
  };
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

function addHexColorDecorations(editor, decorations, lineNumber, line) {
  for (const match of line.matchAll(hexBbggrrRegex)) {
    const bbggrr = match[0].slice(1);
    const blue = bbggrr.slice(0, 2);
    const green = bbggrr.slice(2, 4);
    const red = bbggrr.slice(4, 6);
    const color = `#${red}${green}${blue}`;
    const start = editor.document.offsetAt(new vscode.Position(lineNumber, match.index));

    addDecoration(editor, decorations, start, match[0].length, color);
  }
}

function addDecimalColorDecoration(editor, decorations, lineNumber, line) {
  const lineContent = getLineContent(line);

  if (!lineContent) {
    return;
  }

  const equalsIndex = lineContent.text.indexOf('=');

  if (equalsIndex === -1) {
    return;
  }

  const key = lineContent.text.slice(0, equalsIndex).trim();

  if (!isDecimalColorKey(key)) {
    return;
  }

  const rawValue = lineContent.text.slice(equalsIndex + 1);
  const commentStart = rawValue.search(/[;#]/);
  const valueWithSpaces = commentStart === -1 ? rawValue : rawValue.slice(0, commentStart);
  const value = valueWithSpaces.trim();

  if (!decimalValueRegex.test(value)) {
    return;
  }

  const color = decimalBbggrrToCssHex(value);

  if (!color) {
    return;
  }

  const valueOffset = rawValue.indexOf(value);
  const valueStartCharacter = lineContent.startCharacter + equalsIndex + 1 + valueOffset;
  const valueStart = editor.document.offsetAt(new vscode.Position(lineNumber, valueStartCharacter));

  addDecoration(editor, decorations, valueStart, value.length, color);
}

function addColorDecorations(editor, decorations, lineNumber, line) {
  addHexColorDecorations(editor, decorations, lineNumber, line);
  addDecimalColorDecoration(editor, decorations, lineNumber, line);
}

function paint(editor) {
  if (!editor || !editor.document.fileName.toLowerCase().endsWith('.ini')) {
    return;
  }

  const decorations = [];

  for (let lineNumber = 0; lineNumber < editor.document.lineCount; lineNumber++) {
    const line = editor.document.lineAt(lineNumber).text;

    addColorDecorations(editor, decorations, lineNumber, line);
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
