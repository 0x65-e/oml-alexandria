import { IdCache } from "langium-sprotty";
import { ModelLayoutOptions, SCompartment, SGraph, SLabel, SNode } from "sprotty-protocol";
import { Ontology } from "../generated/ast";
import { ModuleNode_ModuleNodeView, OmlDiagram_SGraphView, SCompartment_SCompartmentView, SLabel_SLabelView_heading } from "./oml-diagram-module";


export class OmlOntologyDiagramView {

    readonly ontology: Ontology
    readonly idCache: IdCache

    constructor(ontology: Ontology, idCache: IdCache) {
        this.ontology = ontology;
        this.idCache = idCache;
    }

    createGraph(): SGraph {
        const id: string = this.idCache.uniqueId("root");
        const lo: ModelLayoutOptions = {
            hAlign: "left",
            hGap: 10.0
        };
        const g: SGraph = {
            id: id,
            type: OmlDiagram_SGraphView,
            children: [],
            layoutOptions: lo
        };
        return g;
    }

    createNode(ontology: Ontology): SNode {
        const id: string = this.idCache.uniqueId(ontology.prefix, ontology);

        const label: SLabel = {
            id: id + ".label",
            type: SLabel_SLabelView_heading,
            text: id
        };

        const compartment: SCompartment = {
            id: id + ".heading",
            type: SCompartment_SCompartmentView,
            layout: "hbox",
            children: [label]
        };

        const node: SNode = {
            id: id,
            type: ModuleNode_ModuleNodeView,
            children: [compartment]
        };
        
        /*if (ontology === this.ontology) {
            // TODO: Can't find SButton class analog
        }*/

        return node;
    }
}