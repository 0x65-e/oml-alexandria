import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

/**
 * Extracts a LangiumDocument from the provided file
 * 
 * @param fileName the file name to load
 * @param services instantiated service pack to get necessary services from
 * @returns the parsed results
 */
export async function extractDocument(fileName: string, services: LangiumServices): Promise<LangiumDocument> {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(path.extname(fileName))) {
        console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`));
        process.exit(1);
    }

    if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`File ${fileName} does not exist.`));
        process.exit(1);
    }

    const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
    await services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' });

    const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
    if (validationErrors.length > 0) {
        console.error(chalk.red('There are validation errors:'));
        for (const validationError of validationErrors) {
            console.error(chalk.red(
                `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
            ));
        }
        process.exit(1);
    }

    return document;
}

/**
 * Reads the given file and extracts the root node of the parsed AST
 * 
 * @param fileName the file name to load
 * @param services instantiated service pack to get necessary services from
 * @returns the root node of the parsed AST
 */
export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T> {
    return (await extractDocument(fileName, services)).parseResult?.value as T;
}

interface FilePathData {
    destination: string,
    name: string
}

/**
 * Extracts the destination for a generated output file from an input file path
 * 
 * @param filePath the name of the input file. If `destination` is undefined, the output file will be created in a "generated/" subdirectory.
 * @param destination the output destination. If undefined, `filePath` is used with "generated/" appended.
 * @returns an object containing the name of the source file and the output destination.
 */
export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}
