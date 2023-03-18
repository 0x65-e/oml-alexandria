import {
    AstNode,
    AstNodeDescription,
    DefaultScopeComputation,
    LangiumDocument,
    PrecomputedScopes,
    MultiMap,
    streamAllContents,
} from "langium";

import {
    isRelationEntity,
    isMember,
    isOntology,
    Ontology,
    isVocabulary,
    isDescription,
    RelationEntity,
    Member,
} from "./generated/ast";
import { OmlIRIProvider } from "./oml-iri";
import { OmlServices } from "./oml-module";

/**
 * Extension of the default Langium scope computation implementation to
 * support visibility of all elements defined in a file at the global scope
 * and to export all elements via full IRI
 */
export class OmlScopeComputation extends DefaultScopeComputation {
    private omlIRI: OmlIRIProvider;

    constructor(services: OmlServices) {
        super(services);
        this.omlIRI = services.references.OmlIRI;
    }

    override async computeLocalScopes(document: LangiumDocument): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Ontology;
        // This map stores a list of descriptions for each node in our document
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        this.processContainer(model, scopes, document);
        return scopes;
    }

    private processContainer(
        container: Ontology | RelationEntity,
        scopes: PrecomputedScopes,
        document: LangiumDocument
    ): AstNodeDescription[] {
        const localDescriptions: AstNodeDescription[] = [];

        if (isVocabulary(container) || isDescription(container)) {
            for (const element of container.ownedStatements) {
                if (isMember(element)) {
                    // Create a simple local name for the member
                    const description = this.descriptions.createDescription(element, element.name, document);
                    localDescriptions.push(description);
                }
                if (isRelationEntity(element)) {
                    // Make local descriptions for relations in relationentity
                    const nestedDescriptions = this.processContainer(element, scopes, document);
                    for (const description of nestedDescriptions) {
                        localDescriptions.push(description);
                    }
                }
            }
        }

        if (isRelationEntity(container)) {
            if (container.forwardRelation) {
                const description = this.descriptions.createDescription(
                    container.forwardRelation,
                    container.forwardRelation.name,
                    document
                );
                localDescriptions.push(description);
            }
            if (container.reverseRelation) {
                const description = this.descriptions.createDescription(
                    container.reverseRelation,
                    container.reverseRelation.name,
                    document
                );
                localDescriptions.push(description);
            }
        }

        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

    /**
     * Export all members using their fully qualified name
     */
    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];

        for (const modelNode of streamAllContents(document.parseResult.value)) {
            if (isMember(modelNode)) {
                const fullyQualifiedName = this.getQualifiedName(modelNode, modelNode.name);
                // export Members of the Ontology to global namespace
                exportedDescriptions.push(this.descriptions.createDescription(modelNode, fullyQualifiedName, document));
            }
        }

        return exportedDescriptions;
    }

    /**
     * Build a qualified name (FULL_IRI) for a node, given the Ontology + ID/abbreviated_IRI
     */
    private getQualifiedName(node: Member, name: string): string {
        //pass in mapping of ID to FULL_IRI
        //export full IRI of member
        let parent: AstNode | undefined = node.$container;
        while (isOntology(parent) || isMember(parent)) {
            if (isOntology(parent)) {
                name = `<${this.omlIRI.getIRI(parent.namespace)}#${name}>`;
                return name;
            } else {
                // Directly bring ForwardRelation and ReverseRelation into Ontology space
                // name = `${parent.name}:${name}`;
                parent = parent.$container;
            }
        }
        return name;
    }
}
