import fs from 'fs';
import { AstNode, CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import { isAnnotationPropertyReference, isAspectReference, isConceptReference, isEnumeratedScalarReference, isFacetedScalarReference, isImport, isMember, isOntology, isRelationEntity, isRelationEntityReference, isScalarPropertyReference, isSpecializableTerm, isSpecializableTermReference, isStructuredPropertyReference, isStructureReference, isVocabulary, Ontology } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

export function dumpTree(ontology: Ontology, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.txt`;

    const fileNode = new CompositeGeneratorNode();
    dumpNodes(ontology, 0, fileNode);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function dumpNodes(smt: AstNode, level: number, printer: CompositeGeneratorNode): void {
    // Print the type name of this node
    printer.append('\t'.repeat(level) + `${smt.$type}`);

    // Print diagnostic information for selected types, if available
    let diag: string[] = [];

    // An `Ontology` has a globally-unique namespace
    if (isOntology(smt)) {
        diag.push(`namespace: ${smt.namespace}`);
    }
    // An `Import` is a link to another `Ontology`
    if (isImport(smt)) {
        diag.push(`namespace: ${smt.namespace}`);
        if (smt.prefix) diag.push(`prefix: ${smt.prefix}`);
    }
    // A `Member` is an element identified by a name
    if (isMember(smt)) {
        diag.push(`name: ${smt.name}`);
        // A `SpecializableTerm` can specialize other `Term`s
        if (isSpecializableTerm(smt)) {
            if (smt.ownedSpecializations) smt.ownedSpecializations.forEach(spec => diag.push(`specializes: ${spec.specializedTerm.$refText}`));
            // A `RelationEntity` characterizes relations between other entities
            if (isRelationEntity(smt)) {
                if (smt.source.ref) diag.push(`source: ${smt.source.ref.name}`);
                if (smt.target.ref) diag.push(`target: ${smt.target.ref.name}`);
                if (smt.functional) diag.push(`functional: true`);
                if (smt.inverseFunctional) diag.push(`inverseFunctional: true`);
                if (smt.symmetric) diag.push(`symmetric: true`);
                if (smt.asymmetric) diag.push(`asymmetric: true`);
                if (smt.reflexive) diag.push(`reflexive: true`);
                if (smt.irreflexive) diag.push(`irreflexive: true`);
                if (smt.transitive) diag.push(`transitive: true`);
            }
        }
    }
    // A `SpecializableTermReference` is a reference to a `SpecializableTerm`
    if (isSpecializableTermReference(smt)) {
        if (isFacetedScalarReference(smt) || isEnumeratedScalarReference(smt)) {
            if (smt.scalar.ref) diag.push(`name: ${smt.scalar.ref.name}`)
        } else if (isScalarPropertyReference(smt) || isStructuredPropertyReference(smt) || isAnnotationPropertyReference(smt)) {
            if (smt.property.ref) diag.push(`name: ${smt.property.ref.name}`)
        } else if (isConceptReference(smt)) {
            if (smt.concept.ref) diag.push(`name: ${smt.concept.ref.name}`)
        } else if (isAspectReference(smt)) {
            if (smt.aspect.ref) diag.push(`name: ${smt.aspect.ref.name}`)
        } else if (isStructureReference(smt)) {
            if (smt.structure.ref) diag.push(`name: ${smt.structure.ref.name}`)
        } else if (isRelationEntityReference(smt)) {
            if (smt.entity.ref) diag.push(`name: ${smt.entity.ref.name}`)
        }
        if (smt.ownedSpecializations) smt.ownedSpecializations.forEach(spec => diag.push(`specializes: ${spec.specializedTerm.$refText}`));
    }

    if (diag.length > 0) {
        printer.append(` (${diag.join(", ")})`);
    }
    printer.appendNewLine();

    // Recurse on child nodes
    if (isVocabulary(smt)) {
        if (smt.ownedImports) smt.ownedImports.forEach(i => dumpNodes(i, level+1, printer));
        if (smt.ownedStatements) smt.ownedStatements.forEach(s => dumpNodes(s, level+1, printer));
    } else if (isRelationEntity(smt)) {
        if (smt.forwardRelation) dumpNodes(smt.forwardRelation, level+1, printer);
        if (smt.reverseRelation) dumpNodes(smt.reverseRelation, level+1, printer);
    }
}
