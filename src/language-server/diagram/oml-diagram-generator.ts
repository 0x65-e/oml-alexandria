import { AstNode } from "langium";
import { GeneratorContext, LangiumDiagramGenerator } from "langium-sprotty";
import { SCompartment, SEdge, SGraph, SLabel, SModelElement, SModelRoot } from "sprotty-protocol";
import {
    Classifier,
    Entity,
    isAspect,
    isConcept,
    isConceptInstance,
    isImport,
    isOntology,
    isRelationEntity,
    isRelationInstance,
    isScalar,
    isScalarPropertyValueAssertion,
    isStructure,
    NamedInstance,
    Ontology,
} from "../generated/ast";
import { OmlOntologyDiagramScope, OmlOntologyDiagramScopeComputation } from "./oml-ontology-diagram-scope";
import { OmlNode, OmlOntologyDiagramView } from "./oml-ontology-diagram-view";

export class OmlDiagramGenerator extends LangiumDiagramGenerator {
    protected generateRoot(args: GeneratorContext<Ontology>): SModelRoot {
        const { document, idCache } = args;
        let semantic2diagram: Map<AstNode, SModelElement> = new Map();

        const ontology: Ontology = document.parseResult.value;

        let view: OmlOntologyDiagramView = new OmlOntologyDiagramView(ontology, idCache);
        let graph: SGraph = view.createGraph();

        const frame: OmlNode = this.entryPoint(ontology, view, graph);
        semantic2diagram.set(ontology, frame);

        const scope: OmlOntologyDiagramScope = new OmlOntologyDiagramScopeComputation(ontology).analyze();
        // TODO: For-each on the elements of the scope and call doSwitch
        // TODO: For-each on the entity Axioms of the scope and call doSwitch

        return graph;
    }

    private entryPoint(element: Ontology, view: OmlOntologyDiagramView, graph: SGraph): OmlNode {
        let node: OmlNode = view.createOntologyNode(element);
        graph.children.push(node);

        /*if (args.state.currentRoot.type === "NONE") {
            // TODO: Not sure what expanded elements are
        }*/
        return node;
    }

    private doSwitch(
        element: AstNode | undefined,
        semantic2diagram: Map<AstNode, SModelElement>,
        view: OmlOntologyDiagramView,
        graph: SGraph,
        frame: OmlNode,
        scope: OmlOntologyDiagramScope
    ): SModelElement | undefined {
        if (element == undefined) return undefined;
        let s: SModelElement | undefined = semantic2diagram.get(element);
        if (s != undefined) return s;

        // Check for every element type
        if (isOntology(element)) {
            let node: OmlNode = view.createOntologyNode(element);
            graph.children.push(node);

            /*if (args.state.currentRoot.type === "NONE") {
                // TODO: Not sure what expanded elements are
            }*/
            return node;
        } else if (isImport(element)) {
            // TODO: Can't get the actual ontology from the import, like getImportedOntology
            return undefined;
        } else if (isAspect(element)) {
            if (!isExpanded(frame)) return undefined;
            const node: OmlNode = view.createAspectNode(element);

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            this.addClassifierFeatures(element, node, semantic2diagram, view, graph, frame, scope);
            return node;
        } else if (isConcept(element)) {
            if (!isExpanded(frame)) return undefined;
            const node: OmlNode = view.createConceptNode(element);

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            this.addClassifierFeatures(element, node, semantic2diagram, view, graph, frame, scope);
            return node;
        } else if (isRelationEntity(element)) {
            if (!isExpanded(frame)) return undefined;
            const source: Entity | undefined = element.source.ref;
            const target: Entity | undefined = element.target.ref;

            // TODO: scope.entityAxioms

            if (source != undefined && target != undefined) {
                // TODO: There's a whole lot left to do for this
            }

            return undefined;
        } else if (isStructure(element)) {
            if (!isExpanded(frame)) return undefined;
            const node: OmlNode = view.createStructureNode(element);

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            return node;
        } else if (isScalar(element)) {
            if (!isExpanded(frame)) return undefined;
            const node: OmlNode = view.createScalarNode(element);

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            return node;
        } else if (isConceptInstance(element)) {
            if (!isExpanded(frame)) return undefined;
            const node: OmlNode = view.createConceptInstanceNode(element);

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            return node;
        } else if (isRelationInstance(element)) {
            if (!isExpanded(frame)) return undefined;

            if (element.sources.length == 1 && element.targets.length == 1) {
                const source: SModelElement | undefined = this.doSwitch(
                    element.sources.at(0)?.ref,
                    semantic2diagram,
                    view,
                    graph,
                    frame,
                    scope
                );
                const target: SModelElement | undefined = this.doSwitch(
                    element.targets.at(0)?.ref,
                    semantic2diagram,
                    view,
                    graph,
                    frame,
                    scope
                );
                if (source != undefined && target != undefined) {
                    if (
                        scope.instanceAssertions.get(element) != undefined &&
                        scope.instanceAssertions.get(element)?.size != 0
                    ) {
                        const node: OmlNode = view.createRelationInstanceNode(element, source, target);

                        frame.children?.push(node);
                        semantic2diagram.set(element, node);
                        this.addInstanceFeatures(element, node, semantic2diagram, view, frame, scope);
                        return node;
                    } else {
                        const edge: SEdge = view.createRelationInstanceEdge(element, source, target);
                        frame.children?.push(edge);
                        semantic2diagram.set(element, edge);
                        return edge;
                    }
                }
            }
            return undefined;
        } else {
            return undefined;
        }
    }

    // TODO: all the showAxiom and showAxiomInternal functions

    private addClassifierFeatures(
        cls: Classifier,
        node: OmlNode,
        semantic2diagram: Map<AstNode, SModelElement>,
        view: OmlOntologyDiagramView,
        graph: SGraph,
        frame: OmlNode,
        scope: OmlOntologyDiagramScope
    ): void {
        const scalarProps = scope.scalarProperties.get(cls);
        if (scalarProps)
            [...scalarProps.keys()]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((f) => {
                    if (semantic2diagram.get(f) === undefined) {
                        let comp: SCompartment | undefined = view.getPropertyCompartment(node);
                        if (comp === undefined) {
                            comp = view.createPropertyCompartment(cls);
                            node.children?.push(comp);
                        }
                        const label: SLabel = view.createScalarPropertyLabel(cls, f);
                        comp.children?.push(label);
                        semantic2diagram.set(f, label);
                    }
                });
        const structuredProps = scope.structuredProperties.get(cls);
        if (structuredProps)
            [...structuredProps.keys()]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((f) => {
                    if (semantic2diagram.get(f) === undefined) {
                        const source: SModelElement | undefined = this.doSwitch(
                            cls,
                            semantic2diagram,
                            view,
                            graph,
                            frame,
                            scope
                        );
                        const target: SModelElement | undefined = this.doSwitch(
                            f.range.ref,
                            semantic2diagram,
                            view,
                            graph,
                            frame,
                            scope
                        );
                        if (source && target) {
                            const edge: SEdge = view.createStructuredPropertyEdge(cls, f, source, target);
                            frame.children?.push(edge);
                            semantic2diagram.set(f, edge);
                        }
                    }
                });
    }

    // TODO: addInstanceFeatures
    private addInstanceFeatures(
        i: NamedInstance,
        node: OmlNode,
        semantic2diagram: Map<AstNode, SModelElement>,
        view: OmlOntologyDiagramView,
        frame: OmlNode,
        scope: OmlOntologyDiagramScope
    ): void {
        const instAssert = scope.instanceAssertions.get(i);
        if (instAssert)
            instAssert.forEach((a) => {
                if (isScalarPropertyValueAssertion(a)) {
                    if (semantic2diagram.get(a) === undefined) {
                        let comp: SCompartment | undefined = view.getPropertyCompartment(node);
                        if (comp === undefined) {
                            comp = view.createNamedPropertyCompartment(i);
                            node.children?.push(comp);
                        }
                        const label: SLabel = view.createValueAssertionLabel(i, a);
                        comp.children?.push(label);
                        semantic2diagram.set(a, label);
                    }
                }
            });
    }
}

function isExpanded(frame: OmlNode): boolean {
    return frame.expanded != undefined && frame.expanded;
}
