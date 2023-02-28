import * as vscode from "vscode";
import * as path from "path";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import {
  registerDefaultCommands,
  registerTextEditorSync,
} from "sprotty-vscode";
import {
  LspSprottyEditorProvider,
  LspSprottyViewProvider,
  LspWebviewPanelManager,
} from "sprotty-vscode/lib/lsp";

let client: LanguageClient;

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
  const diagramMode = process.env.DIAGRAM_MODE || "panel";
  if (!["panel", "editor", "view"].includes(diagramMode)) {
    throw new Error(
      "The environment variable 'DIAGRAM_MODE' must be set to 'panel', 'editor' or 'view'."
    );
  }

  console.log("starting", diagramMode);

  client = startLanguageClient(context);

  if (diagramMode === "panel") {
    // Set up webview panel manager for freestyle webviews
    const webviewPanelManager = new LspWebviewPanelManager({
      extensionUri: context.extensionUri,
      defaultDiagramType: "oml",
      languageClient: client,
      supportedFileExtensions: [".oml"],
    });
    registerDefaultCommands(webviewPanelManager, context, {
      extensionPrefix: "oml",
    });
  }

  if (diagramMode === "editor") {
    // Set up webview editor associated with file type
    const webviewEditorProvider = new LspSprottyEditorProvider({
      extensionUri: context.extensionUri,
      viewType: "oml",
      languageClient: client,
      supportedFileExtensions: [".oml"],
    });
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider("oml", webviewEditorProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      })
    );
    registerDefaultCommands(webviewEditorProvider, context, {
      extensionPrefix: "oml",
    });
  }

  if (diagramMode === "view") {
    // Set up webview view shown in the side panel
    const webviewViewProvider = new LspSprottyViewProvider({
      extensionUri: context.extensionUri,
      viewType: "oml",
      languageClient: client,
      supportedFileExtensions: [".oml"],
      openActiveEditor: true,
    });
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("oml", webviewViewProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      })
    );
    registerDefaultCommands(webviewViewProvider, context, {
      extensionPrefix: "oml",
    });
    registerTextEditorSync(webviewViewProvider, context);
  }
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
    path.join("out", "language-server", "main")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      "--nolazy",
      `--inspect${process.env.DEBUG_BREAK ? "-brk" : ""}=${
        process.env.DEBUG_SOCKET || "6009"
      }`,
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
