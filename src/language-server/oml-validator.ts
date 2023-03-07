import { ValidationAcceptor, ValidationChecks } from 'langium';
import { isAnnotationPropertyReference, isAspect, isAspectReference, isConceptReference, isEntity, isEnumeratedScalarReference, isFacetedScalarReference, isRelationEntityReference, isScalarPropertyReference, isSpecializableTerm, isSpecializableTermReference, isStructuredPropertyReference, isStructureReference, OmlAstType, SpecializableTerm, SpecializableTermReference } from './generated/ast';
import type { OmlServices } from './oml-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: OmlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.OmlValidator;
    const checks: ValidationChecks<OmlAstType> = {
        SpecializableTerm: [validator.checkSpecializationTypesMatch, validator.checkDuplicateSpecializations],
        SpecializableTermReference: [validator.checkReferenceSpecializationTypeMatch, validator.checkReferenceDuplicateSpecializations]
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

    checkDuplicateSpecializations(specTerm: SpecializableTerm, accept: ValidationAcceptor): void {
        if (!isSpecializableTerm(specTerm)) {
            throw new Error('Expected a SpecializableTerm in validation but got the wrong type');
        }

        if (specTerm.ownedSpecializations) {
            const reported = new Set();
            specTerm.ownedSpecializations.forEach(spec => {
                if (spec.specializedTerm.ref) {
                    if (spec.specializedTerm.ref.name == specTerm.name) {
                        accept('warning', `${specTerm.name} specializes itself`, {node: specTerm, property: 'ownedSpecializations'});
                    }
                    if (reported.has(spec.specializedTerm.ref.name)) {
                        accept('warning', `${specTerm.name} specializes ${spec.specializedTerm.ref.name} twice`, {node: specTerm, property: 'ownedSpecializations'});
                    }
                    reported.add(spec.specializedTerm.ref.name);
                }
            })
        }
    }

    extractSpecializableTermFromReference(specRef: SpecializableTermReference) : SpecializableTerm | null {
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

    checkReferenceDuplicateSpecializations(specRef: SpecializableTermReference, accept: ValidationAcceptor): void {
        if (!isSpecializableTermReference(specRef)) {
            throw new Error('Expected a SpecializableTermReference in validation but got the wrong type');
        }

        const specTerm = this.extractSpecializableTermFromReference(specRef);

        if (specRef.ownedSpecializations) {
            const reported = new Set();
            specRef.ownedSpecializations.forEach(spec => {
                if (spec.specializedTerm.ref && specTerm) {
                    if (spec.specializedTerm.ref.name == specTerm.name) {
                        accept('warning', `${specTerm.name} specializes itself`, {node: specRef, property: 'ownedSpecializations'});
                    }
                    if (reported.has(spec.specializedTerm.ref.name)) {
                        accept('warning', `${specTerm.name} specializes ${spec.specializedTerm.ref.name} twice`, {node: specRef, property: 'ownedSpecializations'});
                    }
                    reported.add(spec.specializedTerm.ref.name);
                }
            })
        }
    }

}
