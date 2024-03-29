/******************************************************************************
 * This file was generated by langium-cli 1.1.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import { LangiumGeneratedServices, LangiumGeneratedSharedServices, LangiumSharedServices, LangiumServices, LanguageMetaData, Module } from 'langium';
import { OmlAstReflection } from './ast';
import { OmlGrammar } from './grammar';

export const OmlLanguageMetaData: LanguageMetaData = {
    languageId: 'oml',
    fileExtensions: ['.oml'],
    caseInsensitive: false
};

export const OmlGeneratedSharedModule: Module<LangiumSharedServices, LangiumGeneratedSharedServices> = {
    AstReflection: () => new OmlAstReflection()
};

export const OmlGeneratedModule: Module<LangiumServices, LangiumGeneratedServices> = {
    Grammar: () => OmlGrammar(),
    LanguageMetaData: () => OmlLanguageMetaData,
    parser: {}
};
