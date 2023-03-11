import { AstNode } from "langium";
import {
    Aspect,
    AspectReference,
    Assertion,
    Axiom,
    Classifier,
    Concept,
    ConceptInstance,
    ConceptInstanceReference,
    ConceptReference,
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
    RelationEntityReference,
    RelationInstance,
    RelationInstanceReference,
    Scalar,
    ScalarProperty,
    SemanticProperty,
    Structure,
    StructuredProperty,
    StructureInstance,
    StructureReference,
} from "../generated/ast";

export interface OmlOntologyDiagramScope {
    readonly scalarProperties: Map<Classifier, Set<ScalarProperty>>;
    readonly structuredProperties: Map<Classifier, Set<StructuredProperty>>;
    readonly entityAxioms: Map<Entity, Set<Axiom>>;

    readonly instanceAssertions: Map<NamedInstance, Set<AstNode>>;
}
enum Mode{
    Phase1=0,
    Phase2
}
export class OmlOntologyDiagramScopeComputation implements OmlOntologyDiagramScope {
    private readonly ontology: Ontology | undefined;
    private readonly allImportedOntologies: Set<Ontology> = new Set();
    private readonly allImportedElements: Set<AstNode> = new Set();
    private mode:Mode=Mode.Phase1;
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

    public analyze(): OmlOntologyDiagramScope {
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
    public scope():Set<AstNode>{
        let s:Set<AstNode> = new Set();
        for(let x of this.aspects.keys()){s.add(x);}
        for(let x of this.concepts.keys()){s.add(x);}
        for(let x of this.scalars.keys()){s.add(x);}
        for(let x of this.structures.keys()){s.add(x);}
        for(let x of this.relationEntities.keys()){s.add(x);}
        for(let x of this.instanceAssertions.keys()){s.add(x);}
        for(let x of this.structureAssertions.keys()){s.add(x);}
        return s;
        

    }
    private phase1InitializeEntity(e:Entity) :void{
		this.phase1InitializeClassifierProperties(e);
		if (!this.entityAxioms.has(e)) {
			this.entityAxioms.set(e, new Set<Axiom>());
		}
	}
    private phase1InitializeClassifierProperties(cls: Classifier){
        if(!this.scalarProperties.has(cls)){
            this.scalarProperties.set(cls, new Set<ScalarProperty>());
        }
        //TODO: OmlSearch - not sure how to translate
    }
    private phase2AddClassifierScalarProperty(cls: Classifier,p:ScalarProperty):void {
		this.scalarProperties.get(cls)?.add(p);
	}
    private phase2AdClassifierStructuredProperty(cls: Classifier,p:StructuredProperty):void {
		this.structuredProperties.get(cls)?.add(p);
	}
    //TODO: phase2ScanAllClassifierProperties & Axioms
    //No clue how to do nested class in TS- creating the funcs for later
    /*
    public caseAspect(a:Aspect):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				this.phase1InitializeEntity(a);
				if (!this.aspects.has(a)) {
					this.aspects.set(a, new Set());
				}
				let others:Set<AstNode> |undefined = this.aspects.get(a);
				this.phase1ScanEntityAxioms(a, others);
				this.secondPhase.add(a);
				break;
			case Mode.Phase2:
				this.phase2ScanAllClassifierProperties(a);
				this.phase2FilterEntityAxioms(a, this.aspects.get(a));
				break;
		}
        return this
    }

    public caseConcept(c:Concept):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				this.phase1InitializeEntity(c);
				if (!this.concepts.has(c)) {
					this.concepts.set(c, new Set());
				}
				let others:Set<AstNode> |undefined = this.concepts.get(c);
				this.phase1ScanEntityAxioms(c, others);
				this.secondPhase.add(c);
				break;
			case Mode.Phase2:
				this.phase2ScanAllClassifierProperties(c);
				this.phase2FilterEntityAxioms(c, this.concepts.get(c));
				break;
		}
        return this
    }
    //TODO: relation entity
    public caseScalar(s:Scalar):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				if (!this.scalars.has(s)) {
					this.scalars.set(s, new Set());
				}
				break;
			case Mode.Phase2:
				break;
		}
        return this
    }
    public caseStructure(s:Structure):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				this.phase1InitializeClassifierProperties(s);
				if (!this.structures.has(s)) {
					this.structures.set(s, new Set());
				}
				this.secondPhase.add(s);
				break;
			case Mode.Phase2:
				this.phase2ScanAllClassifierProperties(s);
				break;
		}
        return this
    }
    //TODO phase1ScanInstanceAssertions
    public caseConceptInstance(ci:ConceptInstance):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				if (!this.instanceAssertions.has(ci)) {
					this.instanceAssertions.set(ci, new Set());
				}
				let others:Set<AstNode> |undefined = this.instanceAssertions.get(c);
				this.phase1ScanInstanceAssertions(ci, others);
				break;
			case Mode.Phase2:
				break;
		}
        return this
    }
    public caseRelationInstance(ri:RelationInstance):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				if (!this.instanceAssertions.has(ri)) {
					this.instanceAssertions.set(ri, new Set());
				}
				let others:Set<AstNode> |undefined = this.instanceAssertions.get(ri);
				this.phase1ScanInstanceAssertions(ri, others);
				break;
			case Mode.Phase2:
				break;
		}
        return this
    }
    public caseStructureInstance(si:StructureInstance):OmlOntologyDiagramScope{
        switch(this.mode){
            case Mode.Phase1:
				if (!this.structureAssertions.has(si)) {
					this.structureAssertions.set(si, new Set());
				}
				let others:Set<AstNode> |undefined = this.structureAssertions.get(si);
				this.phase1ScanInstanceAssertions(ri, others);
				break;
			case Mode.Phase2:
				break;
		}
        return this
    }
    public caseAspectReferenceInstance(a:AspectReference):OmlOntologyDiagramScope{
        return this.caseAspect(a.aspect);
    }
    public caseConceptReference(c:ConceptReference):OmlOntologyDiagramScope{
        return this.caseConcept(c.concept);
    }
    public caseRelationEntityReference(e:RelationEntityReference):OmlOntologyDiagramScope{
        return this.caseRelationEntity(e.entity);
    }
    public caseStructureRefence(s:StructureReference):OmlOntologyDiagramScope{
        return this.caseStructure(s.structure);
    }
    public caseConceptInstanceReference(ci:ConceptInstanceReference):OmlOntologyDiagramScope{
        return this.caseConceptInstance(ci.instance);
    }
    public caseRelationInstanceReference(ri:RelationInstanceReference):OmlOntologyDiagramScope{
        return this.caseRelationInstance(ri.instance);
    }
    */






}

