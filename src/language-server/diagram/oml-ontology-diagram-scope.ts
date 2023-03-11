import { AstNode } from "langium";
import {
    Aspect,
    Assertion,
    Axiom,
    Classifier,
    Concept,
    Entity,
    isAssertion,
    isAxiom,
    isDescription,
    isNamedInstance,
    isSemanticProperty,
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

export interface OmlOntologyDiagramScope {
    readonly scalarProperties: Map<Classifier, Set<ScalarProperty>>;
    readonly structuredProperties: Map<Classifier, Set<StructuredProperty>>;
    readonly entityAxioms: Map<Entity, Set<Axiom>>;

    readonly instanceAssertions: Map<NamedInstance, Set<AstNode>>;
}

export class OmlOntologyDiagramScopeComputation implements OmlOntologyDiagramScope {
    private readonly ontology: Ontology | undefined;
    private readonly allImportedOntologies: Set<Ontology> = new Set();
    private readonly allImportedElements: Set<AstNode> = new Set();

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

    private phase1(ontology: Ontology | undefined): void {
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
                            // TODO: Doesn't capture all Axioms (e.g. key axioms are not top-level statements) - not analogous to ontology.eAllContents() in Java
                            this.allImportedElements.add(stmt);
                        }
                    });
                }
            }
        }
    }

    analyze(): OmlOntologyDiagramScope {
        this.phase1(this.ontology);
        // TODO: Not sure how to handle OmlRead.getImportedOntology... our imports don't have the actual Ontology object
        /*
        if (isVocabulary(this.ontology)) {
            if (this.ontology.ownedImports) this.ontology.ownedImports.forEach(i => this.phase1(i));
        }
        */

        // TODO: visit each element

        // TODO: second phase

        return this;
    }
}
