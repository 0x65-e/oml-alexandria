import chalk from 'chalk';
import { Command } from 'commander';
import { Ontology } from '../language-server/generated/ast';
import { OmlLanguageMetaData } from '../language-server/generated/module';
import { createOmlServices } from '../language-server/oml-module';
import { extractAstNode, extractDocument } from './cli-util';
import { dumpTree } from './generator';
import { NodeFileSystem } from 'langium/node';

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
        .command('dumpTree')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('dumpts the AST produced by the source file')
        .action(dumpAction);
    program
        .command('parseAndValidate')
        .argument('<file>', `Source file to parse & validate (ending in ${fileExtensions})`)
        .description('Indicates where a program parses & validates successfully, but produces no output code')
        .action(parseAndValidate)
    program.parse(process.argv);

    
}
