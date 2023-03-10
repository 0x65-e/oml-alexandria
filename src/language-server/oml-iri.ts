import { Ontology } from './generated/ast';

/**
 * Utility class for getting IRI's from a variety of inputs
 */
export class OmlIRIProvider {

    getMemberFULLIRI(parent : Ontology, name : string) : string {
        return `<${this.getIRI(parent.namespace)}#${name}>`
    }

    getRefFULLIRI(refText : string, idToIRI: Record<string, string>) : string {
        if(this.isabbrevIRI(refText)) {
            const ids = refText.split(':')
            if (idToIRI[ids[0]] == undefined) {
                return refText
            }
            return `<${idToIRI[ids[0]]}#${ids[1]}>`
        } 
        return refText
    }

    private isabbrevIRI(refText : string) : boolean{
        if(!(refText.startsWith('<') && refText.endsWith('>')) && refText.includes(':')) {
            return true
        }
        return false
    }
 
    getIRI(namespace : string): string {
        if(namespace.startsWith('<'))
            namespace = namespace.substring(1)
        if(namespace.endsWith('>'))
            namespace = namespace.substring(0, namespace.length-1)
        if(namespace.endsWith('/') || namespace.endsWith('#'))
            namespace = namespace.substring(0, namespace.length-1)
        return namespace
    }

}