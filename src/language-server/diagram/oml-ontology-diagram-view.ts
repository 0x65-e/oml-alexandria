import { IdCache } from "langium-sprotty";
import {
    ModelLayoutOptions,
    SCompartment,
    SEdge,
    SGraph,
    SLabel,
    SModelElement,
    SNode,
    SShapeElement,
} from "sprotty-protocol";
import {
    Aspect,
    Classifier,
    Concept,
    ConceptInstance,
    Entity,
    Import,
    isScalarPropertyValueRestrictionAxiom,
    Member,
    NamedInstance,
    Ontology,
    RelationCardinalityRestrictionAxiom,
    RelationEntity,
    RelationInstance,
    RelationRangeRestrictionAxiom,
    RelationTargetRestrictionAxiom,
    Rule,
    Scalar,
    ScalarProperty,
    ScalarPropertyCardinalityRestrictionAxiom,
    ScalarPropertyRangeRestrictionAxiom,
    ScalarPropertyValueAssertion,
    ScalarPropertyValueRestrictionAxiom,
    SpecializationAxiom,
    Structure,
    StructuredProperty,
    StructuredPropertyCardinalityRestrictionAxiom,
    StructuredPropertyRangeRestrictionAxiom,
    StructuredPropertyValueRestrictionAxiom,
} from "../generated/ast";
import {
    ModuleNode_ModuleNodeView,
    OmlDiagram_SGraphView,
    OmlEdge_ImportEdgeView,
    OmlEdge_PolylineEdgeView,
    OmlEdge_RelationshipArrowEdgeView,
    OmlEdge_RestrictsArrowEdgeView,
    OmlEditableLabel_SLabelView,
    OmlNode_ClassNodeView,
    SCompartment_HeaderCompartmentView,
    SCompartment_SCompartmentView,
    SLabel_RelationshipLabelView,
    SLabel_RestrictsLabelView,
    SLabel_SLabelView_classHeader,
    SLabel_SLabelView_heading,
    SLabel_SLabelView_tag,
    SLabel_SLabelView_text,
    Tag_TagView,
} from "./oml-diagram-module";

export interface OmlNode extends SNode {
    expanded?: boolean;
}

export interface OmlTag extends SShapeElement {
    layout?: string;
}

export class OmlOntologyDiagramView {
    readonly ontology: Ontology;
    readonly idCache: IdCache;

    constructor(ontology: Ontology, idCache: IdCache) {
        this.ontology = ontology;
        this.idCache = idCache;
    }

    createGraph(): SGraph {
        const id: string = this.idCache.uniqueId("root");
        return {
            id: id,
            type: OmlDiagram_SGraphView,
            children: [],
            layoutOptions: <ModelLayoutOptions>{
                hAlign: "left",
                hGap: 10.0,
            },
        };
    }

    createOntologyNode(ontology: Ontology): OmlNode {
        const id: string = this.idCache.uniqueId(ontology.prefix, ontology);
        const node: OmlNode = {
            id: id,
            type: ModuleNode_ModuleNodeView,
            children: [
                <SCompartment>{
                    id: id + ".heading",
                    type: SCompartment_SCompartmentView,
                    layout: "vbox",
                    layoutOptions: makeLayoutOptions(5.0),
                    children: [
                        <SLabel>{
                            id: id + ".label",
                            type: SLabel_SLabelView_heading,
                            text: id,
                        },
                    ],
                },
            ],
        };

        if (ontology === this.ontology) {
            // TODO: Can't find SButton class analog
            node.expanded = true;
        }

        return node;
    }

    private createMemberNode(member: Member, tag: string): OmlNode {
        const id: string = this.idCache.uniqueId(member.name, member);
        return {
            id: id,
            type: OmlNode_ClassNodeView,
            cssClasses: ["moduleNode"],
            layout: "vbox",
            layoutOptions: makeLayoutOptions(0.0),
            children: [newTaggedHeader(id, tag, member.name)],
        };
    }

    createAspectNode(aspect: Aspect): OmlNode {
        return this.createMemberNode(aspect, "A");
    }

    createConceptNode(concept: Concept): OmlNode {
        return this.createMemberNode(concept, "C");
    }

    createRelationEntityNode(entity: RelationEntity, from: SModelElement, to: SModelElement): OmlNode {
        const node: OmlNode = this.createMemberNode(entity, "R");
        node.children?.push(
            newEdge(from, node, node.id + ".start", OmlEdge_PolylineEdgeView),
            newEdge(node, to, node.id + ".end", OmlEdge_RelationshipArrowEdgeView)
        );
        return node;
    }

    createSourceNode(entity: RelationEntity, to: SModelElement): OmlNode {
        const node: OmlNode = this.createMemberNode(entity, "R");
        node.children?.push(newEdge(node, to, node.id + ".end", OmlEdge_RelationshipArrowEdgeView));
        return node;
    }

    createTargetNode(entity: RelationEntity, from: SModelElement): OmlNode {
        const node: OmlNode = this.createMemberNode(entity, "R");
        node.children?.push(newEdge(from, node, node.id + ".start", OmlEdge_PolylineEdgeView));
        return node;
    }

    createStructureNode(structure: Structure): OmlNode {
        return this.createMemberNode(structure, "S");
    }

    createScalarNode(scalar: Scalar): OmlNode {
        return this.createMemberNode(scalar, "SC");
    }

    createRuleNode(rule: Rule): OmlNode {
        const id: string = this.idCache.uniqueId(rule.name, rule);
        return {
            id: id,
            type: OmlNode_ClassNodeView,
            cssClasses: ["moduleNode"],
            layout: "vbox",
            layoutOptions: makeLayoutOptions(0.0),
            children: [newTaglessHeader(id)],
        };
    }

    createConceptInstanceNode(ci: ConceptInstance): OmlNode {
        // TODO: missing getAbbreviatedIri function for Concepts
        //const text: string = ci.name + ": " + ",".join(ci.ownedTypes.map(a => a.type.ref?.)
        const text: string = ci.name + ": ";
        const id: string = this.idCache.uniqueId(text, ci);
        return {
            id: id,
            type: OmlNode_ClassNodeView,
            cssClasses: ["moduleNode"],
            layout: "vbox",
            layoutOptions: makeLayoutOptions(0.0),
            children: [newTaggedHeader(id, "CI", text)],
        };
    }

    createRelationInstanceNode(ri: RelationInstance, from: SModelElement, to: SModelElement): OmlNode {
        // TODO: missing getAbbreviatedIri function for Concepts
        //const text: string = ci.name + ": " + ",".join(ci.ownedTypes.map(a => a.type.ref?.)
        const text: string = ri.name + ": ";
        const id: string = this.idCache.uniqueId(text, ri);
        const node: OmlNode = {
            id: id,
            type: OmlNode_ClassNodeView,
            cssClasses: ["moduleNode"],
            layout: "vbox",
            layoutOptions: makeLayoutOptions(0.0),
            children: [newTaggedHeader(id, "RI", text)],
        };
        node.children?.push(
            newEdge(from, node, id + ".start", OmlEdge_PolylineEdgeView),
            newEdge(node, to, id + ".end", OmlEdge_RelationshipArrowEdgeView)
        );
        return node;
    }

    /* Compartments */

    getAxiomCompartment(element: SModelElement): SCompartment | undefined {
        if (element.children == undefined) return undefined;
        return element.children.find((it) => it.id.endsWith(".axiom.compartment"));
    }

    createAxiomCompartment(classifier: Classifier): SCompartment {
        const id: string = this.idCache.getId(classifier) + ".axiom.compartment";
        return newCompartment(id, SCompartment_SCompartmentView);
    }

    getPropertyCompartment(element: SModelElement): SCompartment | undefined {
        if (element.children == undefined) return undefined;
        return element.children.find((it) => it.id.endsWith(".property.compartment"));
    }

    createPropertyCompartment(classifier: Classifier): SCompartment {
        const id: string = this.idCache.getId(classifier) + ".property.compartment";
        return newCompartment(id, SCompartment_SCompartmentView);
    }

    createNamedPropertyCompartment(instance: NamedInstance): SCompartment {
        const id: string = this.idCache.getId(instance) + ".property.compartment";
        return newCompartment(id, SCompartment_SCompartmentView);
    }

    getAntecedentCompartment(element: SModelElement): SCompartment | undefined {
        if (element.children == undefined) return undefined;
        return element.children.find((it) => it.id.endsWith(".antecendent.compartment"));
    }

    createAntecedentCompartment(rule: Rule): SCompartment {
        const id: string = this.idCache.getId(rule) + ".antecedent.compartment";
        return newCompartment(id, SCompartment_SCompartmentView);
    }

    getConsequentCompartment(element: SModelElement): SCompartment | undefined {
        if (element.children == undefined) return undefined;
        return element.children.find((it) => it.id.endsWith(".consequent.compartment"));
    }

    createConsequentCompartment(rule: Rule): SCompartment {
        const id: string = this.idCache.getId(rule) + ".consequent.compartment";
        return newCompartment(id, SCompartment_SCompartmentView);
    }

    // TODO: getConsequentCompartment and createConsequentCompartment

    /* Labels */

    createScalarPropertyLabel(cls: Classifier, property: ScalarProperty): SLabel {
        return {
            id: this.idCache.uniqueId(cls.name + ".scalar." + property.name, property),
            type: SLabel_SLabelView_text,
            text: property.name + ": " + property.range.ref?.name,
        };
    }

    /*createKeyAxiomLabel(entity: Entity, ax: KeyAxiom): SLabel {
        // TODO: need getAbbreviatedIri function for this one
    }*/

    createRangeRestrictionAxiomLabel(
        entity: Entity,
        ax: ScalarPropertyRangeRestrictionAxiom | StructuredPropertyRangeRestrictionAxiom
    ): SLabel {
        return {
            id: this.idCache.uniqueId(entity.name + ".rangeRestriction." + ax.property.ref?.name, ax),
            type: SLabel_SLabelView_text,
            text: ax.property.ref?.name + " ⊂ " + ax.range.ref?.name,
        };
    }

    createCardinalityRestrictionAxiomLabel(
        entity: Entity,
        ax: ScalarPropertyCardinalityRestrictionAxiom | StructuredPropertyCardinalityRestrictionAxiom
    ): SLabel {
        let notation: string;
        switch (ax.kind) {
            case "exactly":
                notation = " = ";
                break;
            case "min":
                notation = " ≥ ";
                break;
            case "max":
                notation = " ≤ ";
                break;
        }
        return {
            id: this.idCache.uniqueId(entity.name + ".cardinalityRestriction." + ax.property.ref?.name),
            type: SLabel_SLabelView_text,
            text: "⎸" + ax.property.ref?.name + "⎹" + notation + ax.cardinality.value.toString(),
        };
    }

    createValueRestrictionAxiomLabel(
        entity: Entity,
        ax: ScalarPropertyValueRestrictionAxiom | StructuredPropertyValueRestrictionAxiom
    ): SLabel {
        return {
            id: this.idCache.uniqueId(entity.name + ".valueRestriction." + ax.property.ref?.name, ax),
            type: SLabel_SLabelView_text,
            text:
                ax.property.ref?.name +
                " = " +
                (isScalarPropertyValueRestrictionAxiom(ax) ? ax.value.value.toString() : ax.value.type?.ref?.name),
        };
    }

    // TODO: createAntecedantLabel

    // TODO: createConsequentLabel

    // TODO: toText

    createValueAssertionLabel(i: NamedInstance, ax: ScalarPropertyValueAssertion): SLabel {
        return {
            id: this.idCache.uniqueId(i.name + ".valueAssertion." + ax.property.ref?.name, ax),
            type: SLabel_SLabelView_text,
            text: ax.property.ref?.name + " = " + ax.value.value.toString(),
        };
    }

    /* Edges */

    createImportEdge(_import: Import, from: SModelElement, to: SModelElement): SEdge {
        const id: string = this.idCache.uniqueId(from.id + ".imports." + to.id);
        return {
            id: id,
            type: OmlEdge_ImportEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".label",
                    type: SLabel_SLabelView_text,
                    text: "imports",
                },
            ],
        };
    }

    createSpecializationAxiomEdge(axiom: SpecializationAxiom, from: SModelElement, to: SModelElement): SEdge {
        return {
            id: this.idCache.uniqueId(from.id + ".specializes." + to.id, axiom),
            type: OmlEdge_ImportEdgeView,
            sourceId: from.id,
            targetId: to.id,
        };
    }

    // TODO: This will be a problem, because a ForwardRelation isn't always defined (problem with the grammar)
    /*
    createRelationEntityEdge(entity: RelationEntity, from: SModelElement, to: SModelElement): SEdge {
        const id: string = this.idCache.uniqueId(entity.forwardRelation?.name, entity);
        return {
            id: id,
            type: OmlEdge_RelationshipArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".forward.label",
                    type: SLabel_RelationshipLabelView,
                    text: entity.forwardRelation?.name
                }
            ]
        }
    }
    */

    createRelationCardinalityRestrictionAxiomEdge(
        axiom: RelationCardinalityRestrictionAxiom,
        from: SModelElement,
        to: SModelElement
    ): SEdge {
        const id: string = this.idCache.uniqueId(from.id + ".restrictsCardinality." + axiom.relation.ref?.name, axiom);
        let notation: string;
        switch (axiom.kind) {
            case "exactly":
                notation = " = ";
                break;
            case "min":
                notation = " ≥ ";
                break;
            case "max":
                notation = " ≤ ";
                break;
        }
        return {
            id: id,
            type: OmlEdge_RestrictsArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".label",
                    type: SLabel_RestrictsLabelView,
                    text: "⎸" + axiom.relation.ref?.name + "⎹" + notation + axiom.cardinality.value.toString(),
                },
            ],
        };
    }

    createRelationRangeRestrictionAxiomEdge(
        axiom: RelationRangeRestrictionAxiom,
        from: SModelElement,
        to: SModelElement
    ): SEdge {
        const id: string = this.idCache.uniqueId(from.id + ".restrictsRange." + axiom.relation.ref?.name, axiom);
        return {
            id: id,
            type: OmlEdge_RestrictsArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".label",
                    type: SLabel_RestrictsLabelView,
                    text: (axiom.kind == "all" ? "∀" : "∃") + axiom.relation.ref?.name,
                },
            ],
        };
    }

    createRelationTargetRestrictionAxiomEdge(
        axiom: RelationTargetRestrictionAxiom,
        from: SModelElement,
        to: SModelElement
    ): SEdge {
        const id: string = this.idCache.uniqueId(from.id + ".restrictsTarget." + axiom.relation.ref?.name, axiom);
        return {
            id: id,
            type: OmlEdge_RestrictsArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".label",
                    type: SLabel_RestrictsLabelView,
                    text: axiom.relation.ref?.name + " ⊂ ",
                },
            ],
        };
    }

    createStructuredPropertyEdge(
        cls: Classifier,
        property: StructuredProperty,
        from: SModelElement,
        to: SModelElement
    ): SEdge {
        const id: string = this.idCache.uniqueId(cls.name + ".structured-property." + property.name, property);
        return {
            id: id,
            type: OmlEdge_RestrictsArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".label",
                    type: SLabel_SLabelView_text,
                    text: property.name,
                },
            ],
        };
    }

    createRelationInstanceEdge(ri: RelationInstance, from: SModelElement, to: SModelElement): SEdge {
        const id: string = this.idCache.uniqueId(ri.name, ri);
        return {
            id: id,
            type: OmlEdge_RestrictsArrowEdgeView,
            sourceId: from.id,
            targetId: to.id,
            children: [
                <SLabel>{
                    id: id + ".forward.label",
                    type: SLabel_RelationshipLabelView,
                    text: ri.name,
                },
            ],
        };
    }
}

/* Helper Functions */

function makeLayoutOptions(padding: number): ModelLayoutOptions {
    return {
        paddingTop: padding,
        paddingBottom: padding,
        paddingLeft: padding,
        paddingRight: padding,
    };
}

function newTaggedHeader(id: string, tag: string, label: string): SCompartment {
    return {
        id: id + ".header",
        type: SCompartment_HeaderCompartmentView,
        layout: "hbox",
        layoutOptions: makeLayoutOptions(8.0),
        children: [
            <OmlTag>{
                id: id + ".header.tag",
                type: Tag_TagView,
                layout: "stack",
                layoutOptions: {
                    resizeContainer: true,
                    hAlign: "center",
                    vAlign: "center",
                },
                children: [
                    <SLabel>{
                        id: id + ".tag.text",
                        type: SLabel_SLabelView_tag,
                        text: tag,
                    },
                ],
            },
            <SLabel>{
                id: id + ".header.label",
                type: OmlEditableLabel_SLabelView,
                text: label,
            },
        ],
    };
}

function newTaglessHeader(id: string): OmlTag {
    return <OmlTag>{
        id: id + ".header",
        type: SCompartment_HeaderCompartmentView,
        layout: "hbox",
        layoutOptions: makeLayoutOptions(8.0),
        children: [
            <SLabel>{
                id: id + ".header.label",
                type: SLabel_SLabelView_classHeader,
                text: id,
            },
        ],
    };
}

function newEdge(from: SModelElement, to: SModelElement, edgeId: string, edgeType: string): SEdge {
    return {
        id: edgeId,
        type: edgeType,
        sourceId: from.id,
        targetId: to.id,
    };
}

function newCompartment(id: string, type: string): SCompartment {
    return {
        id: id,
        type: type,
        layout: "vbox",
        layoutOptions: {
            paddingTop: 12.0,
            paddingBottom: 12.0,
            paddingLeft: 12.0,
            paddingRight: 12.0,
            vGap: 2.0,
        },
        children: [],
    };
}
