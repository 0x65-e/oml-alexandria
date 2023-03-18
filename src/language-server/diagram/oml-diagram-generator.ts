import { AstNode } from "langium";
import { GeneratorContext, LangiumDiagramGenerator } from "langium-sprotty";
import {
  SCompartment,
  SEdge,
  SGraph,
  SLabel,
  SModelElement,
  SModelRoot,
} from "sprotty-protocol";
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
  Axiom,
  SpecializationAxiom,
  KeyAxiom,
  ScalarPropertyRangeRestrictionAxiom,
  ScalarPropertyCardinalityRestrictionAxiom,
  ScalarPropertyValueRestrictionAxiom,
  StructuredPropertyRangeRestrictionAxiom,
  StructuredPropertyCardinalityRestrictionAxiom,
  StructuredPropertyValueRestrictionAxiom,
  RelationRangeRestrictionAxiom,
  RelationCardinalityRestrictionAxiom,
  RelationTargetRestrictionAxiom,
  isSpecializationAxiom,
  isKeyAxiom,
  isScalarPropertyRangeRestrictionAxiom,
  isScalarPropertyCardinalityRestrictionAxiom,
  isScalarPropertyValueRestrictionAxiom,
  isStructuredPropertyRangeRestrictionAxiom,
  isStructuredPropertyCardinalityRestrictionAxiom,
  isStructuredPropertyValueRestrictionAxiom,
  isRelationRangeRestrictionAxiom,
  isRelationCardinalityRestrictionAxiom,
  isRelationTargetRestrictionAxiom,
} from "../generated/ast";
import { getAbbreviatedIri } from "../util/oml-read";
import {
  OmlOntologyDiagramScope,
  OmlOntologyDiagramScopeComputation,
} from "./oml-ontology-diagram-scope";
import { OmlNode, OmlOntologyDiagramView } from "./oml-ontology-diagram-view";

/**
 * Class that generates a view for an OML diagram model
 */
export class OmlDiagramGenerator extends LangiumDiagramGenerator {
  protected generateRoot(args: GeneratorContext<Ontology>): SModelRoot {
    const { document, idCache } = args;
    let semantic2diagram: Map<AstNode, SModelElement> = new Map();

    const ontology: Ontology = document.parseResult.value;

    let view: OmlOntologyDiagramView = new OmlOntologyDiagramView(
      ontology,
      idCache
    );
    let graph: SGraph = view.createGraph();

    const frame: OmlNode = this.entryPoint(ontology, view, graph);
    semantic2diagram.set(ontology, frame);

    const scope: OmlOntologyDiagramScope =
      new OmlOntologyDiagramScopeComputation(ontology).analyze();
    scope
      .scope()
      .forEach((e) =>
        this.doSwitch(e, semantic2diagram, view, graph, frame, scope)
      );
    for (const [entity, axioms] of scope.entityAxioms.entries()) {
      for (const axiom of axioms) {
        this.showAxiom(entity, axiom, frame, semantic2diagram, view);
      }
    }
    console.log("JSON.stringify graph");
    console.log(JSON.stringify(graph));
    return graph;
  }

  private entryPoint(
    element: Ontology,
    view: OmlOntologyDiagramView,
    graph: SGraph
  ): OmlNode {
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
      this.addClassifierFeatures(
        element,
        node,
        semantic2diagram,
        view,
        graph,
        frame,
        scope
      );
      return node;
    } else if (isConcept(element)) {
      if (!isExpanded(frame)) return undefined;
      const node: OmlNode = view.createConceptNode(element);

      frame.children?.push(node);
      semantic2diagram.set(element, node);
      this.addClassifierFeatures(
        element,
        node,
        semantic2diagram,
        view,
        graph,
        frame,
        scope
      );
      return node;
    } else if (isRelationEntity(element)) {
      if (!isExpanded(frame)) return undefined;
      const source: Entity | undefined = element.source.ref;
      const target: Entity | undefined = element.target.ref;

      const keys = Array.from(
        (scope?.entityAxioms ?? new Map()).get(element) ?? []
      ).filter((a) => isKeyAxiom(a));

      if (element === source) {
        const ts = this.doSwitch(
          target,
          semantic2diagram,
          view,
          graph,
          frame,
          scope
        );
        if (ts) {
          const node = view.createSourceNode(element, ts);
          frame.children?.push(node);
          semantic2diagram.set(element, node);
          this.addClassifierFeatures(
            element,
            node,
            semantic2diagram,
            view,
            graph,
            frame,
            scope
          );
        }
      } else if (element === target) {
        const ss = this.doSwitch(
          source,
          semantic2diagram,
          view,
          graph,
          frame,
          scope
        );
        if (ss) {
          const node = view.createTargetNode(element, ss);
          frame.children?.push(node);
          semantic2diagram.set(element, node);
          this.addClassifierFeatures(
            element,
            node,
            semantic2diagram,
            view,
            graph,
            frame,
            scope
          );
        }
      } else {
        const ts = this.doSwitch(
          target,
          semantic2diagram,
          view,
          graph,
          frame,
          scope
        );
        const ss = this.doSwitch(
          source,
          semantic2diagram,
          view,
          graph,
          frame,
          scope
        );
        if (ss && ts) {
          if (scope.classifierHasFeaturesOrEdges(element) || keys.length > 0) {
            const node = view.createRelationEntityNode(element, ss, ts);
            frame.children?.push(node);
            semantic2diagram.set(element, node);
            this.addClassifierFeatures(
              element,
              node,
              semantic2diagram,
              view,
              graph,
              frame,
              scope
            );
            return node;
          } else {
            const edge = view.createRelationEntityEdge(element, ss, ts);
            frame.children?.push(edge);
            semantic2diagram.set(element, edge);
            this.addClassifierFeatures(
              element,
              edge,
              semantic2diagram,
              view,
              graph,
              frame,
              scope
            );
            return edge;
          }
        }
      }

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
            const node: OmlNode = view.createRelationInstanceNode(
              element,
              source,
              target
            );

            frame.children?.push(node);
            semantic2diagram.set(element, node);
            this.addInstanceFeatures(
              element,
              node,
              semantic2diagram,
              view,
              frame,
              scope
            );
            return node;
          } else {
            const edge: SEdge = view.createRelationInstanceEdge(
              element,
              source,
              target
            );
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

  private showAxiom(
    entity: Entity,
    axiom: Axiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ): void {
    if (!isExpanded(frame)) return;

    if (isSpecializationAxiom(axiom)) {
      this.showSpecializationAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isKeyAxiom(axiom)) {
      this.showKeyAxiomInternal(entity, axiom, frame, semantic2diagram, view);
    } else if (isScalarPropertyRangeRestrictionAxiom(axiom)) {
      this.showScalarPropertyRangeRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isScalarPropertyCardinalityRestrictionAxiom(axiom)) {
      this.showScalarPropertyCardinalityRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isScalarPropertyValueRestrictionAxiom(axiom)) {
      this.showScalarPropertyValueRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isStructuredPropertyRangeRestrictionAxiom(axiom)) {
      this.showStructuredPropertyRangeRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isStructuredPropertyCardinalityRestrictionAxiom(axiom)) {
      this.showStructuredPropertyCardinalityRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isStructuredPropertyValueRestrictionAxiom(axiom)) {
      this.showStructuredPropertyValueRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isRelationRangeRestrictionAxiom(axiom)) {
      this.showRelationRangeRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isRelationCardinalityRestrictionAxiom(axiom)) {
      this.showRelationCardinalityRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else if (isRelationTargetRestrictionAxiom(axiom)) {
      this.showRelationTargetRestrictionAxiomInternal(
        entity,
        axiom,
        frame,
        semantic2diagram,
        view
      );
    } else {
      //Todo: fix this error
      throw new Error(
        "showAxiom: unhandled case for entity: " +
          entity.name +
          " and axiom: " +
          axiom.$type
      );
    }
  }

  // TODO: missing getAbbreviatedIri function for Concepts

  private showSpecializationAxiomInternal(
    entity: Entity,
    axiom: SpecializationAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const specializingNode = semantic2diagram.get(entity);
    if (!specializingNode)
      throw new Error(
        "no entity node for showAxiom(SpecializationAxiom): " +
          getAbbreviatedIri(entity)
      );
    const owningTerm = axiom.specializedTerm?.ref;
    console.log("owningTerm?.name");
    /*     console.log(owningTerm);
    console.log(axiom.owningTerm?.ref?.name); */
    console.log(axiom);
    console.log(entity);
    console.log(axiom.specializedTerm);
/*     console.log(entity.$container);
    console.log(specializingNode.id); */
    const specializedNode = owningTerm
      ? semantic2diagram.get(owningTerm)
      : null;
    if (!specializedNode)
      throw new Error(
        "no entity node for showAxiom(SpecializationAxiom): " +
          (owningTerm ? getAbbreviatedIri(owningTerm) : "")
      );
    console.log(specializedNode.id);

    const edge = view.createSpecializationAxiomEdge(
      axiom,
      specializingNode,
      specializedNode
    );
    frame.children?.push(edge);
    semantic2diagram.set(axiom, edge);
  }

  private showKeyAxiomInternal(
    entity: Entity,
    axiom: KeyAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const node = semantic2diagram.get(entity);
    if (!node)
      throw new Error(
        "no entity node for showAxiom(KeyAxiom): " + getAbbreviatedIri(entity)
      );

    let compartment = view.getAxiomCompartment(node);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      node?.children?.push(compartment);
    }
    const label = view.createKeyAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showScalarPropertyRangeRestrictionAxiomInternal(
    entity: Entity,
    axiom: ScalarPropertyRangeRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(ScalarPropertyRangeRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createRangeRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showScalarPropertyCardinalityRestrictionAxiomInternal(
    entity: Entity,
    axiom: ScalarPropertyCardinalityRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(ScalarPropertyCardinalityRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createCardinalityRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showScalarPropertyValueRestrictionAxiomInternal(
    entity: Entity,
    axiom: ScalarPropertyValueRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(ScalarPropertyValueRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createValueRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showStructuredPropertyRangeRestrictionAxiomInternal(
    entity: Entity,
    axiom: StructuredPropertyRangeRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(StructuredPropertyRangeRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createRangeRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showStructuredPropertyCardinalityRestrictionAxiomInternal(
    entity: Entity,
    axiom: StructuredPropertyCardinalityRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(StructuredPropertyCardinalityRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createCardinalityRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showStructuredPropertyValueRestrictionAxiomInternal(
    entity: Entity,
    axiom: StructuredPropertyValueRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(StructuredPropertyValueRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    let compartment = view.getAxiomCompartment(source);
    if (!compartment) {
      compartment = view.createAxiomCompartment(entity);
      source?.children?.push(compartment);
    }
    const label = view.createValueRestrictionAxiomLabel(entity, axiom);
    compartment.children?.push(label);
    semantic2diagram.set(axiom, label);
  }

  private showRelationRangeRestrictionAxiomInternal(
    entity: Entity,
    axiom: RelationRangeRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(RelationRangeRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    const range = axiom.range?.ref;
    let target = range ? semantic2diagram.get(range) : null;
    if (!target) {
      throw new Error(
        "no entity node for showAxiom(RelationRangeRestrictionAxiom): " +
          (range ? getAbbreviatedIri(range) : "")
      );
    }
    const edge = view.createRelationRangeRestrictionAxiomEdge(
      axiom,
      source,
      target
    );
    frame.children?.push(edge);
    semantic2diagram.set(axiom, edge);
  }

  private showRelationCardinalityRestrictionAxiomInternal(
    entity: Entity,
    axiom: RelationCardinalityRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(RelationCardinalityRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    const range = axiom.range?.ref;
    let target = axiom.range?.ref
      ? semantic2diagram.get(axiom.range?.ref)
      : null;
    if (!target) {
      throw new Error(
        "no entity node for showAxiom(RelationCardinalityRestrictionAxiom): " +
          (range ? getAbbreviatedIri(range) : "")
      );
    }
    const edge = view.createRelationCardinalityRestrictionAxiomEdge(
      axiom,
      source,
      target
    );
    frame.children?.push(edge);
    semantic2diagram.set(axiom, edge);
  }

  private showRelationTargetRestrictionAxiomInternal(
    entity: Entity,
    axiom: RelationTargetRestrictionAxiom,
    frame: OmlNode,
    semantic2diagram: Map<AstNode, SModelElement>,
    view: OmlOntologyDiagramView
  ) {
    const source = semantic2diagram.get(entity);
    if (!source)
      throw new Error(
        "no entity node for showAxiom(RelationTargetRestrictionAxiom): " +
          getAbbreviatedIri(entity)
      );
    const trg = axiom.target.ref;
    let target = trg ? semantic2diagram.get(trg) : null;
    if (!target) {
      throw new Error(
        "no entity node for showAxiom(RelationTargetRestrictionAxiom): " +
          (trg ? getAbbreviatedIri(trg) : "")
      );
    }
    const edge = view.createRelationTargetRestrictionAxiomEdge(
      axiom,
      source,
      target
    );
    frame.children?.push(edge);
    semantic2diagram.set(axiom, edge);
  }

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
            let comp: SCompartment | undefined =
              view.getPropertyCompartment(node);
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
              const edge: SEdge = view.createStructuredPropertyEdge(
                cls,
                f,
                source,
                target
              );
              frame.children?.push(edge);
              semantic2diagram.set(f, edge);
            }
          }
        });
  }

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
            let comp: SCompartment | undefined =
              view.getPropertyCompartment(node);
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
