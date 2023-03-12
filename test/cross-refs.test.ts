import { describe, expect, test } from 'vitest';
import { AstNode, LangiumDocument, ReferenceDescription, EmptyFileSystem } from 'langium';
import { parseDocument } from 'langium/test';
import { createOmlServices } from '../src/language-server/oml-module';
import {  Vocabulary } from '../src/language-server/generated/ast';

const services = createOmlServices(EmptyFileSystem).Oml;

const omlFile = `
vocabulary <http://www.w3.org/2001/XMLSchema#> as xsd {
    scalar nonNegativeInteger :> integer
    scalar positiveInteger :> nonNegativeInteger
}
`;

const referencingFile = `
vocabulary <https://example.com/dungeons#> as dnd {
    extends <http://www.w3.org/2001/XMLSchema#> as xsd
    scalar ChallengeRating :> xsd:positiveInteger [
        minInclusive 0
        maxInclusive 30
    ]
}
`;

describe('Cross references from declaration', () => {
    test('Find all references', async () => {
        const allRefs = await getReferences();
        expect(allRefs.length).toEqual(1); //positiveInteger

    })
    
});


async function getReferences(): Promise<ReferenceDescription[]> {
    const datatypeDoc: LangiumDocument<AstNode> = await parseDocument(services, omlFile);
    const referencingDoc: LangiumDocument<AstNode> = await parseDocument(services, referencingFile);

    await services.shared.workspace.DocumentBuilder.build([referencingDoc, datatypeDoc]);
    const model = (datatypeDoc.parseResult.value as Vocabulary);

    const stringType = model.ownedStatements[1];

    const allRefs: ReferenceDescription[] = [];
    services.shared.workspace.IndexManager.findAllReferences(stringType, createPath(stringType))
        .forEach((ref) => allRefs.push(ref));
    return allRefs;
}


function createPath(node: AstNode): string {
    return services.workspace.AstNodeLocator.getAstNodePath(node);
}