import { AstNode } from "langium";
import {
    Aspect,
    Assertion,
    Axiom,
    Classifier,
    Concept,
    Entity,
    Feature,
    isAspect,
    isAspectReference,
    isAssertion,
    isAxiom,
    isClassifier,
    isConcept,
    isConceptInstance,
    isConceptInstanceReference,
    isConceptReference,
    isDescription,
    isKeyAxiom,
    isNamedInstance,
    isRelationCardinalityRestrictionAxiom,
    isRelationEntity,
    isRelationEntityReference,
    isRelationInstance,
    isRelationInstanceReference,
    isRelationRangeRestrictionAxiom,
    isRelationTargetRestrictionAxiom,
    isReverseRelation,
    isScalar,
    isScalarProperty,
    isScalarPropertyRestrictionAxiom,
    isSemanticProperty,
    isSpecializationAxiom,
    isStructure,
    isStructuredProperty,
    isStructuredPropertyRestrictionAxiom,
    isStructureInstance,
    isStructureReference,
    isType,
    isVocabulary,
    NamedInstance,
    Ontology,
    RelationEntity,
    Scalar,
    ScalarProperty,
    SemanticProperty,
    Structure,
    StructuredProperty,
    StructureInstance,
} from "../generated/ast";
import {
    findAllSuperTerms,
    findKeys,
    findLinkAssertions,
    findPropertyRestrictions,
    findPropertyValueAssertions,
    findRelationInstancesWithSource,
    findRelationRangeRestrictionAxiomsWithRange,
    findRelationRestrictions,
    findSemanticPropertiesWithDomain,
    findSourceRelations,
    findSpecializationsWithSubTerm,
    findSpecializationsWithSuperTerm,
    findTargetRelations,
} from "../util/oml-search";

export interface OmlOntologyDiagramScope {
    readonly scalarProperties: Map<Classifier, Set<ScalarProperty>>;
    readonly structuredProperties: Map<Classifier, Set<StructuredProperty>>;
    readonly entityAxioms: Map<Entity, Set<Axiom>>;

    readonly instanceAssertions: Map<NamedInstance, Set<AstNode>>;

    scope: () => Set<AstNode>;
}

enum Mode {
    // Find all classifiers
    Phase1 = 0,
    // Figure out which features (incl. inherited) must be included
    Phase2,
}

export class OmlOntologyDiagramScopeComputation implements OmlOntologyDiagramScope {
    private readonly ontology: Ontology | undefined;
    private readonly allImportedOntologies: Set<Ontology> = new Set();
    private readonly allImportedElements: Set<AstNode> = new Set();
    private mode: Mode = Mode.Phase1;
    private readonly aspects: Map<Aspect, Set<AstNode>> = new Map();
    private readonly concepts: Map<Concept, Set<AstNode>> = new Map();
    private readonly relationEntities: Map<RelationEntity, Set<AstNode>> = new Map();
    private readonly relationIncidentElements: Map<RelationEntity, Set<AstNode>> = new Map();
    private readonly scalars: Map<Scalar, Set<AstNode>> = new Map();
    private readonly structures: Map<Structure, Set<AstNode>> = new Map();
    private readonly allSemanticProperties: Set<SemanticProperty> = new Set();

    readonly scalarProperties: Map<Classifier, Set<ScalarProperty>> = new Map();
    readonly structuredProperties: Map<Classifier, Set<StructuredProperty>> = new Map();
    readonly entityAxioms: Map<Entity, Set<Axiom>> = new Map();

    readonly instanceAssertions: Map<NamedInstance, Set<AstNode>> = new Map();

    private readonly structureAssertions: Map<StructureInstance, Set<Assertion>> = new Map();
    private readonly secondPhase: Set<AstNode> = new Set();

    constructor(ontology: Ontology | undefined) {
        this.ontology = ontology;
    }

    private includes(e: AstNode | undefined): boolean {
        if (isAspect(e)) return this.aspects.has(e);
        else if (isConcept(e)) return this.concepts.has(e);
        else if (isRelationEntity(e)) return this.relationEntities.has(e);
        else if (isScalar(e)) return this.scalars.has(e);
        else if (isStructure(e)) return this.structures.has(e);
        else if (isSemanticProperty(e)) return this.allSemanticProperties.has(e);
        else if (isNamedInstance(e)) return this.instanceAssertions.has(e);
        else if (isStructureInstance(e)) return this.structureAssertions.has(e);
        else if (isSpecializationAxiom(e)) return this.includes(e.specializedTerm.ref) && this.includes(e.$container);
        else return false;
    }

    private analyzeOntology(ontology: Ontology | undefined): void {
        if (ontology != undefined) {
            this.allImportedOntologies.add(ontology);
            if (isVocabulary(ontology) || isDescription(ontology)) {
                if (ontology.ownedStatements) {
                    ontology.ownedStatements.forEach((stmt) => {
                        if (
                            isAxiom(stmt) ||
                            isType(stmt) ||
                            isSemanticProperty(stmt) ||
                            isNamedInstance(stmt) ||
                            isAssertion(stmt)
                        ) {
                            // TODO: Doesn't capture all Axioms (e.g. key axioms are not top-level statements) - not equivalent to ontology.eAllContents() in Java
                            this.allImportedElements.add(stmt);
                        }
                    });
                }
            }
        }
    }

    analyze(): OmlOntologyDiagramScope {
        this.analyzeOntology(this.ontology);
        // WARNING: We don't scan imported ontologies, because our Imports don't have a reference to the actual Ontology node.
        /*
        if (isVocabulary(this.ontology)) {
            if (this.ontology.ownedImports) this.ontology.ownedImports.forEach(i => this.analyzeOntology(i));
        }
        */

        if (isVocabulary(this.ontology) || isDescription(this.ontology)) {
            if (this.ontology.ownedStatements) {
                this.ontology.ownedStatements.forEach((e) => this.doSwitch(e)); // TODO: Not equivalent to eAllContents()
            }
        }

        this.mode = Mode.Phase2;
        this.secondPhase.forEach((e) => this.doSwitch(e));

        return this;
    }

    scope(): Set<AstNode> {
        const s: Set<AstNode> = new Set();
        for (let x of this.aspects.keys()) {
            s.add(x);
        }
        for (let x of this.concepts.keys()) {
            s.add(x);
        }
        for (let x of this.scalars.keys()) {
            s.add(x);
        }
        for (let x of this.structures.keys()) {
            s.add(x);
        }
        for (let x of this.relationEntities.keys()) {
            s.add(x);
        }
        for (let x of this.instanceAssertions.keys()) {
            s.add(x);
        }
        for (let x of this.structureAssertions.keys()) {
            s.add(x);
        }
        return s;
    }

    private phase1InitializeEntity(e: Entity): void {
        this.phase1InitializeClassifierProperties(e);
        if (!this.entityAxioms.has(e)) {
            this.entityAxioms.set(e, new Set<Axiom>());
        }
    }

    private phase1InitializeClassifierProperties(cls: Classifier): void {
        if (!this.scalarProperties.has(cls)) {
            this.scalarProperties.set(cls, new Set<ScalarProperty>());
        }
        if (!this.structuredProperties.has(cls)) {
            this.structuredProperties.set(cls, new Set<StructuredProperty>());
        }
        let supers: Array<Classifier> = findAllSuperTerms(cls, true).filter((t) =>
            isClassifier(t)
        ) as Array<Classifier>;
        supers
            .flatMap((c) => findSemanticPropertiesWithDomain(c))
            .filter((p) => this.allImportedElements.has(p))
            .forEach((p) => this.allSemanticProperties.add(p));
    }

    private phase2AddClassifierScalarProperty(cls: Classifier, p: ScalarProperty): void {
        this.scalarProperties.get(cls)?.add(p);
    }

    private phase2AddClassifierStructuredProperty(cls: Classifier, p: StructuredProperty): void {
        this.structuredProperties.get(cls)?.add(p);
    }

    private phase2ScanAllClassifierProperties(cls: Classifier): void {
        let supers: Array<Classifier> = findAllSuperTerms(cls, true).filter((t) =>
            isClassifier(t)
        ) as Array<Classifier>;
        supers.forEach((parent) => {
            findSemanticPropertiesWithDomain(parent).forEach((p) => {
                if (this.allImportedElements.has(p)) {
                    if (isScalarProperty(p)) {
                        if (this.includes(parent)) {
                            this.phase2AddClassifierScalarProperty(parent, p);
                        } else {
                            this.phase2AddClassifierScalarProperty(cls, p);
                        }
                    } else if (isStructuredProperty(p)) {
                        if (this.includes(parent)) {
                            this.phase2AddClassifierStructuredProperty(parent, p);
                        } else {
                            this.phase2AddClassifierStructuredProperty(cls, p);
                        }
                    }
                }
            });
        });
    }

    private phase1ScanEntityAxioms(e: Entity, others: Set<AstNode>): void {
        findKeys(e).forEach((ax) => {
            if (this.allImportedElements.has(ax)) {
                others.add(ax);
            }
        });
        findSpecializationsWithSubTerm(e).forEach((ax) => {
            if (this.allImportedElements.has(ax)) {
                others.add(ax);
            }
        });
        findPropertyRestrictions(e).forEach((ax) => {
            if (this.allImportedElements.has(ax)) {
                others.add(ax);
            }
        });
        findRelationRestrictions(e).forEach((ax) => {
            if (this.allImportedElements.has(ax)) {
                others.add(ax);
            }
        });
    }

    private phase2FilterEntityAxioms(e: Entity, others: Set<AstNode>): void {
        const ax: Set<Axiom> = this.entityAxioms.get(e) as Set<Axiom>;
        others.forEach((o) => {
            if (isKeyAxiom(o)) {
                let props: Array<Feature> = o.properties
                    .map((r) => r.ref)
                    .filter((f) => f != undefined) as Array<Feature>;
                if (props.every((p) => this.includes(p))) {
                    ax.add(o);
                }
            } else if (isSpecializationAxiom(o)) {
                if (this.includes(o.specializedTerm.ref)) {
                    ax.add(o);
                }
            } else if (isScalarPropertyRestrictionAxiom(o) || isStructuredPropertyRestrictionAxiom(o)) {
                if (this.includes(o.property.ref)) {
                    ax.add(o);
                }
            } else if (isRelationCardinalityRestrictionAxiom(o)) {
                if (o.relation.ref && this.includes(o.relation.ref.$container)) {
                    ax.add(o);
                }
            } else if (isRelationRangeRestrictionAxiom(o)) {
                if (o.relation.ref && this.includes(o.relation.ref.$container) && this.includes(o.range.ref)) {
                    ax.add(o);
                }
            } else if (isRelationTargetRestrictionAxiom(o)) {
                if (o.relation.ref && this.includes(o.relation.ref.$container) && this.includes(o.target.ref)) {
                    ax.add(o);
                }
            }
        });
    }

    private phase1ScanInstanceAssertions(i: NamedInstance, others: Set<AstNode>): void {
        findPropertyValueAssertions(i).forEach((ax) => {
            if (this.allImportedElements.has(ax)) {
                others.add(ax);
            }
        });
        findLinkAssertions(i).forEach((l) => {
            if (this.allImportedElements.has(l)) {
                others.add(l);
            }
        });
        findRelationInstancesWithSource(i).forEach((ri) => {
            if (this.allImportedElements.has(ri)) {
                others.add(ri);
            }
        });
    }

    doSwitch(element: AstNode): OmlOntologyDiagramScope {
        if (this.mode == Mode.Phase1 && this.includes(element)) return this;

        if (isAspect(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    this.phase1InitializeEntity(element);
                    if (!this.aspects.has(element)) {
                        this.aspects.set(element, new Set<AstNode>());
                    }
                    const others: Set<AstNode> | undefined = this.aspects.get(element);
                    if (others) this.phase1ScanEntityAxioms(element, others);
                    this.secondPhase.add(element);
                    break;
                case Mode.Phase2:
                    this.phase2ScanAllClassifierProperties(element);
                    const others2: Set<AstNode> | undefined = this.aspects.get(element);
                    if (others2) this.phase2FilterEntityAxioms(element, others2);
                    break;
            }
        } else if (isConcept(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    this.phase1InitializeEntity(element);
                    if (!this.concepts.has(element)) {
                        this.concepts.set(element, new Set<AstNode>());
                    }
                    const others: Set<AstNode> | undefined = this.concepts.get(element);
                    if (others) this.phase1ScanEntityAxioms(element, others);
                    this.secondPhase.add(element);
                    break;
                case Mode.Phase2:
                    this.phase2ScanAllClassifierProperties(element);
                    const others2: Set<AstNode> | undefined = this.concepts.get(element);
                    if (others2) this.phase2FilterEntityAxioms(element, others2);
                    break;
            }
        } else if (isRelationEntity(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    this.phase1InitializeEntity(element);
                    if (!this.relationEntities.has(element)) {
                        this.relationEntities.set(element, new Set<AstNode>());
                    }
                    if (!this.relationIncidentElements.has(element)) {
                        this.relationIncidentElements.set(element, new Set<AstNode>());
                    }
                    const others: Set<AstNode> = this.relationEntities.get(element) as Set<AstNode>;
                    const incident: Set<AstNode> = this.relationIncidentElements.get(element) as Set<AstNode>;
                    if (others) this.phase1ScanEntityAxioms(element, others);
                    if (element.source.ref) this.doSwitch(element.source.ref);
                    if (element.target.ref) this.doSwitch(element.target.ref);

                    findSpecializationsWithSuperTerm(element).forEach((ax) => {
                        if (this.allImportedElements.has(ax)) {
                            incident.add(ax);
                        }
                    });
                    findRelationRangeRestrictionAxiomsWithRange(element).forEach((ax) => {
                        if (this.allImportedElements.has(ax)) {
                            incident.add(ax);
                        }
                    });
                    findSourceRelations(element).forEach((r) => {
                        if (this.allImportedElements.has(r)) {
                            incident.add(r);
                        }
                    });
                    findTargetRelations(element).forEach((r) => {
                        if (this.allImportedElements.has(r)) {
                            incident.add(r);
                        }
                    });

                    this.secondPhase.add(element);
                    break;
                case Mode.Phase2:
                    this.phase2ScanAllClassifierProperties(element);
                    const others2: Set<AstNode> | undefined = this.relationEntities.get(element);
                    if (others2) this.phase2FilterEntityAxioms(element, others2);
                    break;
            }
        } else if (isScalar(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    if (!this.scalars.has(element)) {
                        this.scalars.set(element, new Set<AstNode>());
                    }
                    break;
                case Mode.Phase2:
                    break;
            }
        } else if (isStructure(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    this.phase1InitializeClassifierProperties(element);
                    if (!this.structures.has(element)) {
                        this.structures.set(element, new Set<AstNode>());
                    }
                    this.secondPhase.add(element);
                    break;
                case Mode.Phase2:
                    this.phase2ScanAllClassifierProperties(element);
                    break;
            }
        } else if (isConceptInstance(element) || isRelationInstance(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    if (!this.instanceAssertions.has(element)) {
                        this.instanceAssertions.set(element, new Set<AstNode>());
                    }
                    const others: Set<AstNode> | undefined = this.instanceAssertions.get(element);
                    if (others) this.phase1ScanInstanceAssertions(element, others);
                    break;
                case Mode.Phase2:
                    break;
            }
        } else if (isStructureInstance(element)) {
            switch (this.mode) {
                case Mode.Phase1:
                    if (!this.structureAssertions.has(element)) {
                        this.structureAssertions.set(element, new Set<Assertion>());
                    }
                    break;
                case Mode.Phase2:
                    break;
            }
        } else if (isAspectReference(element)) {
            if (element.aspect.ref) return this.doSwitch(element.aspect.ref);
        } else if (isConceptReference(element)) {
            if (element.concept.ref) return this.doSwitch(element.concept.ref);
        } else if (isRelationEntityReference(element)) {
            if (element.entity.ref) return this.doSwitch(element.entity.ref);
        } else if (isStructureReference(element)) {
            if (element.structure.ref) return this.doSwitch(element.structure.ref);
        } else if (isConceptInstanceReference(element) || isRelationInstanceReference(element)) {
            if (element.instance.ref) return this.doSwitch(element.instance.ref);
        }
        return this;
    }
}
