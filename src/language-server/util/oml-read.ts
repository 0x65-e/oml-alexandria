import { SpecializableTerm, SpecializationAxiom } from "../generated/ast";

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
export function closure<T, V extends T>(root: V, includeRoot: boolean, recursive: RecursiveCallback<T>): Array<T> {
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
function closureImpl<T, V extends T>(root: V, cache: Set<T>, recursive: RecursiveCallback<T>): void {
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
