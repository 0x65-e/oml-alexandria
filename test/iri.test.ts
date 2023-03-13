import { describe,test ,expect} from "vitest";
import {EmptyFileSystem } from 'langium';
import { parseDocument } from 'langium/test';
import { createOmlServices } from '../src/language-server/oml-module';
import {
    Entity,
    EnumeratedScalar,
    Ontology,
    Vocabulary
} from'../src/language-server/generated/ast';
import { OmlValidator } from '../src/language-server/oml-validator';
import { ValidationAcceptor } from 'langium';
import { OmlIRIProvider } from "../src/language-server/oml-iri";

let provider=new OmlIRIProvider;
const services = createOmlServices(EmptyFileSystem).Oml;
describe('getMemberFULLIRI',()=>{
    test('testing utility',async()=>{
        const model = await getModel(file);
        const temp= model as Ontology;
        const result=provider.getMemberFULLIRI(temp,"lulw");
        expect(result).toEqual('<http://www.w3.org/2000/01/rdf-schema#lulw>');
    })
   

})
const file=`
@dc:creator "W3C"
@dc:rights "Copyright 2001 W3C."
@dc:description "The RDFS vocabulary is a subset of the vocabulary maintained by the W3C."
@dc:title "RDFS"
vocabulary <http://www.w3.org/2000/01/rdf-schema#> as rdfs {

	extends <http://purl.org/dc/elements/1.1/> as dc

	annotation property comment

}
`;
async function getModel(input:string): Promise<Ontology> {
    const doc = await parseDocument(services, input);
    const model = doc.parseResult.value as Ontology;
    return model;
}
