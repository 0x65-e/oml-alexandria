import { GeneratorContext, LangiumDiagramGenerator } from "langium-sprotty";
import { SGraph, SModelRoot, SNode } from "sprotty-protocol";
import { Ontology } from "../generated/ast";
import { OmlOntologyDiagramView } from "./oml-ontology-diagram-view";


export class OmlDiagramGenerator extends LangiumDiagramGenerator {

    protected generateRoot(args: GeneratorContext<Ontology>): SModelRoot {
        const { document, idCache } = args;
        const ontology: Ontology = document.parseResult.value;

        let view: OmlOntologyDiagramView = new OmlOntologyDiagramView(ontology, idCache);
        let graph: SGraph = view.createGraph();

        // Actually create something here for the Ontology
        const node: SNode = view.createNode(ontology);
        graph.children.push(node);

        /*if (args.state.currentRoot.type === "NONE") {
            // TODO: Not sure what expanded elements are
        }*/

        return graph;
    }
}