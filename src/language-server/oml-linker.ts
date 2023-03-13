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
import { OmlServices } from "./oml-module";

export class OmlLinker extends DefaultLinker {
    omlIRI : OmlIRIProvider

    constructor(services: OmlServices) {
        super(services);
        this.omlIRI = services.references.OmlIRI;
    }

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
        const scope = this.scopeProvider.getScope(refInfo);
        const description = scope.getElement(this.omlIRI.getRefFULLIRI(refInfo.reference.$refText, idToIRI));
        return description ?? this.createLinkingError(refInfo);
    }
}

