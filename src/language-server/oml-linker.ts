import {
    AstNodeDescription,
    DefaultLinker,
    getDocument,
    LinkingError,
    ReferenceInfo,
    streamAllContents,
} from "langium";

import { isImport, Ontology } from "./generated/ast";
import { OmlIRIProvider } from "./oml-iri";

export class OmlLinker extends DefaultLinker {
    omlIRI : OmlIRIProvider = new OmlIRIProvider()

    override getCandidate(refInfo: ReferenceInfo): AstNodeDescription | LinkingError {

        const document = getDocument(refInfo.container)
        const model = document.parseResult.value as Ontology;
        const idToIRI : Record<string, string> = {};
        idToIRI[model.prefix] = this.omlIRI.getIRI(model.namespace) //if using abbreviatedIRI within Ontology

        for (const modelNode of streamAllContents(document.parseResult.value)) {
            if (isImport(modelNode) && modelNode.prefix != undefined) { 
                idToIRI[modelNode.prefix] = this.omlIRI.getIRI(modelNode.namespace)
            }            
        }
        console.log(this.omlIRI.getRefFULLIRI(refInfo.reference.$refText, idToIRI))
        console.log(refInfo.reference.$refText)
        const scope = this.scopeProvider.getScope(refInfo);
        const description = scope.getElement(this.omlIRI.getRefFULLIRI(refInfo.reference.$refText, idToIRI));
        return description ?? this.createLinkingError(refInfo);
    }
}

