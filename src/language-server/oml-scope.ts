import {
    AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument,
    PrecomputedScopes, MultiMap
} from 'langium';

import { isRelationEntity, isMember, Ontology, isVocabulary, isDescription, RelationEntity} from './generated/ast';


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

    // private createQualifiedDescription(
    //     container: Namespace, 
    //     description: AstNodeDescription, 
    //     document: LangiumDocument
    // ): AstNodeDescription {
    //     // `getQualifiedName` has been implemented in the previous section
    //     const name = this.getQualifiedName(container.name, description.name);
    //     return this.descriptions.createDescription(description.node!, name, document);
    // }

    /**
     * Build a qualified name for a model node
     */
    //  private getQualifiedName(node: AstNode, name: string): string {
    //     let parent: AstNode | undefined = node.$container;
    //     while (isOntology(parent)) {
    //         // Iteratively prepend the name of the parent namespace
    //         // This allows us to work with nested namespaces
    //         name = `${parent.namespace}:${name}`;
    //         parent = parent.$container;
    //     }
    //     return name;
    // }
}