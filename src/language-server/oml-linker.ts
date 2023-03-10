import {
    DefaultReferenceDescriptionProvider,
    equalURI,
    getDocument,
    isLinkingError,
    LangiumDocument,
    ReferenceDescription,
    ReferenceInfo,
    streamAst,
    streamReferences,
    toDocumentSegment,
} from "langium";

import { isImport, Ontology } from "./generated/ast";

export class OmlRefDescriptionProvider extends DefaultReferenceDescriptionProvider {
    override async createDescriptions(document: LangiumDocument): Promise<ReferenceDescription[]> {
        const descr: ReferenceDescription[] = [];
        const rootNode = document.parseResult.value as Ontology;
        const idToIRI : Record<string, string> = {};

        for (const astNode of streamAst(rootNode)) {
            if(isImport(astNode) && astNode.prefix != undefined) {
                idToIRI[astNode.prefix] = astNode.namespace
            }
        }

        for (const astNode of streamAst(rootNode)) {
            streamReferences(astNode).filter(refInfo => !isLinkingError(refInfo)).forEach(refInfo => {
                console.log(refInfo.reference.$refText)
                const description = this.createDescription(refInfo);
                if (description) {
                    descr.push(description);
                }
            });
        }
        return descr;
    }

    protected override createDescription(refInfo: ReferenceInfo): ReferenceDescription | undefined {
        const targetNodeDescr = refInfo.reference.$nodeDescription;
        const refCstNode = refInfo.reference.$refNode;
        if (!targetNodeDescr || !refCstNode) {
            return undefined;
        }
        const docUri = getDocument(refInfo.container).uri;
        return {
            sourceUri: docUri,
            sourcePath: this.nodeLocator.getAstNodePath(refInfo.container),
            targetUri: targetNodeDescr.documentUri,
            targetPath: targetNodeDescr.path,
            segment: toDocumentSegment(refCstNode),
            local: equalURI(targetNodeDescr.documentUri, docUri)
        };
    }
}