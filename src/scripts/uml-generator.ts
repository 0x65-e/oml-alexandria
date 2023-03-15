import * as vscode from "vscode";
import { MemoryFile, MemoryFileManager, MEMORY_SCHEME } from "./memfile";
import { Interpreter } from "./oml-interpreter";

export async function generateUML(...commandArgs: any[]) {
    const uri: vscode.Uri | undefined = getURI(commandArgs);
    if (uri) {
        vscode.workspace.openTextDocument(uri).then(async (document) => {
            let text: string = document.getText();
            let tokenized_program = tokenize_program(text);

            const oml_interpreter: Interpreter = new Interpreter();
            let uml_program = oml_interpreter.run(tokenized_program);

            const path: string = uri.path.endsWith(".oml")
                ? uri.path.substring(0, uri.path.lastIndexOf(".oml")) + ".plantuml"
                : uri.path + ".plantuml";
            const outfile: MemoryFile = MemoryFileManager.createDocument(path);
            writeUML(uml_program, outfile);

            let doc = await vscode.workspace.openTextDocument(vscode.Uri.from({ scheme: MEMORY_SCHEME, path: path }));
            await vscode.window.showTextDocument(doc, { preview: false });
        });
    }
}

function getURI(commandArgs: any[]): vscode.Uri | undefined {
    if (commandArgs.length > 0 && commandArgs[0] instanceof vscode.Uri) {
        return commandArgs[0];
    }
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri;
    }
    return undefined;
}

function writeUML(uml_program: string[][], memfile: MemoryFile): void {
    let indent: number = 0;
    let ip: number = 0;
    let terminate: boolean = false;

    while (!terminate) {
        for (var i = 0; i < indent; i++) {
            memfile.write("    ");
        }
        uml_program[ip].forEach((entry) => {
            if (entry.indexOf("{")) {
                indent -= 1;
            }
            if (entry.indexOf("}")) {
                indent += 1;
            }
            memfile.write(entry + " ");
        });
        memfile.write("\n");
        ip += 1;

        if (ip >= uml_program.length) {
            terminate = true;
        }
    }
}

function tokenize_program(oml_file: string): string[][] {
    let tokenized_program: string[][] = [];
    let line_list: string[] = [];
    let oml_list = oml_file.split("\n");
    oml_list.forEach((line) => {
        line = line.trim();
        line_list = line.length > 0 ? line.split(/\s+/) : [];
        if (line_list.length > 0) {
            tokenized_program.push(line_list);
        }
    });
    return tokenized_program;
}

function remove_comment(line: string[]) {
    if (line.indexOf("//") > 0) {
        let index = line.indexOf("//");
        return line.slice(0, index);
    }
    if (line.indexOf("@rdfs:comment") > 0) {
        let index = line.indexOf("@rdfs:comment");
        return line.slice(0, index);
    }
    return line;
}
