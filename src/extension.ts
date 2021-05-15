'use strict';

import * as vscode from 'vscode';
import Redirector from "./Redirector";
import Property from "./Property";
import Configuration from "./Configuration";

class Resolver {
    config: Configuration;

    public constructor()
    {
        const editor = this.activeEditor();

        if (editor.document.languageId !== 'php') {
            throw new Error('Not a PHP file.');
        }

        this.config = new Configuration;
    }


    activeEditor() {
        return vscode.window.activeTextEditor;
    }

    closingClassLine() {
        const editor = this.activeEditor();

        for (let lineNumber = editor.document.lineCount - 1; lineNumber > 0; lineNumber--) {
            const line = editor.document.lineAt(lineNumber);
            const text = line.text.trim();

            if (text.startsWith('}')) {
                return line;
            }
        }

        return null;
    }

    insertGetter() {
        const editor = this.activeEditor();
        let property = null;
        let content = '';

        for (let index = 0; index < editor.selections.length; index++) {
            const selection = editor.selections[index];

            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.getterTemplate(property);
        }

        this.renderTemplate(content);
    }

    insertGetterAndSetter(){
        const editor = this.activeEditor();
        let property = null;
        let content = '';

        for (let index = 0; index < editor.selections.length; index++) {
            const selection = editor.selections[index];

            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.getterTemplate(property) + this.setterTemplate(property);
        }

        this.renderTemplate(content);
    }

    insertSetter() {
        const editor = this.activeEditor();
        let property = null;
        let content = '\n';

        for (let index = 0; index < editor.selections.length; index++) {
            const selection = editor.selections[index];

            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.setterTemplate(property);
        }

        this.renderTemplate(content);
    }

    getterTemplate(prop: Property) {
        const name = prop.getName();
        const tab = prop.getIndentation();
        const type = prop.getType();
        const isStatic = prop.getIsStatic();

        let content = '';

        if(true === this.config.get('short', true)){
            content = (
                `\n`
                + tab + `public` + (isStatic ? ` static` : ``) + ` function ` + prop.getterName() + `()` + (type ? `: ` + type + ` ` : ``) + `{ return` + (isStatic ? ` self::$` : ` $this->`) + name + `; }\n`
            );
        }else{
            content = (
                `\n`
                + tab + `/**\n`
                + tab + ` * ` + prop.getterDescription() + `\n`
                + (type ? tab + ` *\n` : ``)
                + (type ? tab + ` * @return ` + type + `\n` : ``)
                + tab + ` */\n`
                + tab + `public` + (isStatic ? ` static` : ``) + ` function ` + prop.getterName() + `()` + (type ? `: ` + type : ``) + `\n`
                + tab + `{\n`
                + tab + tab + `return` + (isStatic ? ` self::$` : ` $this->`) + name + `;\n`
                + tab + `}\n`
            );
        }

        return content;
    }

    setterTemplate(prop: Property) {
        const name = prop.getName();
        const description = prop.getDescription();
        const tab = prop.getIndentation();
        const type = prop.getType();

        const isStatic = prop.getIsStatic();
        const showType = type && !isStatic;

        let content = '';
        
        if(true === this.config.get('short', true)){
            content = (
                tab + `public` + (isStatic ? ` static` : ``) + ` function ` + prop.setterName() + `(` + (type ? type + ` ` : ``) + `$` + name + `)` + (isStatic ? ` { self::$` : `: self { $this->`) + name + ` = $` + name + `;` + (isStatic ? `` : ` return $this;`) + ` }\n`
            );
        }else{
            content = (
                `\n`
                + tab + `/**\n`
                + tab + ` * ` + prop.setterDescription() + `\n`
                + (type ? tab + ` *\n` : ``)
                + (type ? tab + ` * @param ` + type + ` $` + name + (description ? `  ` + description : ``) + `\n` : ``)
                + (showType ? tab + ` *\n` : ``)
                + (showType ? tab + ` * @return self` + `\n` : ``)
                + tab + ` */\n`
                + tab + `public` + (isStatic ? ` static` : ``) + ` function ` + prop.setterName() + `(` + (type ? type + ` ` : ``) + `$` + name + `)` + (isStatic ? `` : `: self`) + `\n`
                + tab+ `{\n`
                + tab + tab + (isStatic ? `self::$` : `$this->`) + name + ` = $` + name + `;`
                + (isStatic ? `` : `\n\n` + tab + tab + `return $this;`) + `\n`
                + tab + `}\n`
            );
        }

        return content;
    }

    renderTemplate(template: string) {
        if (!template) {
            this.showErrorMessage('Missing template to render.');
            return;
        }

        let insertLine = this.insertLine();

        if (!insertLine) {
            this.showErrorMessage('Unable to detect insert line for template.');
            return;
        }

        const editor = this.activeEditor();
        let resolver = this;

        editor.edit(function(edit: vscode.TextEditorEdit){
            edit.replace(
                new vscode.Position(insertLine.lineNumber, 0),
                template
            );
        }).then(
            success => {
                if (resolver.isRedirectEnabled() && success) {
                    const redirector = new Redirector(editor);
                    redirector.goToLine(this.closingClassLine().lineNumber - 1);
                }
            },
            error => {
                this.showErrorMessage(`Error generating functions: ` + error);
            }
        );
    }

    insertLine() {
        return this.closingClassLine();
    }

    isRedirectEnabled() : boolean {
        return true === this.config.get('redirect', false);
    }

    showErrorMessage(message: string) {
        message = 'phpGetterSetter error: ' + message.replace(/\$\(.+?\)\s\s/, '');

        vscode.window.showErrorMessage(message);
    }

    showInformationMessage(message: string) {
        message = 'phpGetterSetter info: ' + message.replace(/\$\(.+?\)\s\s/, '');

        vscode.window.showInformationMessage(message);
    }
}

function activate(context: vscode.ExtensionContext) {
    let resolver = new Resolver;

    let insertGetter = vscode.commands.registerCommand('phpGetterSetter.insertGetter', () => resolver.insertGetter());
    let insertSetter = vscode.commands.registerCommand('phpGetterSetter.insertSetter', () => resolver.insertSetter());
    let insertGetterAndSetter = vscode.commands.registerCommand('phpGetterSetter.insertGetterAndSetter', () => resolver.insertGetterAndSetter());

    context.subscriptions.push(insertGetter);
    context.subscriptions.push(insertSetter);
    context.subscriptions.push(insertGetterAndSetter);
}

function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;
