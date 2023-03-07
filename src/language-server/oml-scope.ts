import {
    AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument,
    PrecomputedScopes, MultiMap, streamAllContents
} from 'langium';

import { isRelationEntity, isMember, isOntology, Ontology, isVocabulary, isDescription, RelationEntity} from './generated/ast';


export class OmlScopeComputation extends DefaultScopeComputation {

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

        if (isVocabulary(container) || isDescription(container)){
            for (const element of container.ownedStatements) {
                if (isMember(element)) {
                    // Create a simple local name for the member
                    const description = this.descriptions.createDescription(element, element.name, document);
                    localDescriptions.push(description);
                }
                if (isRelationEntity(element)) {
                    const nestedDescriptions = this.processContainer(element, scopes, document);
                    for (const description of nestedDescriptions) {
                        localDescriptions.push(description);
                    }
                }
            }
        }

        if (isRelationEntity(container)) {
            if (container.forwardRelation) {
                const description = this.descriptions.createDescription(container.forwardRelation, container.forwardRelation.name, document);
                localDescriptions.push(description)
            }
            if (container.reverseRelation) {
                const description = this.descriptions.createDescription(container.reverseRelation, container.reverseRelation.name, document);
                localDescriptions.push(description)
            }
        }
        
        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

    /**
     * Export all functions using their fully qualified name
     */
     override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const modelNode of streamAllContents(document.parseResult.value)) {
            if (isMember(modelNode)) {
                const fullyQualifiedName = this.getQualifiedName(modelNode, modelNode.name);
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(modelNode, fullyQualifiedName, document));
            }
        }
        return exportedDescriptions;
    }

    /**
     * Build a qualified name for a model node
     */
     private getQualifiedName(node: AstNode, name: string): string {
        let parent: AstNode | undefined = node.$container;
        while (isOntology(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.namespace}:${name}`;
            parent = parent.$container;
        }
        return name;
    }
}