import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { addDiagramHandler } from 'langium-sprotty';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { createOmlServices } from './oml-module';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createOmlServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
addDiagramHandler(connection, shared);
