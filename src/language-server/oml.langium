grammar Oml

//includes start

interface Ontology extends IdentifiedElement {
	namespace: string
	prefix: string
}

interface IdentifiedElement extends AnnotatedElement {
}

interface AnnotatedElement {
	ownedAnnotations: Annotation[]
}

// interface Element {
// }

interface Annotation {
	property: @AnnotationProperty
	value?: Literal
	referenceValue?: @Member
	//owningElement?: @AnnotatedElement
	//owningReference?: @OmlReference
}

interface AnnotationProperty extends Property, SpecializableTerm {
}

interface Property extends Feature {
}

interface Feature extends Term {
}

interface Term extends Member {
}

interface Member extends IdentifiedElement {
	name: string
}

interface SpecializableTerm extends Term, VocabularyStatement {
	ownedSpecializations: SpecializationAxiom[]
}

interface VocabularyStatement extends Statement {
	//owningVocabulary: @Vocabulary
}

interface Statement {
}

//interface Vocabulary extends VocabularyBox {
//	ownedImports: VocabularyImport[]
//	ownedStatements: VocabularyStatement[]
//}

interface VocabularyBox extends Ontology {
}

interface VocabularyImport extends Import {
	// owningVocabulary: @Vocabulary
}

interface Import extends AnnotatedElement {
	namespace: string
	prefix?: string
}

interface SpecializationAxiom extends Axiom {
	specializedTerm: @SpecializableTerm
	//owningTerm?: @SpecializableTerm
	//owningReference?: @SpecializableTermReference
}

interface Axiom {
}

interface OmlReference {
	ownedAnnotations: Annotation[]
}

interface SpecializableTermReference extends OmlReference, VocabularyStatement {
	ownedSpecializations: SpecializationAxiom[]
}

//interface VocabularyBundle extends VocabularyBox {
//	ownedImports: VocabularyBundleImport[]
//}

interface VocabularyBundleImport extends Import {
	// owningVocabularyBundle: @VocabularyBundle
}

interface DescriptionBox extends Ontology {
}

interface Description extends DescriptionBox {
	ownedImports: DescriptionImport[]
	ownedStatements: DescriptionStatement_Union[]
}

interface DescriptionImport extends Import {
	// owningDescription: @Description
}

interface DescriptionStatement extends Statement {
	//owningDescription: @Description
}

interface DescriptionBundle extends DescriptionBox {
	ownedImports: DescriptionBundleImport[]
}

interface DescriptionBundleImport extends Import {
	// owningDescriptionBundle: @DescriptionBundle
}

interface Type extends SpecializableTerm {
}

interface Classifier extends Type {
	ownedPropertyRestrictions: PropertyRestrictionAxiom[]
}

interface PropertyRestrictionAxiom extends RestrictionAxiom {
	//owningClassifier?: @Classifier
	//owningReference?: @ClassifierReference
}

interface RestrictionAxiom extends Axiom {
}

interface ClassifierReference extends SpecializableTermReference {
	ownedPropertyRestrictions: PropertyRestrictionAxiom[]
}

interface Entity extends Classifier {
	ownedRelationRestrictions: RelationRestrictionAxiom[]
	ownedKeys: KeyAxiom[]
}

interface RelationRestrictionAxiom extends RestrictionAxiom {
	relation: @Relation
	//owningEntity?: @Entity
	//owningReference?: @EntityReference
}

interface Relation extends Feature {
}

interface EntityReference extends ClassifierReference {
	ownedRelationRestrictions: RelationRestrictionAxiom[]
	ownedKeys: KeyAxiom[]
}

interface KeyAxiom extends Axiom {
	properties: @Feature[]
	//owningEntity?: @Entity
	//owningReference?: @EntityReference
}

interface Aspect extends Entity {
}

interface Concept extends Entity {
	enumeratedInstances: @ConceptInstance[]
}

/*
interface ConceptInstance extends NamedInstance {
	ownedTypes: ConceptTypeAssertion[]
}
*/

interface NamedInstance extends Member, Instance {
	ownedLinks: LinkAssertion[]
}

interface Instance {
	ownedPropertyValues: PropertyValueAssertion[]
}

interface PropertyValueAssertion extends Assertion {
	//owningInstance?: @Instance
	//owningReference?: @NamedInstanceReference
}

interface Assertion {
}

interface NamedInstanceReference extends OmlReference {
	ownedPropertyValues: PropertyValueAssertion[]
	ownedLinks: LinkAssertion[]
}

interface LinkAssertion extends Assertion {
	relation: @Relation
	target: @NamedInstance
	//owningInstance?: @NamedInstance
	//owningReference?: @NamedInstanceReference
}

interface ConceptTypeAssertion extends TypeAssertion {
	^type: @Concept
	//owningInstance?: @ConceptInstance
	//owningReference?: @ConceptInstanceReference
}

interface TypeAssertion extends Assertion {
}

interface ConceptInstanceReference extends NamedInstanceReference {
	instance: @ConceptInstance
	ownedTypes: ConceptTypeAssertion[]
}

interface RelationEntity extends Entity {
	source: @Entity
	target: @Entity
	forwardRelation?: ForwardRelation
	reverseRelation?: ReverseRelation
	functional: boolean
	inverseFunctional: boolean
	symmetric: boolean
	asymmetric: boolean
	reflexive: boolean
	irreflexive: boolean
	transitive: boolean
}

interface ForwardRelation extends Relation {
}

interface ReverseRelation extends Relation {
}

interface Structure extends Classifier {
}

interface SemanticProperty extends Property {
}

interface ScalarProperty extends SemanticProperty, SpecializableTerm {
	functional: boolean
	domain: @Classifier
	range: @Scalar
}

interface Scalar extends Type {
}

interface StructuredProperty extends SemanticProperty, SpecializableTerm {
	functional: boolean
	domain: @Classifier
	range: @Structure
}

/*
interface FacetedScalar extends Scalar {
	length?: UnsignedInteger
	minLength?: UnsignedInteger
	maxLength?: UnsignedInteger
	pattern?: string
	language?: string
	minInclusive?: Literal
	minExclusive?: Literal
	maxInclusive?: Literal
	maxExclusive?: Literal
}

interface EnumeratedScalar extends Scalar {
	literals: Literal[]
}
*/

interface Rule extends Member, VocabularyStatement {
	antecedent: Predicate[]
	consequent: Predicate[]
}

interface Predicate {
	antecedentRule?: @Rule
	consequentRule?: @Rule
}

interface StructureInstance extends Instance {
	^type: @Structure
	//owningAxiom?: @StructuredPropertyValueRestrictionAxiom
	//owningAssertion?: @StructuredPropertyValueAssertion
}

//interface StructuredPropertyValueRestrictionAxiom extends StructuredPropertyRestrictionAxiom {
//	value: StructureInstance
//}

interface StructuredPropertyRestrictionAxiom extends PropertyRestrictionAxiom {
	property: @StructuredProperty
}

//interface StructuredPropertyValueAssertion extends PropertyValueAssertion {
//	property: @StructuredProperty
//	value: StructureInstance
//}

/*
interface RelationInstance extends NamedInstance {
	ownedTypes: RelationTypeAssertion[]
	sources: @NamedInstance[]
	targets: @NamedInstance[]
}
*/

interface RelationTypeAssertion extends TypeAssertion {
	^type: @RelationEntity
	//owningInstance?: @RelationInstance
	//owningReference?: @RelationInstanceReference
}

interface RelationInstanceReference extends NamedInstanceReference {
	instance: @RelationInstance
	ownedTypes: RelationTypeAssertion[]
}

interface AspectReference extends EntityReference {
	aspect: @Aspect
}

interface ConceptReference extends EntityReference {
	concept: @Concept
}

interface RelationEntityReference extends EntityReference {
	entity: @RelationEntity
}

interface StructureReference extends ClassifierReference {
	structure: @Structure
}

/*
interface AnnotationPropertyReference extends SpecializableTermReference {
	property: @AnnotationProperty
}

interface ScalarPropertyReference extends SpecializableTermReference {
	property: @ScalarProperty
}

interface StructuredPropertyReference extends SpecializableTermReference {
	property: @StructuredProperty
}

interface FacetedScalarReference extends SpecializableTermReference {
	scalar: @FacetedScalar
}

interface EnumeratedScalarReference extends SpecializableTermReference {
	scalar: @EnumeratedScalar
}
*/

interface RelationReference extends OmlReference, VocabularyStatement {
	relation: @Relation
}

interface RuleReference extends OmlReference, VocabularyStatement {
	rule: @Rule
}

interface VocabularyExtension extends VocabularyImport {
}

interface VocabularyUsage extends VocabularyImport {
}

interface VocabularyBundleInclusion extends VocabularyBundleImport {
}

interface VocabularyBundleExtension extends VocabularyBundleImport {
}

interface DescriptionUsage extends DescriptionImport {
}

interface DescriptionExtension extends DescriptionImport {
}

interface DescriptionBundleInclusion extends DescriptionBundleImport {
}

interface DescriptionBundleExtension extends DescriptionBundleImport {
}

interface DescriptionBundleUsage extends DescriptionBundleImport {
}

interface ScalarPropertyRestrictionAxiom extends PropertyRestrictionAxiom {
	property: @ScalarProperty
}

//interface ScalarPropertyRangeRestrictionAxiom extends ScalarPropertyRestrictionAxiom {
//	range: @Scalar
//	kind: RangeRestrictionKind
//}

//interface ScalarPropertyCardinalityRestrictionAxiom extends ScalarPropertyRestrictionAxiom {
//	cardinality: UnsignedInteger
//	kind: CardinalityRestrictionKind
//	range?: @Scalar
//}

//interface ScalarPropertyValueRestrictionAxiom extends ScalarPropertyRestrictionAxiom {
//	value: Literal
//}

//interface StructuredPropertyRangeRestrictionAxiom extends StructuredPropertyRestrictionAxiom {
//	range: @Structure
//	kind: RangeRestrictionKind
//}

//interface StructuredPropertyCardinalityRestrictionAxiom extends StructuredPropertyRestrictionAxiom {
//	cardinality: UnsignedInteger
//	kind: CardinalityRestrictionKind
//	range?: @Structure
//}

//interface RelationRangeRestrictionAxiom extends RelationRestrictionAxiom {
//	range: @Entity
//	kind: RangeRestrictionKind
//}

//interface RelationCardinalityRestrictionAxiom extends RelationRestrictionAxiom {
//	cardinality: UnsignedInteger
//	kind: CardinalityRestrictionKind
//	range?: @Entity
//}

//interface RelationTargetRestrictionAxiom extends RelationRestrictionAxiom {
//	target: @NamedInstance
//}

//interface ScalarPropertyValueAssertion extends PropertyValueAssertion {
//	property: @ScalarProperty
//	value: Literal
//}

interface UnaryPredicate extends Predicate {
	variable: string
}

interface TypePredicate extends UnaryPredicate {
	^type: @Type
}

interface BinaryPredicate extends Predicate {
	variable1: string
	variable2?: string
	instance2?: @NamedInstance
}

interface RelationEntityPredicate extends BinaryPredicate {
	entity: @RelationEntity
	entityVariable: string
}

interface FeaturePredicate extends BinaryPredicate {
	feature: @Feature
	literal2?: Literal
}

interface SameAsPredicate extends BinaryPredicate {
}

interface DifferentFromPredicate extends BinaryPredicate {
}

//includes end

entry Ontology infers Ontology_Union:
    VocabularyBox | DescriptionBox;

Annotation returns Annotation:
    '@' {Annotation} property=[AnnotationProperty:Ref] (value=Literal | referenceValue=[Member:Ref])?;

VocabularyBox returns VocabularyBox:
      {infer Vocabulary} ownedAnnotations+=Annotation* 'vocabulary' namespace=NAMESPACE 'as' prefix=ID '{' ownedImports+=VocabularyImport* ownedStatements+=VocabularyStatement* '}'
    | {infer VocabularyBundle} ownedAnnotations+=Annotation* 'vocabulary' 'bundle' namespace=NAMESPACE 'as' prefix=ID '{' ownedImports+=VocabularyBundleImport* '}';

DescriptionBox returns DescriptionBox:
      {Description} ownedAnnotations+=Annotation* 'description' namespace=NAMESPACE 'as' prefix=ID '{' ownedImports+=DescriptionImport* ownedStatements+=DescriptionStatement* '}' 
    | {DescriptionBundle} ownedAnnotations+=Annotation* 'description' 'bundle' namespace=NAMESPACE 'as' prefix=ID '{' ownedImports+=DescriptionBundleImport* '}';

SpecializableTerm returns SpecializableTerm:
      {Classifier} Classifier
    | {Scalar} Scalar
    | {AnnotationProperty} ownedAnnotations+=Annotation* 'annotation' 'property' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?
    | {ScalarProperty} ownedAnnotations+=Annotation* 'scalar' 'property' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? '[' 'domain' domain=[Classifier:Ref] 'range' range=[Scalar:Ref] (functional?='functional')? ']'
    | {StructuredProperty} ownedAnnotations+=Annotation* 'structured' 'property' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? '[' 'domain' domain=[Classifier:Ref] 'range' range=[Structure:Ref] (functional?='functional')? ']';

Classifier returns Classifier:
      {Entity} Entity
    | {Structure} ownedAnnotations+=Annotation* 'structure' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' ownedPropertyRestrictions+=PropertyRestrictionAxiom* ']')?;

Entity returns Entity:
      {Aspect} ownedAnnotations+=Annotation* 'aspect' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ']')?
    | {Concept} ownedAnnotations+=Annotation* 'concept' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ('enumerates' enumeratedInstances+=[ConceptInstance:Ref] (',' enumeratedInstances+=[ConceptInstance:Ref])*)? ']')?
    | {RelationEntity} ownedAnnotations+=Annotation* 'relation' 'entity' name=ID (':>' ownedSpecializations+=SpecializationAxiom  (',' ownedSpecializations+=SpecializationAxiom)*)? '[' 'from' source=[Entity:Ref] 'to' target=[Entity:Ref] 
        (
            (forwardRelation=ForwardRelation (reverseRelation=ReverseRelation)?) |
            (reverseRelation=ReverseRelation (forwardRelation=ForwardRelation)?)
        )?
        (
            (functional?='functional' ) |
            (inverseFunctional?='inverse'  'functional' ) | 
            (symmetric?='symmetric' ) |
            (asymmetric?='asymmetric' ) |
            (reflexive?='reflexive' ) |
            (irreflexive?='irreflexive' ) |
            (transitive?='transitive' )
        )* // TODO: This would allow multiple declarations of functional, symmetric, etc.
        (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ']';

Scalar returns Scalar:
      {infer FacetedScalar} ownedAnnotations+=Annotation* 'scalar' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' 
        (
            ('length' length=UnsignedInteger) |
            ('minLength' minLength=UnsignedInteger) |
            ('maxLength' maxLength=UnsignedInteger) |
            ('pattern' pattern=STRING) |
            ('language' language=ID) |
            ('minInclusive' minInclusive=Literal) |
            ('minExclusive' minExclusive=Literal) |
            ('maxInclusive' maxInclusive=Literal) |
            ('maxExclusive' maxExclusive=Literal)
        )* ']')? // TODO: Allows redefinition
    | {infer EnumeratedScalar} ownedAnnotations+=Annotation* 'enumerated' 'scalar' name=ID (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (literals+=Literal (',' literals+=Literal)*)? ']')?;

ForwardRelation returns ForwardRelation:
    ownedAnnotations+=Annotation* 'forward' name=ID;

ReverseRelation returns ReverseRelation:
    ownedAnnotations+=Annotation* 'reverse' name=ID;

StructureInstance returns StructureInstance:
    ^type=[Structure:Ref] '[' ownedPropertyValues+=PropertyValueAssertion* ']';

NamedInstance returns NamedInstance:
      {infer ConceptInstance} ownedAnnotations+=Annotation* 'ci' name=ID (':' ownedTypes+=ConceptTypeAssertion (',' ownedTypes+=ConceptTypeAssertion)*)? ('[' (ownedPropertyValues+=PropertyValueAssertion | ownedLinks+=LinkAssertion)* ']')?
    | {infer RelationInstance} ownedAnnotations+=Annotation* 'ri' name=ID (':' ownedTypes+=RelationTypeAssertion (',' ownedTypes+=RelationTypeAssertion)*)? '[' 'from' sources+=[NamedInstance:Ref] (',' sources+=[NamedInstance:Ref])* 'to' targets+=[NamedInstance:Ref] (',' targets+=[NamedInstance:Ref])* (ownedPropertyValues+=PropertyValueAssertion | ownedLinks+=LinkAssertion)* ']';

SpecializableTermReference returns SpecializableTermReference:
      {ClassifierReference} ClassifierReference 
    | {infer EnumeratedScalarReference} ownedAnnotations+=Annotation* 'ref' 'enumerated' 'scalar' scalar=[EnumeratedScalar:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?
    | {infer FacetedScalarReference} ownedAnnotations+=Annotation* 'ref' 'scalar' scalar=[FacetedScalar:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?
    | {infer AnnotationPropertyReference} ownedAnnotations+=Annotation* 'ref' 'annotation' 'property' property=[AnnotationProperty:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?
    | {infer ScalarPropertyReference} ownedAnnotations+=Annotation* 'ref' 'scalar' 'property' property=[ScalarProperty:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?  
    | {infer StructuredPropertyReference} ownedAnnotations+=Annotation* 'ref' 'structured' 'property' property=[StructuredProperty:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)?;

ClassifierReference returns ClassifierReference:
      {EntityReference} EntityReference
    | {StructureReference} ownedAnnotations+=Annotation* 'ref' 'structure' structure=[Structure:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' ownedPropertyRestrictions+=PropertyRestrictionAxiom* ']')?;

EntityReference returns EntityReference:
      {AspectReference} ownedAnnotations+=Annotation* 'ref' 'aspect' aspect=[Aspect:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ']')?
    | {ConceptReference} ownedAnnotations+=Annotation* 'ref' 'concept' concept=[Concept:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ']')?
    | {RelationEntityReference} ownedAnnotations+=Annotation* 'ref' 'relation' 'entity' entity=[RelationEntity:Ref] (':>' ownedSpecializations+=SpecializationAxiom (',' ownedSpecializations+=SpecializationAxiom)*)? ('[' (ownedKeys+=KeyAxiom | ownedPropertyRestrictions+=PropertyRestrictionAxiom | ownedRelationRestrictions+=RelationRestrictionAxiom)* ']')?;

NamedInstanceReference returns NamedInstanceReference:
      {ConceptInstanceReference} ownedAnnotations+=Annotation* 'ref' 'ci' instance=[ConceptInstance:Ref] (':' ownedTypes+=ConceptTypeAssertion (',' ownedTypes+=ConceptTypeAssertion)*)? ('[' ownedPropertyValues+=PropertyValueAssertion* ownedLinks+=LinkAssertion* ']')?
    | {RelationInstanceReference} ownedAnnotations+=Annotation* 'ref' 'ri' instance=[RelationInstance:Ref] (':' ownedTypes+=RelationTypeAssertion (',' ownedTypes+=RelationTypeAssertion)*)? ('[' ownedPropertyValues+=PropertyValueAssertion* ownedLinks+=LinkAssertion* ']')?;

VocabularyStatement returns VocabularyStatement:
      {Rule} ownedAnnotations+=Annotation* 'rule' name=ID '[' antecedent+=Predicate ('^' antecedent+=Predicate)* '->' consequent+=Predicate ('^' consequent+=Predicate)* ']'
    | {RuleReference} ownedAnnotations+=Annotation* 'ref' 'rule' rule=[Rule:Ref]
    | {SpecializableTerm} SpecializableTerm
    | {SpecializableTermReference} SpecializableTermReference
    | {RelationReference} ownedAnnotations+=Annotation* 'ref' 'relation' relation=[Relation:Ref];

DescriptionStatement infers DescriptionStatement_Union:
    NamedInstance | NamedInstanceReference;

VocabularyImport returns VocabularyImport:
      {VocabularyExtension} ownedAnnotations+=Annotation* 'extends' namespace=NAMESPACE ('as' prefix=ID)?
    | {VocabularyUsage} ownedAnnotations+=Annotation* 'uses' namespace=NAMESPACE ('as' prefix=ID)?;

VocabularyBundleImport returns VocabularyBundleImport:
      {VocabularyBundleExtension} ownedAnnotations+=Annotation* 'extends' namespace=NAMESPACE ('as' prefix=ID)?
    | {VocabularyBundleInclusion} ownedAnnotations+=Annotation* 'includes' namespace=NAMESPACE ('as' prefix=ID)?;

DescriptionImport returns DescriptionImport:
      {DescriptionExtension} ownedAnnotations+=Annotation* 'extends' namespace=NAMESPACE ('as' prefix=ID)?
    | {DescriptionUsage} ownedAnnotations+=Annotation* 'uses' namespace=NAMESPACE ('as' prefix=ID)?;

DescriptionBundleImport returns DescriptionBundleImport:
      {DescriptionBundleExtension} ownedAnnotations+=Annotation* 'extends' namespace=NAMESPACE ('as' prefix=ID)?
    | {DescriptionBundleInclusion} ownedAnnotations+=Annotation* 'includes' namespace=NAMESPACE ('as' prefix=ID)?
    | {DescriptionBundleUsage} ownedAnnotations+=Annotation* 'uses' namespace=NAMESPACE ('as' prefix=ID)?;

SpecializationAxiom returns SpecializationAxiom:
    specializedTerm=[SpecializableTerm:Ref];

PropertyRestrictionAxiom returns PropertyRestrictionAxiom:
    ScalarPropertyRestrictionAxiom | StructuredPropertyRestrictionAxiom;

ScalarPropertyRestrictionAxiom returns ScalarPropertyRestrictionAxiom:
    ScalarPropertyRangeRestrictionAxiom | ScalarPropertyCardinalityRestrictionAxiom | ScalarPropertyValueRestrictionAxiom;

ScalarPropertyRangeRestrictionAxiom:
    'restricts' kind=RangeRestrictionKind 'scalar' 'property' property=[ScalarProperty:Ref] 'to' range=[Scalar:Ref];

ScalarPropertyCardinalityRestrictionAxiom:
    'restricts' 'scalar' 'property' property=[ScalarProperty:Ref] 'to' kind=CardinalityRestrictionKind cardinality=UnsignedInteger (range=[Scalar:Ref])?;

ScalarPropertyValueRestrictionAxiom:
    'restricts' 'scalar' 'property' property=[ScalarProperty:Ref] 'to' value=Literal;

StructuredPropertyRestrictionAxiom returns StructuredPropertyRestrictionAxiom:
    StructuredPropertyRangeRestrictionAxiom | StructuredPropertyCardinalityRestrictionAxiom | StructuredPropertyValueRestrictionAxiom;

StructuredPropertyRangeRestrictionAxiom returns StructuredPropertyRestrictionAxiom:
    {infer StructuredPropertyRangeRestrictionAxiom} 'restricts' kind=RangeRestrictionKind 'structured' 'property' property=[StructuredProperty:Ref] 'to' range=[Structure:Ref];

StructuredPropertyCardinalityRestrictionAxiom returns StructuredPropertyRestrictionAxiom:
    {infer StructuredPropertyCardinalityRestrictionAxiom} 'restricts' 'structured' 'property' property=[StructuredProperty:Ref] 'to' kind=CardinalityRestrictionKind cardinality=UnsignedInteger (range=[Structure:Ref])?;

StructuredPropertyValueRestrictionAxiom returns StructuredPropertyRestrictionAxiom:
    {infer StructuredPropertyValueRestrictionAxiom} 'restricts' 'structured' 'property' property=[StructuredProperty:Ref] 'to' value=StructureInstance;

RelationRestrictionAxiom returns RelationRestrictionAxiom:
   RelationRangeRestrictionAxiom | RelationCardinalityRestrictionAxiom | RelationTargetRestrictionAxiom;

RelationRangeRestrictionAxiom returns RelationRestrictionAxiom:
    {infer RelationRangeRestrictionAxiom} 'restricts' kind=RangeRestrictionKind 'relation' relation=[Relation:Ref] 'to' range=[Entity:Ref];

RelationCardinalityRestrictionAxiom returns RelationRestrictionAxiom:
    {infer RelationCardinalityRestrictionAxiom} 'restricts' 'relation' relation=[Relation:Ref] 'to' kind=CardinalityRestrictionKind cardinality=UnsignedInteger (range=[Entity:Ref])?;

RelationTargetRestrictionAxiom returns RelationRestrictionAxiom:
    {infer RelationTargetRestrictionAxiom} 'restricts' 'relation' relation=[Relation:Ref] 'to' target=[NamedInstance:Ref];

KeyAxiom returns KeyAxiom:
    'key' properties+=[Feature:Ref] (',' properties+=[Feature:Ref])*;

ConceptTypeAssertion returns ConceptTypeAssertion:
    ^type=[Concept:Ref];

RelationTypeAssertion returns RelationTypeAssertion:
    ^type=[RelationEntity:Ref];

PropertyValueAssertion returns PropertyValueAssertion:
    ScalarPropertyValueAssertion | StructuredPropertyValueAssertion;

ScalarPropertyValueAssertion:
    property=[ScalarProperty:Ref] value=Literal;

StructuredPropertyValueAssertion:
    property=[StructuredProperty:Ref] value=StructureInstance;

LinkAssertion returns LinkAssertion:
    relation=[Relation:Ref ] target=[NamedInstance:Ref];

Predicate returns Predicate:
      {TypePredicate} ^type=[Type:Ref] => '(' variable=ID ')'
    | {BinaryPredicate} BinaryPredicate;

BinaryPredicate returns BinaryPredicate:
      {RelationEntityPredicate} entity=[RelationEntity:Ref] '(' variable1=ID ',' entityVariable=ID ',' (variable2=ID  | instance2=[NamedInstance:CrossRef]) ')'
    | {FeaturePredicate} feature=[Feature:Ref ] '(' variable1=ID ',' (variable2=ID | literal2=Literal | instance2=[NamedInstance:CrossRef]) ')'
    | {SameAsPredicate} 'sameAs' '(' variable1=ID ',' (variable2=ID | instance2=[NamedInstance:CrossRef]) ')'
    | {DifferentFromPredicate} 'differentFrom' '(' variable1=ID ',' (variable2=ID | instance2=[NamedInstance:CrossRef]) ')';

Literal:
    IntegerLiteral | DecimalLiteral | DoubleLiteral | BooleanLiteral | QuotedLiteral;

IntegerLiteral:
    value=SIGNED_INTEGER_STR | value=UNSIGNED_INTEGER_STR;

DecimalLiteral:
    value=DECIMAL_STR;

DoubleLiteral:
    value=DOUBLE_STR;

BooleanLiteral:
    value=BOOLEAN_STR;

UnsignedInteger:
    value=UNSIGNED_INTEGER_STR;

QuotedLiteral:
    value=STRING (('^^' ^type=[Scalar:Ref]) | ('$' langTag=ID))?;

RangeRestrictionKind returns string:
    'all' | 'some';

CardinalityRestrictionKind returns string:
    'exactly' | 'min' | 'max';

Ref returns string:
    ID | ABBREVIATED_IRI | FULL_IRI;

CrossRef returns string:
    ABBREVIATED_IRI | FULL_IRI;

hidden terminal WS returns string:/\s+/;
terminal BOOLEAN_STR returns string: /false|true/ ;
terminal DOUBLE_STR: /[+-]?((\d+\.\d*)|(\.\d+))[eE][+-]?\d+/;
terminal DECIMAL_STR returns number: /[+-]?(\d+\.\d*)|(\.\d+)/;
terminal UNSIGNED_INTEGER_STR returns number: /\d+/;
terminal SIGNED_INTEGER_STR returns number: /[+-]\d+/;
terminal NAMESPACE: /<[^>\s#]+[#\/]>/;
terminal FULL_IRI: /<[^>\s]+>/;
terminal fragment IDFRAG: /[a-zA-z_][\w\-\.$]*/;
terminal ABBREVIATED_IRI: IDFRAG ':' IDFRAG;
terminal ID: IDFRAG;
terminal STRING returns string:('"' ( !('"' | '\\' )| '\\' . )*'"' ) | ("'" ( !("'" | '\\' )| '\\' . )*"'" ) | ("'''"  -> "'''" ) | '"""'  -> '"""'  ;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
