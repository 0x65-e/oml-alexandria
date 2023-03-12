import { describe, expect, test } from 'vitest';
import { AstNode, EmptyFileSystem } from 'langium';
import { parseDocument } from 'langium/test';
import { createOmlServices } from '../src/language-server/oml-module';
import {  Vocabulary, VocabularyStatement } from '../src/language-server/generated/ast';

const services = createOmlServices(EmptyFileSystem).Oml;

const omlFile = `
vocabulary <https://example.com/dungeons#> as dnd {
    aspect Dungeon
    aspect Monster
    relation entity Contains [
        from Dungeon
        to Monster
    ]
}
 `;

describe('AstNode location', () => {
    test('Calculate path for nodes', async () => {
        const model = await getModel();
        const path=createPath(model.ownedStatements[0]);
        expect(path).toEqual('/ownedStatements@0');
        const path2=createPath((model.ownedStatements[2] as VocabularyStatement));
        expect(path2).toEqual('/ownedStatements@2');
    });
    test('Locate node for path', async () => {
        const model = await getModel();
        expect(findNode(model, '/ownedStatements@0')).toEqual(model.ownedStatements[0]);
        expect(findNode(model, '/ownedStatements@2')).toEqual((model.ownedStatements[2] as VocabularyStatement));
    });
});

async function getModel(): Promise<Vocabulary> {
    const doc = await parseDocument(services, omlFile);
    const model = doc.parseResult.value as Vocabulary;
    return model;
}

function createPath(node: AstNode): string {
    return services.workspace.AstNodeLocator.getAstNodePath(node);
}

function findNode(node: AstNode, path: string): AstNode | undefined {
    return services.workspace.AstNodeLocator.getAstNode(node, path);
}