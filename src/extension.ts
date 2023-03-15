import * as vscode from "vscode";
import * as path from "path";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { registerDefaultCommands } from "sprotty-vscode";
import { LspWebviewPanelManager } from "sprotty-vscode/lib/lsp";
import { MemoryFileProvider, MEMORY_SCHEME } from "./scripts/memfile";
import { generateUML } from "./scripts/uml-generator";

let client: LanguageClient;

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  client = startLanguageClient(context);
  const webviewPanelManager = new LspWebviewPanelManager({
    extensionUri: context.extensionUri,
    defaultDiagramType: "oml",
    languageClient: client,
    supportedFileExtensions: [".oml"],
  });
  registerDefaultCommands(webviewPanelManager, context, {
    extensionPrefix: "oml",
  });

  // Prompt user to install plantuml extension
  const jebbsPlantUMLName: string = "jebbs.plantuml";
  const jebbsPlantUML = vscode.extensions.getExtension(jebbsPlantUMLName);
  if (!jebbsPlantUML && vscode.workspace.getConfiguration('pteam-ptolemy.oml-alexandria').get('recommendJebbsPlantUML', true)) {
    const message: string = "If you'd like to visualize your OML files as UML diagrams, it is recommended to install the PlantUML extension. Do you want to install it now?";
    const choice = await vscode.window.showInformationMessage(message, 'Install', 'Not now', 'Do not show again');
    if (choice === 'Install') {
        await vscode.commands.executeCommand('extension.open', jebbsPlantUMLName);
        await vscode.commands.executeCommand('workbench.extensions.installExtension', jebbsPlantUMLName);
    } else if (choice === 'Do not show again') {
        vscode.workspace.getConfiguration('pteam-ptolemy.oml-alexandria').update('recommendJebbsPlantUML', false, true);
    }
  }

  // Register a file system provider
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(MEMORY_SCHEME, new MemoryFileProvider()));
  // Register a command to run the OML to UML interpreter
  context.subscriptions.push(vscode.commands.registerCommand("oml.generate.uml", generateUML));
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  if (client) {
    return client.stop();
  }
  return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  const serverModule = context.asAbsolutePath(
    path.join("pack", "language-server", "main")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      "--nolazy",
      `--inspect${process.env.DEBUG_BREAK ? "-brk" : ""}=${process.env.DEBUG_SOCKET || "6009"}`,
    ],
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const fileSystemWatcher =
    vscode.workspace.createFileSystemWatcher("**/*.oml");
  context.subscriptions.push(fileSystemWatcher);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "oml" }],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher,
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient("oml", "Oml", serverOptions, clientOptions);

  // Start the client. This will also launch the server
  client.start();
  return client;
}
