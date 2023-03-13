import { AstNode, Reference } from "langium";
import {
  Import,
  isDescription,
  isDescriptionBundle,
  isMember,
  isOntology,
  isVocabulary,
  isVocabularyBundle,
  Member,
  Ontology,
  SpecializableTerm,
  SpecializationAxiom,
} from "../generated/ast";
import { getRootContainer } from "./oml-search";

export interface RecursiveCallback<T> {
  (arg: T): Array<T>;
}

/**
 * Gets the closure of the given recursive function starting from a given root
 *
 * @param root the given root to start the recursion from
 * @param includeRoot whether to include the root in the closure results
 * @param recursive the function to recurse with
 * @return the recursive closure of applying the given function on the given root
 */
export function closure<T, V extends T>(
  root: V,
  includeRoot: boolean,
  recursive: RecursiveCallback<T>
): Array<T> {
  const results: Set<T> = new Set<T>();
  if (includeRoot) results.add(root);
  closureImpl(root, results, recursive);
  return new Array<T>(...results);
}

/**
 * Recurses on the given function starting from a given root skipping results already in the cache
 *
 * Updates the cache with the collected results at the end of this recursion cycle
 *
 * @param root the given root to start the recursion from
 * @param cache the cache of results already collected before the recursion starts
 * @param recursive the function to recurse with
 */
function closureImpl<T, V extends T>(
  root: V,
  cache: Set<T>,
  recursive: RecursiveCallback<T>
): void {
  let results: Array<T> = recursive(root);
  results = results.filter((r) => !cache.has(r));
  results.forEach((r) => cache.add(r));
  results.forEach((r) => closureImpl(r, cache, recursive));
}

/**
 * Gets the super (general) term of the given specialization axiom
 *
 * @param axiom the given specialization axiom
 * @return the super term of the given specialization axiom
 */
export function getSuperTerm(axiom: SpecializationAxiom): SpecializableTerm {
  return axiom.specializedTerm.ref as SpecializableTerm;
}

/**
 * Gets the direct imports of the given ontology
 *
 * @param ontology the given ontology
 * @return a list of direct imports of the ontology
 */
export function getImports(ontology: Ontology): Import[] {
  const imports: Import[] = [];
  if (isVocabulary(ontology)) {
    imports.push(...ontology.ownedImports);
  } else if (isVocabularyBundle(ontology)) {
    imports.push(...ontology.ownedImports);
  } else if (isDescription(ontology)) {
    imports.push(...ontology.ownedImports);
  } else if (isDescriptionBundle(ontology)) {
    imports.push(...ontology.ownedImports);
  }
  return imports;
}

/**
 * Gets a map from import namespaces to import prefixes in the given ontology
 *
 * @param ontology the given ontology
 * @return a map from import namespaces to import prefixes
 */
export function getImportPrefixes(ontology: Ontology): Map<String, String> {
  const map = new Map();
  getImports(ontology)
    .filter((i) => i.prefix)
    .forEach((i) => map.set(i.namespace, i.prefix));
  return map;
}

/**
 * Gets the prefix of a given ontology imported by a context ontology
 *
 * This could either be the given ontology's regular prefix or an override
 * used when importing it in the context ontology
 *
 * @param ontology the imported ontology
 * @param context the context ontology
 * @return
 */
export function getPrefixIn(
  ontology: Ontology,
  context: Ontology
): String | undefined {
  if (ontology == context) {
    return ontology.prefix;
  } else {
    return getImportPrefixes(context).get(ontology.namespace);
  }
}

/**
 * Gets the abbreviated IRI of this element
 *
 * @param member the given member
 * @param context the given context ontology
 * @return the abbreviated IRI of the given reference in the given context ontology
 */
export function getAbbreviatedIri(node: Member): string {
  const ontology = getRootContainer(node);
  let _xifexpression = null;
  if (ontology && isOntology(ontology)) {
    const _prefix = ontology.prefix;
    _xifexpression = _prefix + ":";
  } else {
    _xifexpression = "";
  }
  const prefix = _xifexpression;
  const _name = node.name;
  return prefix + _name;
}

/**
 * Gets the abbreviated iri of the given member in the given context ontology
 *
 * @param member the given member
 * @param context the given context ontology
 * @return the abbreviated IRI of the given reference in the given context ontology
 */
export function getAbbreviatedIriIn(member: Member, context: Ontology) {
  const ontology = getRootContainer(member);
  if (ontology == context) {
    return member.name;
  } else if (isOntology(ontology)) {
    const prefix = getPrefixIn(ontology, context);
    return prefix != null ? prefix + ":" + member.name : null;
  } else {
    return "";
  }
}

/**
 * Gets the abbreviated iri of the given reference
 *
 * @param reference the given reference
 * @return the abbreviated IRI of the given reference
 */
export function getAbbreviatedIriRef(reference: Reference<AstNode>) {
  const member = reference.ref;
  const ontology = member ? getRootContainer(member) : undefined;
  if (member && ontology && isOntology(ontology) && isMember(member)) {
    return getAbbreviatedIriIn(member, ontology);
  }
  return "";
}
