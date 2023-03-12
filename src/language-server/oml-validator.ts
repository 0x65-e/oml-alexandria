import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    isAnnotationPropertyReference,
    isAspect,
    isAspectReference,
    isConceptReference,
    isEntity,
    Entity,
    isEnumeratedScalarReference,
    isFacetedScalarReference,
    isRelationEntityReference,
    isScalarPropertyReference,
    isSpecializableTerm,
    isSpecializableTermReference,
    isStructuredPropertyReference,
    isStructureReference,
    OmlAstType,
    SpecializableTerm,
    SpecializableTermReference,
    isRelationEntity,
    RelationEntity,
    isFacetedScalar,
    FacetedScalar,
    isBooleanLiteral,
    isIntegerLiteral,
    isDecimalLiteral,
    isDoubleLiteral,
    EnumeratedScalar,
    isEnumeratedScalar,
    isVocabulary,
    Vocabulary,
    isMember,
    Description,
    isDescription,
    VocabularyBundle,
    isVocabularyBundle,
    DescriptionBundle,
    isClassifier,
    ScalarPropertyRangeRestrictionAxiom,
    isScalarPropertyRangeRestrictionAxiom,
    StructuredPropertyRangeRestrictionAxiom,
    isStructuredPropertyRangeRestrictionAxiom,
    ScalarPropertyCardinalityRestrictionAxiom,
    isScalarPropertyCardinalityRestrictionAxiom,
    StructuredPropertyCardinalityRestrictionAxiom,
    isStructuredPropertyCardinalityRestrictionAxiom,
    ScalarPropertyValueRestrictionAxiom,
    isScalarPropertyValueRestrictionAxiom,
    StructuredPropertyValueRestrictionAxiom,
    isStructuredPropertyValueRestrictionAxiom
} from './generated/ast';
import type { OmlServices } from './oml-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: OmlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.OmlValidator;
    const checks: ValidationChecks<OmlAstType> = {
        Vocabulary: validator.checkVocabularyNamesUnique,
        VocabularyBundle: validator.checkVocabularyBundleNamesUnique,
        Description: validator.checkDescriptionNamesUnique,
        DescriptionBundle: validator.checkDescriptionBundleNamesUnique,
        SpecializableTerm: [validator.checkSpecializationTypesMatch, validator.checkDuplicateSpecializations],
        SpecializableTermReference: [validator.checkReferenceSpecializationTypeMatch, validator.checkReferenceDuplicateSpecializations],
        FacetedScalar: [validator.checkFacetedScalarSpecialization, validator.checkConsistentFacetedScalarRanges, validator.checkFacetedScalarCorrectDefinitions, validator.checkConsistentScalarCorrectTypes, validator.checkValidFacetedScalarRegularExpression],
        EnumeratedScalar: [validator.checkEnumeratedScalarSpecialization, validator.checkEnumeratedScalarNoDuplications],
        RelationEntity: validator.checkRelationEntityLogicalConsistency,
        Entity: validator.checkEntityHasConsistentKeys,
        ScalarPropertyRangeRestrictionAxiom: validator.checkConsistentScalarPropertyRangeRestrictionAxiom,
        StructuredPropertyRangeRestrictionAxiom: validator.checkConsistentStructuredPropertyRangeRestrictionAxiom,
        ScalarPropertyCardinalityRestrictionAxiom: validator.checkConsistentScalarPropertyCardinalityRestrictionAxiom,
        StructuredPropertyCardinalityRestrictionAxiom: validator.checkConsistentStructuredPropertyCardinalityRestrictionAxiom,
        ScalarPropertyValueRestrictionAxiom: validator.checkConsistentScalarPropertyValueRestrictionAxiom,
        StructuredPropertyValueRestrictionAxiom: validator.checkConsistentStructuredPropertyValueRestrictionAxiom
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class OmlValidator {

    checkSpecializationTypesMatch(specTerm: SpecializableTerm, accept: ValidationAcceptor): void {
        if (!isSpecializableTerm(specTerm)) {
            throw new Error('Expected a SpecializableTerm in validation but got the wrong type');
        }

        if (specTerm.ownedSpecializations) {
            specTerm.ownedSpecializations.forEach((spec, i) => {
                if (spec.specializedTerm.ref) {
                    // A SpecializableTerm can only specialize its own type, except any Entity (Aspect, Concept, or RelationEntity) can specialize an Aspect
                    if (!(spec.specializedTerm.ref.$type == specTerm.$type || (isEntity(specTerm) && isAspect(spec.specializedTerm.ref)))) {
                        accept('error', `${specTerm.name} is of type ${specTerm.$type} but is trying to specialize ${spec.specializedTerm.ref.name} of type ${spec.specializedTerm.ref.$type}`, {node: specTerm, property: 'ownedSpecializations', index: i});
                    }
                }
            })
        }
    }

    checkDuplicateSpecializations(specTerm: SpecializableTerm, accept: ValidationAcceptor): void {
        if (!isSpecializableTerm(specTerm)) {
            throw new Error('Expected a SpecializableTerm in validation but got the wrong type');
        }

        if (specTerm.ownedSpecializations) {
            const reported = new Set();
            specTerm.ownedSpecializations.forEach((spec, i) => {
                if (spec.specializedTerm.ref) {
                    if (spec.specializedTerm.ref.name == specTerm.name) {
                        accept('warning', `${specTerm.name} specializes itself`, {node: specTerm, property: 'ownedSpecializations', index: i});
                    }
                    if (reported.has(spec.specializedTerm.ref.name)) {
                        accept('warning', `${specTerm.name} specializes ${spec.specializedTerm.ref.name} twice`, {node: specTerm, property: 'ownedSpecializations', index: i});
                    }
                    reported.add(spec.specializedTerm.ref.name);
                }
            })
        }
    }

    private extractSpecializableTermFromReference(specRef: SpecializableTermReference) : SpecializableTerm | null {
        // Extract the SpecializableTerm from the reference
        let specTerm: SpecializableTerm | null = null;
        if (isFacetedScalarReference(specRef) || isEnumeratedScalarReference(specRef)) {
            if (specRef.scalar.ref) specTerm = specRef.scalar.ref;
        } else if (isScalarPropertyReference(specRef) || isStructuredPropertyReference(specRef) || isAnnotationPropertyReference(specRef)) {
            if (specRef.property.ref) specTerm = specRef.property.ref;
        } else if (isConceptReference(specRef)) {
            if (specRef.concept.ref) specTerm = specRef.concept.ref;
        } else if (isAspectReference(specRef)) {
            if (specRef.aspect.ref) specTerm = specRef.aspect.ref;
        } else if (isStructureReference(specRef)) {
            if (specRef.structure.ref) specTerm = specRef.structure.ref;
        } else if (isRelationEntityReference(specRef)) {
            if (specRef.entity.ref) specTerm = specRef.entity.ref;
        } else {
            throw new Error('Unknown subtype of SpecializableTermReference');
        }
        return specTerm
    }

    checkReferenceSpecializationTypeMatch(specRef: SpecializableTermReference, accept: ValidationAcceptor): void {
        if (!isSpecializableTermReference(specRef)) {
            throw new Error('Expected a SpecializableTermReference in validation but got the wrong type');
        }

        const specTerm = this.extractSpecializableTermFromReference(specRef);

        if (specRef.ownedSpecializations) {
            specRef.ownedSpecializations.forEach((spec, i) => {
                if (spec.specializedTerm.ref && specTerm) {
                    // A SpecializableTerm can only specialize its own type, except any Entity (Aspect, Concept, or RelationEntity) can specialize an Aspect
                    if (!(spec.specializedTerm.ref.$type == specTerm.$type || (isEntity(specTerm) && isAspect(spec.specializedTerm.ref)))) {
                        accept('error', `${specTerm.name} is of type ${specTerm.$type} but is trying to specialize ${spec.specializedTerm.ref.name} of type ${spec.specializedTerm.ref.$type}`, {node: specRef, property: 'ownedSpecializations', index: i});
                    }
                }
            })
        }
    }

    checkReferenceDuplicateSpecializations(specRef: SpecializableTermReference, accept: ValidationAcceptor): void {
        if (!isSpecializableTermReference(specRef)) {
            throw new Error('Expected a SpecializableTermReference in validation but got the wrong type');
        }

        const specTerm = this.extractSpecializableTermFromReference(specRef);

        if (specRef.ownedSpecializations) {
            const reported = new Set();
            specRef.ownedSpecializations.forEach((spec, i) => {
                if (spec.specializedTerm.ref && specTerm) {
                    if (spec.specializedTerm.ref.name == specTerm.name) {
                        accept('warning', `${specTerm.name} specializes itself`, {node: specRef, property: 'ownedSpecializations', index: i});
                    }
                    if (reported.has(spec.specializedTerm.ref.name)) {
                        accept('warning', `${specTerm.name} specializes ${spec.specializedTerm.ref.name} twice`, {node: specRef, property: 'ownedSpecializations', index: i});
                    }
                    reported.add(spec.specializedTerm.ref.name);
                }
            })
        }
    }

    checkValidFacetedScalarRegularExpression(facetScalar: FacetedScalar, accept: ValidationAcceptor): void {
        if (!isFacetedScalar(facetScalar)) {
            throw new Error('Expected a FacetedScalar in validation but got the wrong type');
        }

        if (facetScalar.pattern == undefined)
            return;

        try {
            new RegExp(facetScalar.pattern);
        } catch(e) {
            accept('warning', `'${facetScalar.pattern}' is not a valid regular expression`, {node: facetScalar, property: 'pattern'});
        }
    }

    checkConsistentFacetedScalarRanges(facetScalar: FacetedScalar, accept: ValidationAcceptor): void {
        if (!isFacetedScalar(facetScalar)) {
            throw new Error('Expected a FacetedScalar in validation but got the wrong type');
        }
        
        // Check consistent minLength and maxLength
        if (facetScalar.minLength != undefined && facetScalar.maxLength != undefined) {
            if (facetScalar.maxLength.value < facetScalar.minLength.value) {
                accept('error', `${facetScalar.name} has a minLength that is greater than its maxLength`, {node: facetScalar, property: 'minLength'});
                accept('error', `${facetScalar.name} has a maxLength that is less than its minLength`, {node: facetScalar, property: 'maxLength'});
            }
        }

        // Check consistent minInclusive and maxInclusive
        if (facetScalar.minInclusive != undefined && facetScalar.maxInclusive != undefined) {
            if ((isIntegerLiteral(facetScalar.minInclusive) && isIntegerLiteral(facetScalar.maxInclusive)) ||
                    (isDecimalLiteral(facetScalar.minInclusive) && isDecimalLiteral(facetScalar.maxInclusive)) ||
                    (isDoubleLiteral(facetScalar.minInclusive) && isDoubleLiteral(facetScalar.maxInclusive))) {
                if (facetScalar.maxInclusive.value < facetScalar.minInclusive.value) {
                    accept('error', `${facetScalar.name} has a minInclusive value that is greater than its maxInclusive value`, {node: facetScalar, property: 'minInclusive'});
                    accept('error', `${facetScalar.name} has a maxInclusive value that is less than its minInclusive value`, {node: facetScalar, property: 'maxInclusive'});    
                }
            }
        }

        // Check consistent minExclusive and maxExclusive
        if (facetScalar.minExclusive != undefined && facetScalar.maxExclusive != undefined) {
            if ((isIntegerLiteral(facetScalar.minExclusive) && isIntegerLiteral(facetScalar.maxExclusive)) ||
                    (isDecimalLiteral(facetScalar.minExclusive) && isDecimalLiteral(facetScalar.maxExclusive)) ||
                    (isDoubleLiteral(facetScalar.minExclusive) && isDoubleLiteral(facetScalar.maxExclusive))) {
                if (facetScalar.maxExclusive.value < facetScalar.minExclusive.value) {
                    accept('error', `${facetScalar.name} has a minExclusive value that is greater than its maxExclusive value`, {node: facetScalar, property: 'minExclusive'});
                    accept('error', `${facetScalar.name} has a maxExclusive value that is less than its minExclusive value`, {node: facetScalar, property: 'maxExclusive'});    
                }
            }
        }
    }

    checkFacetedScalarCorrectDefinitions(facetScalar: FacetedScalar, accept: ValidationAcceptor): void {
        if (!isFacetedScalar(facetScalar)) {
            throw new Error('Expected a FacetedScalar in validation but got the wrong type');
        }
        
        if (facetScalar.minInclusive != undefined || facetScalar.maxInclusive != undefined ||
                facetScalar.minExclusive != undefined || facetScalar.maxExclusive != undefined) {
            if (facetScalar.minLength != undefined)
                accept('error', `minLength cannot be defined in ${facetScalar.name} if any inclusive/exclusive properties are defined`, {node: facetScalar, keyword: 'minLength'});
            if (facetScalar.maxLength != undefined)
                accept('error', `maxLength cannot be defined in ${facetScalar.name} if any inclusive/exclusive properties are defined`, {node: facetScalar, keyword: 'maxLength'});
            if (facetScalar.length != undefined)
                accept('error', `length cannot be defined in ${facetScalar.name} if any inclusive/exclusive properties are defined`, {node: facetScalar, keyword: 'length'});
            if (facetScalar.pattern != undefined)
                accept('error', `pattern cannot be defined in ${facetScalar.name} if any inclusive/exclusive properties are defined`, {node: facetScalar, keyword: 'pattern'});
            if (facetScalar.language != undefined)
                accept('error', `language cannot be defined in ${facetScalar.name} if any inclusive/exclusive properties are defined`, {node: facetScalar, keyword: 'language'});
        }
    }

    checkConsistentScalarCorrectTypes(facetScalar: FacetedScalar, accept: ValidationAcceptor): void {
        if (!isFacetedScalar(facetScalar)) {
            throw new Error('Expected a FacetedScalar in validation but got the wrong type');
        }

        // Check correct minInclusive type
        if (facetScalar.minInclusive != undefined) {
            if (isBooleanLiteral(facetScalar.minInclusive)) {
                accept('error', `minInclusive cannot be of type BooleanLiteral`, {node: facetScalar, property: 'minInclusive'});
            }

            if ((facetScalar.maxInclusive != undefined && facetScalar.minInclusive.$type != facetScalar.maxInclusive.$type) ||
                    (facetScalar.minExclusive != undefined && facetScalar.minInclusive.$type != facetScalar.minExclusive.$type) ||
                    (facetScalar.maxExclusive != undefined && facetScalar.minInclusive.$type != facetScalar.maxExclusive.$type)) {
                accept('error', `minInclusive must have a type consistent with all other inclusive/exclusive types`, {node: facetScalar, property: 'minInclusive'});
            }
        }

        // Check correct maxInclusive type
        if (facetScalar.maxInclusive != undefined) {
            if (isBooleanLiteral(facetScalar.maxInclusive)) {
                accept('error', `maxInclusive cannot be of type BooleanLiteral`, {node: facetScalar, property: 'maxInclusive'});
            }

            if ((facetScalar.minInclusive != undefined && facetScalar.maxInclusive.$type != facetScalar.minInclusive.$type) ||
            (facetScalar.minExclusive != undefined && facetScalar.maxInclusive.$type != facetScalar.minExclusive.$type) ||
            (facetScalar.maxExclusive != undefined && facetScalar.maxInclusive.$type != facetScalar.maxExclusive.$type)) {
                accept('error', `maxInclusive must have a type consistent with all other inclusive/exclusive types`, {node: facetScalar, property: 'maxInclusive'});
            }
        }

        // Check correct minExclusive type
        if (facetScalar.minExclusive != undefined) {
            if (isBooleanLiteral(facetScalar.minExclusive)) {
                accept('error', `minExclusive cannot be of type BooleanLiteral`, {node: facetScalar, property: 'minExclusive'});
            }

            if ((facetScalar.minInclusive != undefined && facetScalar.minExclusive.$type != facetScalar.minInclusive.$type) ||
            (facetScalar.maxInclusive != undefined && facetScalar.minExclusive.$type != facetScalar.maxInclusive.$type) ||
            (facetScalar.maxExclusive != undefined && facetScalar.minExclusive.$type != facetScalar.maxExclusive.$type)) {
                accept('error', `minExclusive must have a type consistent with all other inclusive/exclusive types`, {node: facetScalar, property: 'minExclusive'});
            }
        }

        // Check correct maxExclusive type
        if (facetScalar.maxExclusive != undefined) {
            if (isBooleanLiteral(facetScalar.maxExclusive)) {
                accept('error', `maxExclusive cannot be of type BooleanLiteral`, {node: facetScalar, property: 'maxExclusive'});
            }

            if ((facetScalar.minInclusive != undefined && facetScalar.maxExclusive.$type != facetScalar.minInclusive.$type) ||
            (facetScalar.maxInclusive != undefined && facetScalar.maxExclusive.$type != facetScalar.maxInclusive.$type) ||
            (facetScalar.minExclusive != undefined && facetScalar.maxExclusive.$type != facetScalar.minExclusive.$type)) {
                accept('error', `maxExclusive must have a type consistent with all other inclusive/exclusive types`, {node: facetScalar, property: 'maxExclusive'});
            }
        }
    }

    checkRelationEntityLogicalConsistency(relationEntity: RelationEntity, accept: ValidationAcceptor): void {
        if (!isRelationEntity(relationEntity)) {
            throw new Error('Expected a RelationEntity in validation but got the wrong type');
        }
        
        if (relationEntity.symmetric && relationEntity.asymmetric) {
            accept('error', `${relationEntity.name} cannot be both symmetric and asymmetric`, {node: relationEntity, keyword: "symmetric"});
            accept('error', `${relationEntity.name} cannot be both symmetric and asymmetric`, {node: relationEntity, keyword: "asymmetric"});
        }

        if (relationEntity.reflexive && relationEntity.irreflexive) {
            accept('error', `${relationEntity.name} cannot be both reflexive and irreflexive`, {node: relationEntity, keyword: "reflexive"});
            accept('error', `${relationEntity.name} cannot be both reflexive and irreflexive`, {node: relationEntity, keyword: "irreflexive"});
        }
    }

    checkFacetedScalarSpecialization(facetScalar: FacetedScalar, accept: ValidationAcceptor): void {
        if (!isFacetedScalar(facetScalar)) {
            throw new Error('Expected a FacetedScalar in validation but got the wrong type');
        }

        // Warn for any FacetedScalar with no specializations (that isn't one of the standard types)
        if (facetScalar.ownedSpecializations == undefined || facetScalar.ownedSpecializations.length == 0) {
            accept('warning', `Only the standard scalars should have no specializations`, {node: facetScalar, property: 'name'});
        }

        // Error for a FacetedScalar with any facets to have more than one specialization
        if ((facetScalar.length != undefined || facetScalar.minLength != undefined || facetScalar.maxLength != undefined ||
            facetScalar.pattern != undefined || facetScalar.language != undefined || facetScalar.minInclusive != undefined ||
            facetScalar.minExclusive != undefined || facetScalar.maxInclusive != undefined || facetScalar.maxExclusive != undefined) &&
            facetScalar.ownedSpecializations && facetScalar.ownedSpecializations.length > 1) {
                for (let i = 1; i < facetScalar.ownedSpecializations.length; i++) {
                    accept('error', `${facetScalar.name} specializes multiple supertypes but has declared facets`, {node: facetScalar, property: 'ownedSpecializations', index: i});
                }
            }
    }

    checkEnumeratedScalarSpecialization(enumScalar: EnumeratedScalar, accept: ValidationAcceptor): void {
        if (!isEnumeratedScalar(enumScalar)) {
            throw new Error('Expected an EnumeratedScalar in validation but got the wrong type');
        }

        if (enumScalar.ownedSpecializations && enumScalar.ownedSpecializations.length > 0 && enumScalar.literals && enumScalar.literals.length > 0) {
            for (let i = 0; i < enumScalar.ownedSpecializations.length; i++) {
                accept('error', `${enumScalar.name} specializes a supertype but also has enumerated literals`, {node: enumScalar, property: 'ownedSpecializations', index: i});
            }
            for (let i = 0; i < enumScalar.literals.length; i++) {
                accept('error', `${enumScalar.name} has enumerated literals but also specializes a supertype`, {node: enumScalar, property: 'literals', index: i});
            }
        }
    }

    checkEnumeratedScalarNoDuplications(enumScalar: EnumeratedScalar, accept: ValidationAcceptor): void {
        if (!isEnumeratedScalar(enumScalar)) {
            throw new Error('Expected an EnumeratedScalar in validation but got the wrong type');
        }

        enumScalar.literals.forEach((val1, ind1) => {
            for (let ind2 = 0; ind2 < enumScalar.literals.length; ind2++) {
                let val2 = enumScalar.literals[ind2];
                if (val1.$type == val2.$type && val1.value == val2.value && ind1 != ind2) {
                    accept('error', `Cannot declare duplicate literals within an enumerated scalar`, {node: enumScalar, property: 'literals', index: ind1});
                    break;
                }
            }
        });
    }

    checkVocabularyNamesUnique(vocab: Vocabulary, accept: ValidationAcceptor): void {
        if (!isVocabulary(vocab)) {
            throw new Error('Expected a Vocabulary in validation but got the wrong type');
        }

        this.checkOntNamesUniqueImpl(vocab, accept);
    }

    checkDescriptionNamesUnique(desc: Description, accept: ValidationAcceptor): void {
        if (!isDescription(desc)) {
            throw new Error('Expected a Description in validation but got the wrong type');
        }

        this.checkOntNamesUniqueImpl(desc, accept);
    }

    private checkOntNamesUniqueImpl(ont: Vocabulary | Description, accept: ValidationAcceptor): void {
        const reported = new Set();
        reported.add(ont.prefix);
        if (ont.ownedImports) {
            ont.ownedImports.forEach(imp => {
                if (imp.prefix) {
                    if (reported.has(imp.prefix)) {
                        accept('error', `${imp.prefix} has duplicate ID`, {node: imp, property: 'prefix'});
                    }
                    reported.add(imp.prefix);
                }
            })
        }
        if (ont.ownedStatements) {
            ont.ownedStatements.forEach(stmt => {
                if (isMember(stmt)) {
                    if (reported.has(stmt.name)) {
                        accept('error', `${stmt.name} has duplicate ID`, {node: stmt, property: 'name'});
                    }
                    reported.add(stmt.name);
                }
                // Special case for RelationEntities that can define a ForwardRelation or ReverseRelation
                if (isRelationEntity(stmt)) {
                    if (stmt.forwardRelation) {
                        if (reported.has(stmt.forwardRelation.name)) {
                            accept('error', `${stmt.forwardRelation.name} has duplicate ID`, {node: stmt.forwardRelation, property: 'name'});
                        }
                        reported.add(stmt.forwardRelation.name);
                    }
                    if (stmt.reverseRelation) {
                        if (reported.has(stmt.reverseRelation.name)) {
                            accept('error', `${stmt.reverseRelation.name} has duplicate ID`, {node: stmt.reverseRelation, property: 'name'});
                        }
                        reported.add(stmt.reverseRelation.name);
                    }
                }
            })
        }
    }

    checkVocabularyBundleNamesUnique(vocabBundle: VocabularyBundle, accept: ValidationAcceptor): void {
        if (!isVocabularyBundle(vocabBundle)) {
            throw new Error('Expected a VocabularyBundle in validation but got the wrong type');
        }

        this.checkBundleNamesUnique(vocabBundle, accept)
    }

    checkDescriptionBundleNamesUnique(descBundle: DescriptionBundle, accept: ValidationAcceptor): void {
        if (!isVocabularyBundle(descBundle)) {
            throw new Error('Expected a VocabularyBundle in validation but got the wrong type');
        }

        this.checkBundleNamesUnique(descBundle, accept)
    }

    private checkBundleNamesUnique(bundle: VocabularyBundle | DescriptionBundle, accept: ValidationAcceptor): void {
        const reported = new Set();
        reported.add(bundle.prefix);
        if (bundle.ownedImports) {
            bundle.ownedImports.forEach(imp => {
                if (imp.prefix) {
                    if (reported.has(imp.prefix)) {
                        accept('error', `${imp.prefix} has duplicate ID`, {node: imp, property: 'prefix'});
                    }
                    reported.add(imp.prefix);
                }
            })
        }
    }

    checkEntityHasConsistentKeys(entity: Entity, accept: ValidationAcceptor): void {
        if (!isEntity(entity)) {
            throw new Error('Expected an Entity in validation but got the wrong type');
        }

        // Do not check if the entity has no owned keys
        if (entity.ownedKeys == undefined)
            return;

        // Create a map of keys and number of occurences for the entity
        let keyCount = new Map();
        entity.ownedKeys.forEach(keyAxiom => {
            keyAxiom.properties.forEach(key => {
                if (key.ref != undefined) {
                    if (keyCount.has(key.ref.name))
                        keyCount.set(key.ref.name, keyCount.get(key.ref.name)+1);
                    else
                        keyCount.set(key.ref.name, 1);
                }
            });
        });

        // Check for keys that appear multiple times
        entity.ownedKeys.forEach((keyAxiom, ind) => {
            for (let ii = 0; ii < keyAxiom.properties.length; ii++) {
                let key = keyAxiom.properties[ii];
                if (key.ref != undefined && 1 < keyCount.get(key.ref.name)) {
                    accept('warning', `${entity.name} should not contain duplicate keys`, {node: entity, property: 'ownedKeys', index: ind});
                    break;
                }
            }
        });
    }

    checkConsistentScalarPropertyRangeRestrictionAxiom(axiom: ScalarPropertyRangeRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isScalarPropertyRangeRestrictionAxiom(axiom)) {
            throw new Error('Expected an ScalarPropertyRangeRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isScalarPropertyRangeRestrictionAxiom(axiom2))
                continue;
            
            /**
             * ScalarPropertyRangeRestrictionAxiom:
             * restricts [axiom.kind] scalar property [axiom.property] to [axiom.range]
             */

            // Check for matches
            if (axiom.property.$refText == axiom2.property.$refText && axiom.range.$refText == axiom2.range.$refText) {
                // Check for duplicate axiom
                if (axiom.kind == axiom2.kind) {
                    // We will find the axiom at least once
                    if (!foundAxiom) {
                        foundAxiom = true;
                    // We've found the axiom more than once
                    } else {
                        accept('warning', `Duplicate restriction axiom`, {node: axiom});
                    }
                }

                // Check if axiom is "some" when we already have "all"
                if (axiom.kind == "some" && axiom2.kind == "all") {
                    accept('warning', `There is already a restriction axiom that restricts all ${axiom.property.$refText} to ${axiom.range.$refText}`, {node: axiom});
                }
            }
        }
    }

    checkConsistentStructuredPropertyRangeRestrictionAxiom(axiom: StructuredPropertyRangeRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isStructuredPropertyRangeRestrictionAxiom(axiom)) {
            throw new Error('Expected an StructuredPropertyRangeRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isStructuredPropertyRangeRestrictionAxiom(axiom2))
                continue;
            
            /**
             * StructuredPropertyRangeRestrictionAxiom:
             * restricts [axiom.kind] structured property [axiom.property] to [axiom.range]
             */
            
            // Check for matches
            if (axiom.property.$refText == axiom2.property.$refText && axiom.range.$refText == axiom2.range.$refText) {
                // Check for duplicate axiom
                if (axiom.kind == axiom2.kind) {
                    // We will find the axiom at least once
                    if (!foundAxiom) {
                        foundAxiom = true;
                    // We've found the axiom more than once
                    } else {
                        accept('warning', `Duplicate restriction axiom`, {node: axiom});
                    }
                }

                // Check if axiom is "some" when we already have "all"
                if (axiom.kind == "some" && axiom2.kind == "all") {
                    accept('warning', `There is already a restriction axiom that restricts all ${axiom.property.$refText} to ${axiom.range.$refText}`, {node: axiom});
                }
            }
        }
    }

    checkConsistentScalarPropertyCardinalityRestrictionAxiom(axiom: ScalarPropertyCardinalityRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isScalarPropertyCardinalityRestrictionAxiom(axiom)) {
            throw new Error('Expected an ScalarPropertyCardinalityRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isScalarPropertyCardinalityRestrictionAxiom(axiom2))
                continue;
            
            /**
             * ScalarPropertyCardinalityRestrictionAxiom:
             * restricts scalar property [axiom.property] to [axiom.kind] [axiom.cardinality] [axiom.range]?
             */

            // Check for matches
            if (axiom.property.$refText == axiom2.property.$refText && ((axiom.range == undefined && axiom2.range == undefined) ||
                    (axiom.range && axiom2.range && axiom.range.$refText == axiom2.range.$refText))) {
                // Check for duplicate axiom
                if (axiom.kind == axiom2.kind && axiom.cardinality.value == axiom2.cardinality.value) {
                    // We will find the axiom at least once
                    if (!foundAxiom) {
                        foundAxiom = true;
                    // We've found the axiom more than once
                    } else {
                        accept('warning', `Duplicate restriction axiom`, {node: axiom});
                    }
                }

                // Check if axiom is "min" or "max" when we already have an "exactly"
                if ((axiom.kind == "min" || axiom.kind == "max") && axiom2.kind == "exactly") {
                    accept('warning', `There is already a restriction axiom that restricts ${axiom.property.$refText} to exactly ${axiom2.cardinality.value}${axiom.range ? ` ${axiom.range.$refText}` : ''}`, {node: axiom});
                }

                // Check if max < min
                else if (axiom.kind == "max" && axiom2.kind == "min" && axiom.cardinality.value < axiom2.cardinality.value) {
                    accept('error', `There is already a restriction axiom with a minimum value of ${axiom2.cardinality.value}, which is greater than the maximum value of ${axiom.cardinality.value}`, {node: axiom});
                }

                // check if min > max
                else if (axiom.kind == "min" && axiom2.kind == "max" && axiom2.cardinality.value < axiom.cardinality.value) {
                    accept('error', `There is already a restriction axiom with a maximum value of ${axiom2.cardinality.value}, which is less than the minimum value of ${axiom.cardinality.value}`, {node: axiom});
                }
            }
        }
    }

    checkConsistentStructuredPropertyCardinalityRestrictionAxiom(axiom: StructuredPropertyCardinalityRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isStructuredPropertyCardinalityRestrictionAxiom(axiom)) {
            throw new Error('Expected an StructuredPropertyCardinalityRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isStructuredPropertyCardinalityRestrictionAxiom(axiom2))
                continue;
            
            /**
             * StructuredPropertyCardinalityRestrictionAxiom:
             * restricts structured property [axiom.property] to [axiom.kind] [axiom.cardinality] [axiom.range]?
             */

            // Check for matches
            if (axiom.property.$refText == axiom2.property.$refText && ((axiom.range == undefined && axiom2.range == undefined) ||
                    (axiom.range && axiom2.range && axiom.range.$refText == axiom2.range.$refText))) {
                // Check for duplicate axiom
                if (axiom.kind == axiom2.kind && axiom.cardinality.value == axiom2.cardinality.value) {
                    // We will find the axiom at least once
                    if (!foundAxiom) {
                        foundAxiom = true;
                    // We've found the axiom more than once
                    } else {
                        accept('warning', `Duplicate restriction axiom`, {node: axiom});
                    }
                }

                // Check if axiom is "min" or "max" when we already have an "exactly"
                if ((axiom.kind == "min" || axiom.kind == "max") && axiom2.kind == "exactly") {
                    accept('warning', `There is already a restriction axiom that restricts ${axiom.property.$refText} to exactly ${axiom2.cardinality.value}${axiom.range ? ` ${axiom.range.$refText}` : ''}`, {node: axiom});
                }

                // Check if max < min
                else if (axiom.kind == "max" && axiom2.kind == "min" && axiom.cardinality.value < axiom2.cardinality.value) {
                    accept('error', `There is already a restriction axiom with a minimum value of ${axiom2.cardinality.value}, which is greater than the maximum value of ${axiom.cardinality.value}`, {node: axiom});
                }

                // check if min > max
                else if (axiom.kind == "min" && axiom2.kind == "max" && axiom2.cardinality.value < axiom.cardinality.value) {
                    accept('error', `There is already a restriction axiom with a maximum value of ${axiom2.cardinality.value}, which is less than the minimum value of ${axiom.cardinality.value}`, {node: axiom});
                }
            }
        }
    }

    checkConsistentScalarPropertyValueRestrictionAxiom(axiom: ScalarPropertyValueRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isScalarPropertyValueRestrictionAxiom(axiom)) {
            throw new Error('Expected an ScalarPropertyValueRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isScalarPropertyValueRestrictionAxiom(axiom2))
                continue;
            
            /**
             * ScalarPropertyValueRestrictionAxiom:
             * restricts scalar property [axiom.property] to [axiom.value]
             */

            // Check for multiple axioms
            if (axiom.property.$refText == axiom2.property.$refText ) {
                // Duplicate axioms
                if (axiom.value.value == axiom2.value.value) {
                    // We will find the axiom at least once
                    if (!foundAxiom) {
                        foundAxiom = true;
                    // We've found the axiom more than once
                    } else {
                        accept('warning', `Duplicate value restriction axiom`, {node: axiom});
                    }
                // Different value restriction axioms
                } else {
                    accept('error', `Multiple value restriction axioms for ${axiom.property.$refText}`, {node: axiom});
                }
            }
        }
    }

    checkConsistentStructuredPropertyValueRestrictionAxiom(axiom: StructuredPropertyValueRestrictionAxiom, accept: ValidationAcceptor): void {
        if (!isStructuredPropertyValueRestrictionAxiom(axiom)) {
            throw new Error('Expected an StructuredPropertyValueRestrictionAxiom in validation but got the wrong type');
        }

        if (!isClassifier(axiom.$container) || !axiom.$container.ownedPropertyRestrictions)
            return;

        var foundAxiom = false;
        for (let ii = 0; ii < axiom.$container.ownedPropertyRestrictions.length; ii++) {
            let axiom2 = axiom.$container.ownedPropertyRestrictions[ii];
            if (!isStructuredPropertyValueRestrictionAxiom(axiom2))
                continue;
            
            /**
             * StructuredPropertyValueRestrictionAxiom:
             * restricts scalar property [axiom.property] to [axiom.value]
             */

            // Check for duplicate axioms
            if (axiom.property.$refText == axiom2.property.$refText) {
                // We will find the axiom at least once
                if (!foundAxiom) {
                    foundAxiom = true;
                // We've found the axiom more than once
                } else {
                    accept('error', `Multiple value restriction axioms for ${axiom.property.$refText}`, {node: axiom});
                }
            }
        }
    }
}
