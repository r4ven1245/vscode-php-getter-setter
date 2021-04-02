# PHP getters and setters for Visual Studio Code

> Fast generator of getters and setters for your PHP class properties.

This is based off of [@phproberto](https://github.com/phproberto/vscode-php-getters-setters)'s extension that has not been updated for 3 years.

I removed custom template features and all of the configuration options.
It's a simple extension doing a simple job.

I've updated the extension to work with PHP type hinting.

## Important

Make sure to reload VS Code after installing and/or changing the settings.
## Features

This extension allows you to quickly generate getters and setters with one single command.

It adds 3 comands to vscode's command palette:

* Insert PHP getter.
* Insert PHP setter.
* Insert PHP getter and setter.

## Extension Settings

This extension contributes the following settings:

* `phpGetterSetter.short`: Shorten Getter and Setter to be one line each. Default: false
* `phpGetterSetter.redirect`: Redirect to generated functions after creating them. Default: false

## Release Notes

### 1.0.2

* Support for static properties
* Readded the legacy configuration option to stop the cursor from moving to the generated methods

### 1.0.1

* Removed the extra space that was generating after the function return type in Long mode

### 1.0.0

* Initial release
