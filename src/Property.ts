
'use strict';

import * as vscode from 'vscode';

export default class Property {
    private description: string = null;
    private indentation: string;
    private name: string;
    private type: string = null;
    private isStatic: boolean = false;

    public constructor(name: string)
    {
        this.name = name;
    }

    static fromEditorPosition(editor: vscode.TextEditor, activePosition: vscode.Position) {
        const wordRange = editor.document.getWordRangeAtPosition(activePosition);

        if (wordRange === undefined) {
            throw new Error('No property found. Please select a property to use this extension.');
        }

        const selectedWord = editor.document.getText(wordRange);

        if (selectedWord[0] !== '$') {
            throw new Error('No property found. Please select a property to use this extension.');
        }

        let property = new Property(selectedWord.substring(1, selectedWord.length));

        const activeLineNumber = activePosition.line;
        const activeLine = editor.document.lineAt(activeLineNumber);

        property.indentation = activeLine.text.substring(0, activeLine.firstNonWhitespaceCharacterIndex);

        let lastChar;

        property.setIsStatic(activeLine.text.includes('static'));

        if(activeLine.text.includes('=')){
            lastChar = activeLine.text[activeLine.text.indexOf('=') - 1] === ' ' ? activeLine.text.indexOf('=') - 1 : activeLine.text.indexOf('=');
        }else{
            lastChar = activeLine.text.indexOf(';');
        }

        const lineInfo = activeLine.text.substring(activeLine.firstNonWhitespaceCharacterIndex, lastChar).split(' ');

        if(lineInfo.length === 3 || property.getIsStatic() && lineInfo.length === 4){
            let typeIndex = property.getIsStatic() ? 2 : 1;
            property.setType(lineInfo[typeIndex]);
        }

        return property;
    }

    static fromEditorSelection(editor: vscode.TextEditor) {
        return Property.fromEditorPosition(editor, editor.selection.active);
    }

    generateMethodDescription(prefix : string) : string {
        if (this.description) {
            return prefix + this.description.charAt(0).toLowerCase() + this.description.substring(1);
        }

        return prefix + `the value of ` + this.name;
    }

    generateMethodName(prefix : string) : string {
        let name = prefix + this.name.charAt(0).toUpperCase();

        for(let i = 1; i <= this.name.substring(1).length; i++){
            if('_' === this.name.charAt(i)){
                name += this.name.charAt(i + 1).toUpperCase();
                i++;
            }else{
                name += this.name.charAt(i);
            }
        }

        return name;
    }

    getDescription() : string {
        return this.description;
    }

    getIndentation() : string {
        return this.indentation;
    }

    getName() : string {
        return this.name;
    }

    getterDescription() : string {
        return this.generateMethodDescription('Get ');
    }

    getterName() : string {
        return this.generateMethodName('get');
    }

    getType() : string {
        return this.type;
    }

    getIsStatic() : boolean {
        return this.isStatic;
    }

    setterDescription() : string {
        return this.generateMethodDescription('Set ');
    }

    setterName() : string {
        return this.generateMethodName('set');
    }

    setType(type : string) {
        this.type = type;
    }

    setIsStatic(isStatic : boolean) {
        this.isStatic = isStatic;
    }
}
