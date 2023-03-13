import { AstNode, LangiumDocument, Reference } from "langium";
import {
    AnnotationProperty,
    AnnotationPropertyReference,
    Aspect,
    AspectReference,
    Classifier,
    ClassifierReference,
    Concept,
    ConceptInstance,
    ConceptInstanceReference,
    ConceptReference,
    Entity,
    EntityReference,
    EnumeratedScalar,
    EnumeratedScalarReference,
    FacetedScalar,
    FacetedScalarReference,
    ForwardRelation,
    Instance,
    isAnnotationProperty,
    isAnnotationPropertyReference,
    isAspect,
    isAspectReference,
    isClassifierReference,
    isConcept,
    isConceptInstance,
    isConceptInstanceReference,
    isConceptReference,
    isEntityReference,
    isEnumeratedScalar,
    isEnumeratedScalarReference,
    isFacetedScalar,
    isFacetedScalarReference,
    isNamedInstance,
    isNamedInstanceReference,
    isRelation,
    isRelationEntity,
    isRelationEntityReference,
    isRelationInstance,
    isRelationInstanceReference,
    isRelationRangeRestrictionAxiom,
    isRelationReference,
    isRule,
    isRuleReference,
    isScalarProperty,
    isScalarPropertyReference,
    isSpecializableTermReference,
    isSpecializationAxiom,
    isStructure,
    isStructuredProperty,
    isStructuredPropertyReference,
    isStructureReference,
    KeyAxiom,
    LinkAssertion,
    Member,
    NamedInstance,
    NamedInstanceReference,
    OmlReference,
    PropertyRestrictionAxiom,
    PropertyValueAssertion,
    Relation,
    RelationEntity,
    RelationEntityReference,
    RelationInstance,
    RelationInstanceReference,
    RelationRangeRestrictionAxiom,
    RelationReference,
    RelationRestrictionAxiom,
    ReverseRelation,
    Rule,
    RuleReference,
    ScalarProperty,
    ScalarPropertyReference,
    SemanticProperty,
    SpecializableTerm,
    SpecializationAxiom,
    Structure,
    StructuredProperty,
    StructuredPropertyReference,
    StructureReference,
} from "../generated/ast";
import { closure, getSuperTerm } from "./oml-read";

export function getRootContainer(element: AstNode): AstNode {
    let root: AstNode = element;
    while (root.$container != undefined) {
        root = root.$container;
    }
    return root;
}

/**
 * Searches the context for cross references to a given element
 *
 * @param element The element to search for cross refs to
 * @return An array of Reference objects
 */
function searchForReferences(element: AstNode): Array<Reference> {
    const root: AstNode = getRootContainer(element);
    let doc: LangiumDocument<AstNode> = root.$document as LangiumDocument<AstNode>;
    const result: Array<Reference> = new Array<Reference>();
    for (let ref of doc.references) {
        if (ref.ref && ref.ref === element) result.push(ref);
    }
    return result;
}

/**
 * Finds all objects that cross reference a given Oml element
 *
 * @param element The element to search for cross refs to
 * @return An array of objects that cross reference the given element based on the criteria
 */
function findInverseReferencers(element: AstNode): Array<AstNode> {
    const referencers: Set<AstNode> = new Set<AstNode>();
    const refs: Array<Reference> = searchForReferences(element);
    refs.forEach((r) => referencers.add(r.$refNode?.element as AstNode));
    return new Array<AstNode>(...referencers);
}

/**
 * Finds references to the given member
 *
 * @param member the given member
 * @return an array of references to the given member
 */
export function findReferences(member: Member): Array<OmlReference> {
    const references: Array<OmlReference> = new Array<OmlReference>();
    if (isAnnotationProperty(member)) {
        findAnnotationPropertyReferencesWithProperty(member).forEach((r) => references.push(r));
    } else if (isAspect(member)) {
        findAspectReferencesWithAspect(member).forEach((r) => references.push(r));
    } else if (isConcept(member)) {
        findConceptReferencesWithConcept(member).forEach((r) => references.push(r));
    } else if (isRelationEntity(member)) {
        findRelationEntityReferencesWithEntity(member).forEach((r) => references.push(r));
    } else if (isStructure(member)) {
        findStructureReferencesWithStructure(member).forEach((r) => references.push(r));
    } else if (isFacetedScalar(member)) {
        findFacetedScalarReferencesWithScalar(member).forEach((r) => references.push(r));
    } else if (isEnumeratedScalar(member)) {
        findEnumeratedScalarReferencesWithScalar(member).forEach((r) => references.push(r));
    } else if (isRelation(member)) {
        findRelationReferencesWithRelation(member).forEach((r) => references.push(r));
    } else if (isStructuredProperty(member)) {
        findStructuredPropertyReferencesWithProperty(member).forEach((r) => references.push(r));
    } else if (isScalarProperty(member)) {
        findScalarPropertyReferencesWithProperty(member).forEach((r) => references.push(r));
    } else if (isRule(member)) {
        findRuleReferencesWithRule(member).forEach((r) => references.push(r));
    } else if (isConceptInstance(member)) {
        findConceptInstanceReferencesWithInstance(member).forEach((r) => references.push(r));
    } else if (isRelationInstance(member)) {
        findRelationInstanceReferencesWithInstance(member).forEach((r) => references.push(r));
    }
    return references;
}

/**
 * Finds specialization axioms that have the given term as a sub term
 *
 * @param term the given term
 * @return an array of specialization axioms that have the given term as a sub term
 */
export function findSpecializationsWithSubTerm(term: SpecializableTerm): Array<SpecializationAxiom> {
    const axioms: Array<SpecializationAxiom> = new Array<SpecializationAxiom>();
    if (term.ownedSpecializations) term.ownedSpecializations.forEach((s) => axioms.push(s));
    findReferences(term).forEach((ref) => {
        if (isSpecializableTermReference(ref)) {
            if (ref.ownedSpecializations) ref.ownedSpecializations.forEach((ax) => axioms.push(ax));
        }
    });
    return axioms;
}

/**
 * Finds specialization axioms that have the given term as a super term
 *
 * @param term the given term
 * @return an array of specialization axioms that have the given term as a super term
 */
export function findSpecializationsWithSuperTerm(term: SpecializableTerm): Array<SpecializationAxiom> {
    return findSpecializationAxiomsWithSpecializedTerm(term);
}

/**
 * Finds terms that are the direct super (general) terms of the given term
 *
 * @param term the given term
 * @return an array of terms that are the direct super (general) terms of the given term
 */
export function findSuperTerms(term: SpecializableTerm): Array<SpecializableTerm> {
    return findSpecializationsWithSubTerm(term)
        .map((i) => getSuperTerm(i))
        .filter((t) => t != undefined) as Array<SpecializableTerm>;
}

/**
 * Finds terms that are the direct or transitive super (general) terms of the given term
 *
 * @param term the given term
 * @param inclusive a boolean determining whether to include the given term in the result
 * @return an array of terms that are the direct or transitive super (general) terms of the given term
 */
export function findAllSuperTerms(term: SpecializableTerm, inclusive: boolean): Array<SpecializableTerm> {
    return closure(term, inclusive, (t) => findSuperTerms(t));
}

/**
 * Finds property value assertions that are defined on the given instance
 *
 * @param instance the given instance
 * @return an array of property value assertions that are defined on the given instance
 */
export function findPropertyValueAssertions(instance: Instance): Array<PropertyValueAssertion> {
    const assertions: Array<PropertyValueAssertion> = new Array<PropertyValueAssertion>();
    if (instance.ownedPropertyValues) instance.ownedPropertyValues.forEach(p => assertions.push(p));
    if (isNamedInstance(instance)) {
        const refs: Array<NamedInstanceReference> = findReferences(instance).filter((i) =>
            isNamedInstanceReference(i)
        ) as Array<NamedInstanceReference>;
        refs.flatMap((nir) => nir.ownedPropertyValues).forEach((pva) => assertions.push(pva));
    }
    return assertions;
}

/**
 * Finds link assertions that are defined on the given instance
 *
 * @param instance the given instance
 * @return an array of link assertions that are defined on the given instance
 */
export function findLinkAssertions(instance: NamedInstance): Array<LinkAssertion> {
    const assertions: Array<LinkAssertion> = new Array<LinkAssertion>();
    if (instance.ownedLinks) instance.ownedLinks.forEach(l => assertions.push(l));
    const refs: Array<NamedInstanceReference> = findReferences(instance).filter((i) =>
        isNamedInstanceReference(i)
    ) as Array<NamedInstanceReference>;
    refs.flatMap((nir) => nir.ownedLinks).forEach((pva) => assertions.push(pva));
    return assertions;
}

/**
 * Find key axioms that are defined on the given entity
 *
 * @param entity the given entity
 * @return an array of key axioms that are defined on the given entity
 */
export function findKeys(entity: Entity): Array<KeyAxiom> {
    const keys: Array<KeyAxiom> = new Array<KeyAxiom>();
    if (entity.ownedKeys) entity.ownedKeys.forEach(k => keys.push(k));
    const refs: Array<EntityReference> = findReferences(entity).filter((i) =>
        isEntityReference(i)
    ) as Array<EntityReference>;
    refs.flatMap((r) => r.ownedKeys).forEach((k) => keys.push(k));
    return keys;
}

/**
 * Find property restriction axioms that are defined on the given classifier
 *
 * @param classifier the given classifier
 * @return an array of property restriction axioms that are defined on the given classifier
 */
export function findPropertyRestrictions(classifier: Classifier): Array<PropertyRestrictionAxiom> {
    const restrictions: Array<PropertyRestrictionAxiom> = new Array<PropertyRestrictionAxiom>();
    if (classifier.ownedPropertyRestrictions) classifier.ownedPropertyRestrictions.forEach(p => restrictions.push(p));
    const refs: Array<ClassifierReference> = findReferences(classifier).filter((i) =>
        isClassifierReference(i)
    ) as Array<ClassifierReference>;
    refs.flatMap((r) => r.ownedPropertyRestrictions).forEach((p) => restrictions.push(p));
    return restrictions;
}

/**
 * Find relation restriction axioms that are defined on the given entity
 *
 * @param entity the given entity
 * @return an array of relation restriction axioms that are defined on the given entity
 */
export function findRelationRestrictions(entity: Entity): Array<RelationRestrictionAxiom> {
    const restrictions: Array<RelationRestrictionAxiom> = new Array<RelationRestrictionAxiom>();
    if (entity.ownedRelationRestrictions) entity.ownedRelationRestrictions.forEach(r => restrictions.push(r));
    const refs: Array<EntityReference> = findReferences(entity).filter((i) =>
        isEntityReference(i)
    ) as Array<EntityReference>;
    refs.flatMap((r) => r.ownedRelationRestrictions).forEach((r) => restrictions.push(r));
    return restrictions;
}

/**
 * Finds relations that have the given entity as their source
 *
 * @param entity the given entity
 * @return an array of relations that have the given entity as their source
 */
export function findSourceRelations(entity: Entity): Array<Relation> {
    const relations: Array<Relation> = new Array<Relation>();
    const forward: Array<ForwardRelation> = findRelationEntitiesWithSource(entity)
        .map((r) => r.forwardRelation)
        .filter((f) => f != undefined) as Array<ForwardRelation>;
    forward.forEach((f) => relations.push(f));
    const reverse: Array<ReverseRelation> = findRelationEntitiesWithTarget(entity)
        .map((r) => r.reverseRelation)
        .filter((f) => f != undefined) as Array<ReverseRelation>;
    reverse.forEach((f) => relations.push(f));
    return relations;
}

/**
 * Finds relations that have the given entity as their target
 *
 * @param entity the given entity
 * @return an array of relations that have the given entity as their target
 */
export function findTargetRelations(entity: Entity): Array<Relation> {
    const relations: Array<Relation> = new Array<Relation>();
    const forward: Array<ForwardRelation> = findRelationEntitiesWithTarget(entity)
        .map((r) => r.forwardRelation)
        .filter((f) => f != undefined) as Array<ForwardRelation>;
    forward.forEach((f) => relations.push(f));
    const reverse: Array<ReverseRelation> = findRelationEntitiesWithSource(entity)
        .map((r) => r.reverseRelation)
        .filter((f) => f != undefined) as Array<ReverseRelation>;
    reverse.forEach((f) => relations.push(f));
    return relations;
}

///////////////////////////////////////
// Index
///////////////////////////////////////

/**
 * Finds scalar properties referencing the given classifier as domain
 *
 * @param domain The referenced classifier
 * @return An array of referencing scalar properties
 */
export function findScalarPropertiesWithDomain(domain: Classifier): Array<ScalarProperty> {
    let referencers: Array<AstNode> = findInverseReferencers(domain);
    let rsp: Array<ScalarProperty> = referencers.filter((r) => isScalarProperty(r)) as Array<ScalarProperty>;
    return rsp.filter((s) => s.domain.ref && s.domain.ref === domain);
}

/**
 * Finds structured properties referencing the given classifier as domain
 *
 * @param domain The referenced classifier
 * @return An array of referencing scalar properties
 */
export function findStructuredPropertiesWithDomain(domain: Classifier): Array<StructuredProperty> {
    let referencers: Array<AstNode> = findInverseReferencers(domain);
    let rsp: Array<StructuredProperty> = referencers.filter((r) =>
        isStructuredProperty(r)
    ) as Array<StructuredProperty>;
    return rsp.filter((s) => s.domain.ref && s.domain.ref === domain);
}

/**
 * Finds semantic properties referencing the given classifier as domain
 *
 * @param domain The referenced classifier
 * @return An array of referencing semantic properties
 */
export function findSemanticPropertiesWithDomain(domain: Classifier): Array<SemanticProperty> {
    let properties: Array<SemanticProperty> = new Array<SemanticProperty>();
    findScalarPropertiesWithDomain(domain).forEach((p) => properties.push(p));
    findStructuredPropertiesWithDomain(domain).forEach((p) => properties.push(p));
    return properties;
}

/**
 * Finds relation instances referencing the given named instance as source
 *
 * @param source The referenced named instance
 * @return An array of referencing relation instances
 */
export function findRelationInstancesWithSource(source: NamedInstance): Array<RelationInstance> {
    let referencers: Array<AstNode> = findInverseReferencers(source);
    let referers: Array<RelationInstance> = referencers.filter((r) => isRelationInstance(r)) as Array<RelationInstance>;
    return referers.filter((ri) => ri.sources.map((nir) => nir.ref as NamedInstance).includes(source));
}

/**
 * Finds specialization axioms referencing the given specialized term
 *
 * @param specializedTerm The referenced specialized term
 * @return An array of referencing specialization axioms
 */
export function findSpecializationAxiomsWithSpecializedTerm(
    specializedTerm: SpecializableTerm
): Array<SpecializationAxiom> {
    let referencers: Array<AstNode> = findInverseReferencers(specializedTerm);
    let referers: Array<SpecializationAxiom> = referencers.filter((r) =>
        isSpecializationAxiom(r)
    ) as Array<SpecializationAxiom>;
    return referers.filter((sa) => sa.specializedTerm.ref === specializedTerm);
}

/**
 * Finds relation range restriction axioms referencing the given entity as range
 *
 * @param range The referenced entity
 * @return An array of referencing relation range restriction axioms
 */
export function findRelationRangeRestrictionAxiomsWithRange(range: Entity): Array<RelationRangeRestrictionAxiom> {
    let referencers: Array<AstNode> = findInverseReferencers(range);
    let referers: Array<RelationRangeRestrictionAxiom> = referencers.filter((r) =>
        isRelationRangeRestrictionAxiom(r)
    ) as Array<RelationRangeRestrictionAxiom>;
    return referers.filter((r) => r.range.ref === range);
}

/**
 * Finds relation entities referencing the given entity as source
 *
 * @param source The referenced entity
 * @return An array of referencing relation entities
 */
export function findRelationEntitiesWithSource(source: Entity): Array<RelationEntity> {
    let referencers: Array<AstNode> = findInverseReferencers(source);
    let referers: Array<RelationEntity> = referencers.filter((r) => isRelationEntity(r)) as Array<RelationEntity>;
    return referers.filter((r) => r.source.ref === source);
}

/**
 * Finds relation entities referencing the given entity as target
 *
 * @param target The referenced entity
 * @return An array of referencing relation entities
 */
export function findRelationEntitiesWithTarget(target: Entity): Array<RelationEntity> {
    let referencers: Array<AstNode> = findInverseReferencers(target);
    let referers: Array<RelationEntity> = referencers.filter((r) => isRelationEntity(r)) as Array<RelationEntity>;
    return referers.filter((r) => r.target.ref === target);
}

/**
 * Finds aspect references referencing the given aspect
 *
 * @param aspect The referenced aspect
 * @return an array of referencing aspect references
 */
export function findAspectReferencesWithAspect(aspect: Aspect): Array<AspectReference> {
    let referencers: Array<AstNode> = findInverseReferencers(aspect);
    let referers: Array<AspectReference> = referencers.filter((r) => isAspectReference(r)) as Array<AspectReference>;
    return referers.filter((r) => r.aspect.ref === aspect);
}

/**
 * Finds concept references referencing the given concept
 *
 * @param concept The referenced concept
 * @return an array of referencing concept references
 */
export function findConceptReferencesWithConcept(concept: Concept): Array<ConceptReference> {
    let referencers: Array<AstNode> = findInverseReferencers(concept);
    let referers: Array<ConceptReference> = referencers.filter((r) => isConceptReference(r)) as Array<ConceptReference>;
    return referers.filter((r) => r.concept.ref === concept);
}

/**
 * Finds relation entity references referencing the given relation entity
 *
 * @param entity The referenced relation entity
 * @return an array of referencing relation entity references
 */
export function findRelationEntityReferencesWithEntity(relation: RelationEntity): Array<RelationEntityReference> {
    let referencers: Array<AstNode> = findInverseReferencers(relation);
    let referers: Array<RelationEntityReference> = referencers.filter((r) =>
        isRelationEntityReference(r)
    ) as Array<RelationEntityReference>;
    return referers.filter((r) => r.entity.ref === relation);
}

/**
 * Finds structure references referencing the given structure
 *
 * @param structure The referenced structure
 * @return an array of referencing structure references
 */
export function findStructureReferencesWithStructure(structure: Structure): Array<StructureReference> {
    let referencers: Array<AstNode> = findInverseReferencers(structure);
    let referers: Array<StructureReference> = referencers.filter((r) =>
        isStructureReference(r)
    ) as Array<StructureReference>;
    return referers.filter((r) => r.structure.ref === structure);
}

/**
 * Finds annotation property references referencing the given annotation property
 *
 * @param property The referenced annotation property
 * @return An array of referencing annotation property references
 */
export function findAnnotationPropertyReferencesWithProperty(
    property: AnnotationProperty
): Array<AnnotationPropertyReference> {
    let referencers: Array<AstNode> = findInverseReferencers(property);
    let referers: Array<AnnotationPropertyReference> = referencers.filter((r) =>
        isAnnotationPropertyReference(r)
    ) as Array<AnnotationPropertyReference>;
    return referers.filter((r) => r.property.ref === property);
}

/**
 * Finds scalar property references referencing the given scalar property
 *
 * @param property The referenced scalar property
 * @return an array of referencing scalar property references
 */
export function findScalarPropertyReferencesWithProperty(property: ScalarProperty): Array<ScalarPropertyReference> {
    let referencers: Array<AstNode> = findInverseReferencers(property);
    let referers: Array<ScalarPropertyReference> = referencers.filter((r) =>
        isScalarPropertyReference(r)
    ) as Array<ScalarPropertyReference>;
    return referers.filter((r) => r.property.ref === property);
}

/**
 * Finds structured property references referencing the given structured property
 *
 * @param property The referenced structured property
 * @return an array of referencing structured property references
 */
export function findStructuredPropertyReferencesWithProperty(
    property: StructuredProperty
): Array<StructuredPropertyReference> {
    let referencers: Array<AstNode> = findInverseReferencers(property);
    let referers: Array<StructuredPropertyReference> = referencers.filter((r) =>
        isStructuredPropertyReference(r)
    ) as Array<StructuredPropertyReference>;
    return referers.filter((r) => r.property.ref === property);
}

/**
 * Finds faceted scalar references referencing the given faceted scalar
 *
 * @param scalar The referenced faceted scalar
 * @return an array of referencing faceted scalar references
 */
export function findFacetedScalarReferencesWithScalar(scalar: FacetedScalar): Array<FacetedScalarReference> {
    let referencers: Array<AstNode> = findInverseReferencers(scalar);
    let referers: Array<FacetedScalarReference> = referencers.filter((r) =>
        isFacetedScalarReference(r)
    ) as Array<FacetedScalarReference>;
    return referers.filter((r) => r.scalar.ref === scalar);
}

/**
 * Finds enumerated scalar references referencing the given enumerated scalar
 *
 * @param scalar The referenced enumerated scalar
 * @return an array of referencing enumerated scalar references
 */
export function findEnumeratedScalarReferencesWithScalar(scalar: EnumeratedScalar): Array<EnumeratedScalarReference> {
    let referencers: Array<AstNode> = findInverseReferencers(scalar);
    let referers: Array<EnumeratedScalarReference> = referencers.filter((r) =>
        isEnumeratedScalarReference(r)
    ) as Array<EnumeratedScalarReference>;
    return referers.filter((r) => r.scalar.ref === scalar);
}

/**
 * Finds relation references referencing the given relation
 *
 * @param relation The referenced relation
 * @return an array of referencing relation references
 */
export function findRelationReferencesWithRelation(relation: Relation): Array<RelationReference> {
    let referencers: Array<AstNode> = findInverseReferencers(relation);
    let referers: Array<RelationReference> = referencers.filter((r) =>
        isRelationReference(r)
    ) as Array<RelationReference>;
    return referers.filter((r) => r.relation.ref === relation);
}

/**
 * Finds rule references referencing the given rule
 *
 * @param rule The referenced enumerated scalar
 * @return an array of referencing enumerated scalar references
 */
export function findRuleReferencesWithRule(rule: Rule): Array<RuleReference> {
    let referencers: Array<AstNode> = findInverseReferencers(rule);
    let referers: Array<RuleReference> = referencers.filter((r) => isRuleReference(r)) as Array<RuleReference>;
    return referers.filter((r) => r.rule.ref === rule);
}

/**
 * Finds concept instance references referencing the given concept instance
 *
 * @param instance The referenced concept instance
 * @return an array of referencing concept instance references
 */
export function findConceptInstanceReferencesWithInstance(instance: ConceptInstance): Array<ConceptInstanceReference> {
    let referencers: Array<AstNode> = findInverseReferencers(instance);
    let referers: Array<ConceptInstanceReference> = referencers.filter((r) =>
        isConceptInstanceReference(r)
    ) as Array<ConceptInstanceReference>;
    return referers.filter((r) => r.instance.ref === instance);
}

/**
 * Finds relation instance references referencing the given relation instance
 *
 * @param instance The referenced relation instance
 * @return an array of referencing relation instance references
 */
export function findRelationInstanceReferencesWithInstance(
    instance: RelationInstance
): Array<RelationInstanceReference> {
    let referencers: Array<AstNode> = findInverseReferencers(instance);
    let referers: Array<RelationInstanceReference> = referencers.filter((r) =>
        isRelationInstanceReference(r)
    ) as Array<RelationInstanceReference>;
    return referers.filter((r) => r.instance.ref === instance);
}
