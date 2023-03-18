import * as vscode from "vscode";

/** The file scheme for an in-memory temporary file */
export const MEMORY_SCHEME = "inmemoryfile";

/**
 * A provider for in-memory temporary text files. This enables
 * generation in workspaces without file system access (e.g. 
 * in a web environment)
 * 
 * Files use the scheme defined by {@link MEMORY_SCHEME}.
 */
export class MemoryFileProvider implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
        let memDoc = MemoryFileManager.getDocument(uri);
        if (memDoc === undefined) return "";
        return memDoc.read();
    }
}

/**
 * A simple manager to create and retrieve in-memory text files.
 */
export class MemoryFileManager {
    private static _documents: { [key: string]: MemoryFile } = {};

    /**
     * Gets an in-memory text document, if it exists.
     * 
     * @param uri The {@link vscode.Uri} of the requested file. The scheme parameter
     * is ignored, so this will return a file even if the scheme is not {@link MEMORY_SCHEME}.
     * Only the `path` is required to identify a file.
     * @returns The file, if it exists.
     */
    public static getDocument(uri: vscode.Uri): MemoryFile | undefined {
        return MemoryFileManager._documents[uri.path];
    }

    /**
     * Creates a new in-memory text document or overwrites the existing one at `path`.
     * 
     * @param path The virtual path to the file. Unlike a file system path,
     * this can be an arbitrary string identifier, but it will be reported
     * to VSCode as if it were a file system path. If another in-memory file
     * exists at that path, **this function will overwrite it.**
     * @returns a new {@link MemoryFile}
     */
    public static createDocument(path: string): MemoryFile {
        let doc = new MemoryFile(path);
        MemoryFileManager._documents[path] = doc;

        return doc;
    }
}

/**
 * Class representing an in-memory text file.
 */
export class MemoryFile {
    private content: string = "";
    private uri: vscode.Uri;

    constructor(path: string) {
        this.uri = vscode.Uri.from({ scheme: MEMORY_SCHEME, path: path });
    }

    /**
     * Appends content to this in-memory file.
     * 
     * @param strContent content to append
     */
    public write(strContent: string): void {
        this.content += strContent;
    }

    /**
     * Reads the contents of this in-memory file as a string.
     * 
     * @returns the contents of the file
     */
    public read(): string {
        return this.content;
    }

    /**
     * Gets the {@link vscode.Uri} that this file corresponds to.
     * Only the path and scheme are guaranteed to be set.
     * 
     * @returns 
     */
    public getUri(): vscode.Uri {
        return this.uri;
    }
}
