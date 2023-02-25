import fs from 'fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import { isMember, isRelationEntity, isSpecializableTerm, isVocabulary, Ontology, RelationEntity, Vocabulary, VocabularyStatement } from '../language-server/generated/ast';
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
        dumpStatements(vocabulary.ownedStatements, 1, fileNode);
    } else {
        fileNode.append("NOT VOCABULARY");
    }

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function dumpStatements(stmts: VocabularyStatement[], level: number, printer: CompositeGeneratorNode): void {
    for (let smt of stmts) {
        printer.append('\t'.repeat(level) + `${smt.$type}`);
        if (isMember(smt)) {
            printer.append(` (INFO: name: ${smt.name})`);
        }
        printer.appendNewLine();
        if (isRelationEntity(smt)) {
            dumpRelationEntity(smt, level+1, printer)
        }
        if (isSpecializableTerm(smt)) {
            if (smt.ownedSpecializations) smt.ownedSpecializations.forEach(spec => printer.append('\t'.repeat(level+1) + `(INFO: specializes: ${spec.specializedTerm.$refText})`).appendNewLine());
        }
    }
}

function dumpRelationEntity(entity: RelationEntity, level: number, printer: CompositeGeneratorNode): void {
    if (entity.forwardRelation) {
        printer.append('\t'.repeat(level) + `Forward Relation (INFO: name: ${entity.forwardRelation.name})`).appendNewLine();
    }
    if (entity.reverseRelation) {
        printer.append('\t'.repeat(level) + `Reverse Relation (INFO: name: ${entity.reverseRelation.name})`).appendNewLine();
    }
}
