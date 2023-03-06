import fs from 'fs';
import { AstNode, CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import { isMember, isOntology, isRelationEntity, isSpecializableTerm, isVocabulary, Ontology } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

export function generateJavaScript(model: Ontology, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append('"use strict";', NL, NL);
    // model.greetings.forEach(greeting => fileNode.append(`console.log('Hello, ${greeting.person.ref?.name}!');`, NL));

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

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
    // A `Member` is an element identified by a name
    if (isMember(smt)) {
        diag.push(`name: ${smt.name}`);
        // A `SpecializableTerm` can specialize other `Term`s
        if (isSpecializableTerm(smt)) {
            if (smt.ownedSpecializations) smt.ownedSpecializations.forEach(spec => diag.push(`specializes: ${spec.specializedTerm.$refText}`));
        }
    }

    if (diag.length > 0) {
        printer.append(` (${diag.join(", ")})`);
    }
    printer.appendNewLine();

    // Recurse on child nodes
    if (isVocabulary(smt)) {
        if (smt.ownedStatements) smt.ownedStatements.forEach(s => dumpNodes(s, level+1, printer));
    } else if (isRelationEntity(smt)) {
        if (smt.forwardRelation) dumpNodes(smt.forwardRelation, level+1, printer);
        if (smt.reverseRelation) dumpNodes(smt.reverseRelation, level+1, printer);
    }
}
