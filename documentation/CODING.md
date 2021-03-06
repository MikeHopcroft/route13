# Coding Guidelines

## General
* Uses [TypeScript](https://www.typescriptlang.org/).
* Unit tests based on [Mocha](https://www.npmjs.com/package/mocha) and 
[Chai](https://www.npmjs.com/package/chai).
* CI uses [Travis](https://travis-ci.com). Successful CI requires clean build and unit tests passing.

## Naming Conventions
* Class names are PascalCase.
* Types are PascalCase.
* Function names and class methods are camelCase.
* Variables are camelCase.
* Enumeration constants are ALLCAPS.
* File names are kebab-case version of primary class name. Typically one major class per file. Files have `.ts` suffix.
* Directory names are lower case.

## File structure
* Use spaces, not tabs.
* Indent four spaces.
* Strive to keep lines shorter than 80 characters.
* Formatting rules based on TypeScript `format document` command.
* Opening braces go on line with function/class definition, if/for/while/switch/etc.
~~~
if (test) {
   doSomething();
}
~~~