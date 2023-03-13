import chalk from 'chalk';
import { Command } from 'commander';
import { Ontology } from '../language-server/generated/ast';
import { OmlLanguageMetaData } from '../language-server/generated/module';
import { createOmlServices } from '../language-server/oml-module';
import { extractAstNode, extractDocument } from './cli-util';
import { dumpTree, generateJavaScript } from './generator';
import { NodeFileSystem } from 'langium/node';
import { OMLtoUMLInterpreter } from "../../scripts/OMLtoUMLInterpreter";
import { OMLWriter } from "../../scripts/OMLWriter";
import { Interpreter } from "../../scripts/OMLInterpreter"
import { join } from 'path';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createOmlServices(NodeFileSystem).Oml;
    const model = await extractAstNode<Ontology>(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};

export const dumpAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createOmlServices(NodeFileSystem).Oml;
    const model = await extractAstNode<Ontology>(fileName, services);
    const generatedFilePath = dumpTree(model, fileName, opts.destination);
    console.log(chalk.green(`Tree dumped successfully: ${generatedFilePath}`));
};

export const parseAndValidate = async (fileName: string): Promise<void> => {
    // retrieve the services for our language
    const services = createOmlServices(NodeFileSystem).Oml;
    // extract a document for our program
    const document = await extractDocument(fileName, services);
    // extract the parse result details
    const parseResult = document.parseResult;
    // verify no lexer, parser, or general diagnostic errors show up
    if (parseResult.lexerErrors.length === 0 && 
        parseResult.parserErrors.length === 0
    ) {
        console.log(chalk.green(`Parsed and validated ${fileName} successfully!`));
    } else {
        console.log(chalk.red(`Failed to parse and validate ${fileName}!`));
    }
};

export const generateUML = async (fileName: string): Promise<void> =>{

    let file_path = join( __dirname, fileName)
    var interpreter = new OMLtoUMLInterpreter()
    interpreter.file_path = file_path
    let tokenized_prorgam = interpreter.tokenize_program()

    var oml_interpreter = new Interpreter()
    let uml_program = oml_interpreter.run(tokenized_prorgam)

    var uml_writer = new OMLWriter()
    uml_writer.run(uml_program, interpreter.file_name ? interpreter.file_name : "")
}


export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = OmlLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);
    program
        .command('dumpTree')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('dumpts the AST produced by the source file')
        .action(dumpAction);
    program
        .command('parseAndValidate')
        .argument('<file>', 'Source file to parse & validate (ending in ${fileExtensions})')
        .description('Indicates where a program parses & validates successfully, but produces no output code')
        .action(parseAndValidate)
    program
        .command('generateUML')
        .argument('<file>', 'Source file to generate UML (ending in ${fileExtensions})')
        .description('Script that generates .plantuml file')
        .action(generateUML)
    program.parse(process.argv);
}
