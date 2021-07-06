'use strict';

import * as vscode from 'vscode';

export default class BracketFinder
{
  private static startPosition: vscode.Position;
  private static editor: vscode.TextEditor;

  public static fromPosition(startPosition: vscode.Position, editor: vscode.TextEditor = vscode.window.activeTextEditor): Array<vscode.Position>
  {
    this.editor = editor;
    this.startPosition = startPosition;
    
    let openingPosition = this.findOpeningBracket();
    let closingPosition = this.findClosingBracket();

    return [openingPosition, closingPosition];
  }

  private static findOpeningBracket(): vscode.Position
  {
    const openingBracket = '{';
    const closingBracket = '}';

    const inlineComment = '//';

    const commentStart = '/';
    const commentEnd = '*';

    let closedBrackets = 1;
    let isComment = false;

    for(let ln = this.startPosition.line; ln >= 0; ln--)
    {
      let lineText = this.editor.document.lineAt(ln).text;

      if(lineText.includes(inlineComment))
      {
        lineText = lineText.substr(0, lineText.indexOf(inlineComment));
      }

      for(let idx = ln === this.startPosition.line ? this.startPosition.character : lineText.length - 1; idx >= 0; idx--)
      {
        if(lineText.charAt(idx) === commentStart && lineText.charAt(idx - 1) === commentEnd)
        {
          isComment = true;
        }

        if(lineText.charAt(idx) === commentEnd && lineText.charAt(idx - 1) === commentStart)
        {
          isComment = false;
        }

        if(isComment)
        {
          continue;
        }

        if(lineText.charAt(idx) === closingBracket)
        {
          closedBrackets++;
        }

        if(lineText.charAt(idx) === openingBracket)
        {
          if(closedBrackets === 1)
          {
            return new vscode.Position(ln, idx);
          }
          else
          {
            closedBrackets--;
          }
        }
      }
    }
  }

  private static findClosingBracket(): vscode.Position
  {
    const openingBracket = '{';
    const closingBracket = '}';

    const inlineComment = '//';

    const commentStart = '/';
    const commentEnd = '*';

    let openBrackets = 1;
    let isComment = false;

    for(let ln = this.startPosition.line; ln < this.editor.document.lineCount; ln++)
    {
      let lineText = this.editor.document.lineAt(ln).text;

      if(lineText.includes(inlineComment))
      {
        lineText = lineText.substr(0, lineText.indexOf(inlineComment));
      }

      for(let idx = ln === this.startPosition.line ? this.startPosition.character : 0; idx < lineText.length; idx++)
      {
        if(lineText.charAt(idx) === commentStart && lineText.charAt(idx + 1) === commentEnd)
        {
          isComment = true;
        }

        if(lineText.charAt(idx) === commentEnd && lineText.charAt(idx + 1) === commentStart)
        {
          isComment = false;
        }

        if(isComment)
        {
          continue;
        }

        if(lineText.charAt(idx) === openingBracket)
        {
          openBrackets++;
        }

        if(lineText.charAt(idx) === closingBracket)
        {
          if(openBrackets === 1)
          {
            return new vscode.Position(ln, idx);
          }
          else
          {
            openBrackets--;
          }
        }
      }
    }
  }
}