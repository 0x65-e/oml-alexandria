import * as vscode from "vscode";

export const MEMORY_SCHEME = "inmemoryfile";

export class MemoryFileProvider implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
        let memDoc = MemoryFileManager.getDocument(uri);
        if (memDoc === undefined) return "";
        return memDoc.read();
    }
}

export class MemoryFileManager {
    private static _documents: { [key: string]: MemoryFile } = {};

    public static getDocument(uri: vscode.Uri): MemoryFile | undefined {
        return MemoryFileManager._documents[uri.path];
    }

    public static createDocument(path: string): MemoryFile {
        let doc = new MemoryFile(path);
        MemoryFileManager._documents[path] = doc;

        return doc;
    }
}

export class MemoryFile {
    public content: string = "";
    public uri: vscode.Uri;

    constructor(path: string) {
        this.uri = vscode.Uri.from({ scheme: MEMORY_SCHEME, path: path });
    }

    public write(strContent: string): void {
        this.content += strContent;
    }

    public read(): string {
        return this.content;
    }

    public getUri(): vscode.Uri {
        return this.uri;
    }
}
