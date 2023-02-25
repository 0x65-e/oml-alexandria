import fs from 'fs';
import { AstNode, CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import { isMember, isRelationEntity, isSpecializableTerm, isVocabulary, Ontology, Vocabulary } from '../language-server/generated/ast';
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
    fileNode.append(ontology.$type).appendNewLine();
    if (isVocabulary(ontology)) {
        let vocabulary: Vocabulary = ontology;
        if (vocabulary.ownedStatements) vocabulary.ownedStatements.forEach(stmt => dumpNodes(stmt, 1, fileNode));
    } else {
        fileNode.append("NOT VOCABULARY");
    }

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function dumpNodes(smt: AstNode, level: number, printer: CompositeGeneratorNode): void {
    printer.append('\t'.repeat(level) + `${smt.$type}`);
    if (isMember(smt)) {
        printer.append(` (INFO: name: ${smt.name})`);
    }
    printer.appendNewLine();
    if (isRelationEntity(smt)) {
        if (smt.forwardRelation) dumpNodes(smt.forwardRelation, level+1, printer);
        if (smt.reverseRelation) dumpNodes(smt.reverseRelation, level+1, printer);
    }
    if (isSpecializableTerm(smt)) {
        if (smt.ownedSpecializations) smt.ownedSpecializations.forEach(spec => printer.append('\t'.repeat(level+1) + `(INFO: specializes: ${spec.specializedTerm.$refText})`).appendNewLine());
    }
}
