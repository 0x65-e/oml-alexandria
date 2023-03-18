import { AstNode, AstNodeHoverProvider } from "langium";
import { Hover } from "vscode-languageclient";
import {
    isAnnotatedElement,
    isAnnotationPropertyReference,
    isAspectReference,
    isConceptReference,
    isEnumeratedScalarReference,
    isFacetedScalarReference,
    isMember,
    isRelationEntity,
    isRelationEntityReference,
    isScalarPropertyReference,
    isSpecializableTerm,
    isSpecializableTermReference,
    isStructuredPropertyReference,
    isStructureReference,
    Ontology,
} from "./generated/ast";

/**
 * Customized hover provider for OML elements.
 *
 * Displays annotations defined on elements, their namespace and local ID,
 * and any relevant information (like specializations and relation entity properties)
 */
export class OmlHoverProvider extends AstNodeHoverProvider {
    protected getAstNodeHoverContent(node: AstNode): Hover | undefined {
        let valString: string = "";
        if (isAnnotatedElement(node) && node.ownedAnnotations) {
            if (node.ownedAnnotations.length > 0) valString += "**Annotations:** \n";
            node.ownedAnnotations.forEach((annotation) => {
                valString += `* **${annotation.property.$refText}**: ${
                    annotation.value
                        ? annotation.value.value
                        : annotation.referenceValue
                        ? annotation.referenceValue.$refText
                        : ""
                }\n`;
            });
        }
        valString += "\n\n";

        if (isMember(node)) {
            const nodeOntology = node.$container as Ontology;
            // let valString : string = nodeOntology.namespace;
            valString += `${node.$type} **${node.name}** of namespace ${nodeOntology.namespace}\n\n`;
            if (isSpecializableTerm(node)) {
                if (node.ownedSpecializations)
                    node.ownedSpecializations.forEach(
                        (spec) => (valString += `\tspecializes: ${spec.specializedTerm.$refText}\n`)
                    );
                // A `RelationEntity` characterizes relations between other entities
                if (isRelationEntity(node)) {
                    if (node.source.ref) valString += `\tsource: ${node.source.ref.name}\n`;
                    if (node.target.ref) valString += `\ttarget: ${node.target.ref.name}\n`;
                    if (node.functional) valString += `\tfunctional: true\n`;
                    if (node.inverseFunctional) valString += `\tinverseFunctional: true\n`;
                    if (node.symmetric) valString += `\tsymmetric: true\n`;
                    if (node.asymmetric) valString += `\tasymmetric: true\n`;
                    if (node.reflexive) valString += `\treflexive: true\n`;
                    if (node.irreflexive) valString += `\tirreflexive: true\n`;
                    if (node.transitive) valString += `\ttransitive: true\n`;
                }
            }
            return {
                contents: {
                    kind: "markdown",
                    value: valString,
                },
            };
        } else if (isSpecializableTermReference(node)) {
            //technically never shows hover for now cause no named node
            if (isFacetedScalarReference(node) || isEnumeratedScalarReference(node)) {
                if (node.scalar.ref) valString += `name: ${node.scalar.ref.name}\n`;
            } else if (
                isScalarPropertyReference(node) ||
                isStructuredPropertyReference(node) ||
                isAnnotationPropertyReference(node)
            ) {
                if (node.property.ref) valString += `name: ${node.property.ref.name}\n`;
            } else if (isConceptReference(node)) {
                if (node.concept.ref) valString += `name: ${node.concept.ref.name}\n`;
            } else if (isAspectReference(node)) {
                if (node.aspect.ref) valString += `name: ${node.aspect.ref.name}\n`;
            } else if (isStructureReference(node)) {
                if (node.structure.ref) valString += `name: ${node.structure.ref.name}\n`;
            } else if (isRelationEntityReference(node)) {
                if (node.entity.ref) valString += `name: ${node.entity.ref.name}\n`;
            }
            if (node.ownedSpecializations)
                node.ownedSpecializations.forEach(
                    (spec) => (valString += `specializes: ${spec.specializedTerm.$refText}\n`)
                );

            return {
                contents: {
                    kind: "markdown",
                    value: valString,
                },
            };
        }

        return undefined;
    }
}
