import { Ontology } from "./generated/ast";

/**
 * Utility class for getting IRI's from a variety of inputs
 */
export class OmlIRIProvider {
    getMemberFULLIRI(parent: Ontology, name: string): string {
        return `<${this.getIRI(parent.namespace)}#${name}>`;
    }

    getRefFULLIRI(refText: string, idToIRI: Record<string, string>): string {
        if (this.isabbrevIRI(refText)) {
            const ids = refText.split(":");
            if (idToIRI[ids[0]] == undefined) {
                return refText;
            }
            return `<${idToIRI[ids[0]]}#${ids[1]}>`;
        }
        return refText;
    }

    isabbrevIRI(refText: string): boolean {
        if (!this.isFullIRI(refText) && refText.includes(":")) {
            return true;
        }
        return false;
    }

    isFullIRI(refText: string): boolean {
        if (refText.startsWith("<") && refText.endsWith(">")) return true;
        return false;
    }

    isId(refText: string): boolean {
        if (!this.isFullIRI(refText) && !this.isabbrevIRI(refText)) {
            return true;
        }
        return false;
    }

    getIRI(namespace: string): string {
        if (namespace.startsWith("<")) namespace = namespace.substring(1);
        if (namespace.endsWith(">")) namespace = namespace.substring(0, namespace.length - 1);
        if (namespace.endsWith("/") || namespace.endsWith("#"))
            namespace = namespace.substring(0, namespace.length - 1);
        return namespace;
    }
}
