import {
    createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject,
    LangiumServices, LangiumSharedServices, Module, PartialLangiumServices
} from 'langium';
import { OmlGeneratedModule, OmlGeneratedSharedModule } from './generated/module';
import { OmlValidator, registerValidationChecks } from './oml-validator';
import { OmlScopeComputation } from './oml-scope';
import { OmlLinker } from './oml-linker';
import { OmlRenameProvider } from './oml-rename-refactoring';
import { OmlIRIProvider } from './oml-iri';
import { OmlScopeProvider } from './oml-scope-provider';
import { OmlHoverProvider } from './oml-hover';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type OmlAddedServices = {
    validation: {
        OmlValidator: OmlValidator
    },
    references: {
        OmlIRI: OmlIRIProvider
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type OmlServices = LangiumServices & OmlAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const OmlModule: Module<OmlServices, PartialLangiumServices & OmlAddedServices> = {
    validation: {
        OmlValidator: () => new OmlValidator()
    },
    references: {
        ScopeComputation: (services) => new OmlScopeComputation(services),
        ScopeProvider: (services) => new OmlScopeProvider(services),
        Linker: (services) => new OmlLinker(services),
        OmlIRI: () => new OmlIRIProvider(),
    },
    lsp: {
        RenameProvider: (services) => new OmlRenameProvider(services),
        HoverProvider: (services) => new OmlHoverProvider(services),
    }
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createOmlServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    Oml: OmlServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        OmlGeneratedSharedModule
    );
    const Oml = inject(
        createDefaultModule({ shared }),
        OmlGeneratedModule,
        OmlModule
    );
    shared.ServiceRegistry.register(Oml);
    registerValidationChecks(Oml);
    return { shared, Oml };
}
