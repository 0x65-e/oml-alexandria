import {
    AstNode,
    AstNodeDescription,
    DefaultScopeProvider,
    getDocument,
    ReferenceInfo,
    Scope,
    Stream,
    stream,
} from "langium";

/**
 * Extension of the default Langium ScopeProvider implementation to
 * support visibility of all elements defined in a file at the global scope.
 */
export class OmlScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = [];
        const referenceType = this.reflection.getReferenceType(context);

        const precomputed = getDocument(context.container).precomputedScopes;
        // console.log(context.container.$cstNode?.text)
        if (precomputed) {
            let currentNode: AstNode | undefined = context.container;
            do {
                const allDescriptions = precomputed.get(currentNode);

                if (allDescriptions.length > 0) {
                    scopes.push(
                        stream(allDescriptions).filter((desc) => this.reflection.isSubtype(desc.type, referenceType))
                    );
                }
                currentNode = currentNode.$container;
            } while (currentNode);

            //Only add scope for vocabulary/description bundles
            // currentNode = context.container;
            // if(isVocabularyBundle(currentNode) || isDescriptionBundle(currentNode)) {

            // }
        }

        let result: Scope = this.getGlobalScope(referenceType, context);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = this.createScope(scopes[i], result);
        }
        return result;
    }
}
