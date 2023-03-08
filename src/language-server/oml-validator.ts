import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    isAnnotationPropertyReference,
    isAspect,
    isAspectReference,
    isConceptReference,
    isEntity,
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
    isDoubleLiteral
} from './generated/ast';
import type { OmlServices } from './oml-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: OmlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.OmlValidator;
    const checks: ValidationChecks<OmlAstType> = {
        SpecializableTerm: validator.checkSpecializationTypesMatch,
        SpecializableTermReference: validator.checkReferenceSpecializationTypeMatch,
        FacetedScalar: [validator.checkConsistentFacetedScalarRanges, validator.checkFacetedScalarCorrectDefinitions, validator.checkConsistentScalarCorrectTypes],
        RelationEntity: validator.checkRelationEntityLogicalConsistency
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
            specTerm.ownedSpecializations.forEach(spec => {
                if (spec.specializedTerm.ref) {
                    // A SpecializableTerm can only specialize its own type, except any Entity (Aspect, Concept, or RelationEntity) can specialize an Aspect
                    if (!(spec.specializedTerm.ref.$type == specTerm.$type || (isEntity(specTerm) && isAspect(spec.specializedTerm.ref)))) {
                        accept('error', `${specTerm.name} is of type ${specTerm.$type} but is trying to specialize ${spec.specializedTerm.ref.name} of type ${spec.specializedTerm.ref.$type}`, {node: specTerm, property: 'ownedSpecializations'});
                    }
                }
            })
        }
    }

    checkReferenceSpecializationTypeMatch(specRef: SpecializableTermReference, accept: ValidationAcceptor): void {
        if (!isSpecializableTermReference(specRef)) {
            throw new Error('Expected a SpecializableTermReference in validation but got the wrong type');
        }

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

        if (specRef.ownedSpecializations) {
            specRef.ownedSpecializations.forEach(spec => {
                if (spec.specializedTerm.ref && specTerm) {
                    // A SpecializableTerm can only specialize its own type, except any Entity (Aspect, Concept, or RelationEntity) can specialize an Aspect
                    if (!(spec.specializedTerm.ref.$type == specTerm.$type || (isEntity(specTerm) && isAspect(spec.specializedTerm.ref)))) {
                        accept('error', `${specTerm.name} is of type ${specTerm.$type} but is trying to specialize ${spec.specializedTerm.ref.name} of type ${spec.specializedTerm.ref.$type}`, {node: specRef, property: 'ownedSpecializations'});
                    }
                }
            })
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
}
