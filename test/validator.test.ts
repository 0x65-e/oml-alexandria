import { describe, expect, test } from 'vitest';
import {EmptyFileSystem } from 'langium';
import { parseDocument } from 'langium/test';
import { createOmlServices } from '../src/language-server/oml-module';
import {
    Entity,
    EnumeratedScalar,
    Vocabulary
} from'../src/language-server/generated/ast';
import { OmlValidator } from '../src/language-server/oml-validator';
import { ValidationAcceptor } from 'langium';

const services = createOmlServices(EmptyFileSystem).Oml;
let validator=new OmlValidator;
let result=undefined;
let accept=(p1:any):ValidationAcceptor=>{result=p1;return p1;}
const entityFile = `
vocabulary <http://www.w3.org/2001/XMLSchema#> as xsd {
    scalar nonNegativeInteger 
    relation entity Contains [
        from Dungeon
        to Monster
        forward contains
        reverse isContainedBy
        functional
        inverse functional
        inverse functional
    ]
}
`;

const goodScalarFile = `
vocabulary <http://www.w3.org/2001/XMLSchema#> as xsd {
    enumerated scalar Color [
        "Black",
        "Blue",
        "Green",
        "Red",
        "White"
    ]
}
`;
const badScalarFile = `
vocabulary <http://www.w3.org/2001/XMLSchema#> as xsd {
    enumerated scalar Color [
        "Black",
        "Black",
        "Blue",
        "Green",
        "Red",
        "White"
    ]
}
`;
//arbitrary tests, obviously more could be added.
describe('checkEntityHasConsistentKeys', () => {
    test('No Key Check', async () => {
        const model = await getModel(entityFile);
        const temp= model.ownedStatements[1] as Entity;
        validator.checkEntityHasConsistentKeys(temp,accept)
        expect(result).toEqual(undefined);

    })
    /*
    test('Duplicate Check', async () => {
        const model = await getModel(entityFile);
        const temp= model.ownedStatements[1] as Entity;
        validator.checkEntityHasConsistentKeys(temp,accept)
        expect(result).toEqual('warning'); 

    })
    */
    
   
    
});
describe('checkEnumeratedScalarNoDuplications',()=>{
    test('No Dupe',async()=>{
        const model = await getModel(goodScalarFile);
        const temp= model.ownedStatements[0] as EnumeratedScalar;
        validator.checkEnumeratedScalarNoDuplications(temp,accept);
        expect(result).toEqual(undefined);
    })
    test('Dupe',async()=>{
        const model = await getModel(badScalarFile);
        const temp= model.ownedStatements[0] as EnumeratedScalar;
        validator.checkEnumeratedScalarNoDuplications(temp,accept);
        expect(result).toEqual('error');
    })

})
async function getModel(input:string): Promise<Vocabulary> {
    const doc = await parseDocument(services, input);
    const model = doc.parseResult.value as Vocabulary;
    return model;
}
