import {
    DefaultRenameProvider,
    findDeclarationNodeAtOffset,
    getDocument,
    LangiumDocument,
    LangiumDocuments,
    ReferenceDescription,
    streamAllContents,
    toDocumentSegment,
    findNodeForProperty,
    AstNode,
    DocumentSegment,
} from "langium";
import { WorkspaceEdit } from "vscode-languageserver";
import { RenameParams } from "vscode-languageserver-protocol";
import { TextEdit } from "vscode-languageserver-types";
import { OmlServices } from "./oml-module";

import { OmlIRIProvider } from "./oml-iri";
import { isImport, Member, Ontology } from "./generated/ast";

/**
 * Extension of the default Langium RenameProvider implementation to
 * support renaming cross-file imported symbols.
 */
export class OmlRenameProvider extends DefaultRenameProvider {
    protected readonly langiumDocuments: LangiumDocuments;
    private omlIRI: OmlIRIProvider;

    constructor(services: OmlServices) {
        super(services);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.omlIRI = services.references.OmlIRI;
    }

    override async rename(document: LangiumDocument, params: RenameParams): Promise<WorkspaceEdit | undefined> {
        const changes: Record<string, TextEdit[]> = {};
        const rootNode = document.parseResult.value.$cstNode;

        if (!rootNode) return undefined;
        const offset = document.textDocument.offsetAt(params.position);
        const leafNode = findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
        if (!leafNode) return undefined;
        const targetNode = this.references.findDeclaration(leafNode) as Member;
        if (!targetNode) return undefined;
        const options = { onlyLocal: false, includeDeclaration: false };
        const references = this.references.findReferences(targetNode, options);

        //Do change at targetNode
        //Renaming basically assumes you want to rename the targetNode
        //Then propagate change from there
        let newNamespace: string | undefined = undefined;
        let newPrefix: string | undefined = undefined;
        let newId: string;
        let targetNamespace: string;

        if (this.omlIRI.isFullIRI(params.newName)) {
            newNamespace = this.omlIRI.getIRI(params.newName).split("#")[0];
            newId = this.omlIRI.getIRI(params.newName).split("#")[1];
        } else if (this.omlIRI.isabbrevIRI(params.newName)) {
            newPrefix = params.newName.split(":")[0];
            newId = params.newName.split(":")[1];
        } else {
            newId = params.newName;
        }

        const targetDocument = getDocument(targetNode);
        const targetNameSeg = getNameSeg(targetNode);
        if (targetDocument && targetNameSeg) {
            const model = targetDocument.parseResult.value as Ontology;
            targetNamespace = model.namespace;
            let targetChanges: TextEdit[] = new Array();
            if (newNamespace) {
                const namespaceNodeSeg = getNamespaceSeg(model);
                if (namespaceNodeSeg) {
                    targetChanges.push(TextEdit.replace(namespaceNodeSeg.range, `<${newNamespace}#>`));
                }
            } else if (newPrefix) {
                const prefixNodeSeg = getPrefixSeg(model);
                if (prefixNodeSeg) {
                    targetChanges.push(TextEdit.replace(prefixNodeSeg.range, newPrefix));
                }
            }
            targetChanges.push(TextEdit.replace(targetNameSeg.range, newId));
            const uri = targetDocument.uri.toString();
            changes[uri] = targetChanges;
        }

        //Do change at referenced Nodes
        references.forEach((ref) => {
            //Change depends on how the targetId is changed
            // const newText = this.convertRefToText(ref, rangeText, newNamespace, newPrefix, newId)
            // const change = TextEdit.replace(ref.segment.range, newText);
            const refChanges = this.getChangesForRef(ref, targetNamespace, newNamespace, newPrefix, newId);
            const uri = ref.sourceUri.toString();
            if (changes[uri]) {
                changes[uri] = changes[uri].concat(refChanges);
            } else {
                changes[uri] = refChanges;
            }
            // console.log(changes[uri])
        });
        // console.log(changes)
        return { changes };
    }

    private getChangesForRef(
        ref: ReferenceDescription,
        targetNamespace: string,
        newNamespace: string | undefined,
        newPrefix: string | undefined,
        newId: string
    ): TextEdit[] {
        let changes: TextEdit[] = new Array();
        let newText: string;
        const langiumDoc = this.langiumDocuments.getOrCreateDocument(ref.sourceUri);
        const refText = langiumDoc.textDocument.getText(ref.segment.range);
        //refText is name at reference Node
        if ((this.omlIRI.isFullIRI(refText) || this.omlIRI.isabbrevIRI(refText)) && newNamespace != undefined) {
            //Update import to match new namespace
            const langiumDoc = this.langiumDocuments.getOrCreateDocument(ref.sourceUri);
            for (const modelNode of streamAllContents(langiumDoc.parseResult.value)) {
                if (isImport(modelNode)) {
                    const namespaceNodeSeg = getNamespaceSeg(modelNode);
                    if (modelNode.namespace == targetNamespace && namespaceNodeSeg) {
                        changes.push(TextEdit.replace(namespaceNodeSeg.range, newNamespace));
                    }
                }
            }
            if (this.omlIRI.isFullIRI(refText)) {
                newText = `<${this.omlIRI.getIRI(newNamespace)}:${newId}>`;
            } else {
                const oldPrefix: string = refText.split(":")[0];
                newText = `${oldPrefix}:${newId}`;
            }
        } else if (this.omlIRI.isabbrevIRI(refText)) {
            if (ref.sourceUri == ref.targetUri) {
                //in same file
                newText = `${newPrefix}:${newId}`;
            } else {
                const oldPrefix: string = refText.split(":")[0];
                newText = `${oldPrefix}:${newId}`;
            }
        } else {
            newText = newId; //no change
        }
        changes.push(TextEdit.replace(ref.segment.range, newText));
        console.log(refText);
        console.log(changes);
        return changes;
    }
}

// Utility functions

function getNamespaceSeg(model: AstNode): DocumentSegment | undefined {
    return toDocumentSegment(findNodeForProperty(model.$cstNode, "namespace"));
}

function getPrefixSeg(model: AstNode): DocumentSegment | undefined {
    return toDocumentSegment(findNodeForProperty(model.$cstNode, "prefix"));
}

function getNameSeg(model: AstNode): DocumentSegment | undefined {
    return toDocumentSegment(findNodeForProperty(model.$cstNode, "name"));
}
