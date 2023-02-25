Axiom missing PropertyRestrictionAxiom and subtypes from RestrictionAxiom: 'PropertyRestrictionAxiom' | 'ScalarPropertyCardinalityRestrictionAxiom' | 'ScalarPropertyRangeRestrictionAxiom' | 'ScalarPropertyRestrictionAxiom' | 'ScalarPropertyValueRestrictionAxiom' | 'StructuredPropertyCardinalityRestrictionAxiom' | 'StructuredPropertyRangeRestrictionAxiom' | 'StructuredPropertyRestrictionAxiom' | 'StructuredPropertyValueRestrictionAxiom'

Type (and supertypes SpecializableTerm, Term, Member, IdentifiedElement, AnnotatedElement, VocabularyStatement, Statement) missing Entity and subtypes from Classifier: 'Aspect' | 'Concept' | 'Entity' | 'RelationEntity'

Statement missing SpecializableTerm and its multiple-inherited subtypes from VocabularyStatement: 'AnnotationProperty' | 'ScalarProperty' | 'SpecializableTerm' | 'StructuredProperty'

SpecializableTermReference (and supertypes OmlReference, VocabularyStatement, Statement) missing EntityReference and subtypes from ClassifierReference: 'AspectReference' | | 'ConceptReference' | 'EntityReference' | 'RelationEntityReference' | 'StructureReference'

OmlReference missing ClassifierReference and subtypes from SpecializableTermReference: 'ClassifierReference' | 'StructureReference'

VocabularyStatement (and supertype Statement) missing ClassifierReference and subtypes from SpecializableTermReference: 'ClassifierReference' | 'StructureReference'

Term (and supertypes Member, IdentifiedElement, AnnotatedElement) missing Type and subtypes from SpecializableTerm: 'Classifier' | 'EnumeratedScalar' | 'FacetedScalar' | 'Scalar' | 'Structure' | 'Type'

VocabularyStatement (and supertype Statement) missing Type and subtypes from SpecializableTerm: 'Classifier' | 'EnumeratedScalar' | 'FacetedScalar' | 'Scalar' | 'Structure' | 'Type'

IdentifiedElement (and supertype AnnotatedElement) missing Term and subtypes from Member: 'AnnotationProperty' | 'Feature' | 'ForwardRelation' | 'Property' | 'Relation' | 'ReverseRelation' | 'ScalarProperty' | 'SpecializableTerm' | 'StructuredProperty' | 'Term'

Feature (and supertypes Term, Member, IdentifiedElement, AnnotatedElement) missing SemanticProperty and subtypes from Property: 'ScalarProperty' | 'SemanticProperty' | 'StructuredProperty'