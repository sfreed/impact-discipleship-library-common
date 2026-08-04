import { InjectionToken } from '@angular/core';

/**
 * Minimal shape shared components in this submodule (e.g.
 * GroupWizardDialogComponent) need to translate their own static chrome text
 * without depending on either app's own concrete translation service - each
 * app provides its own implementation for CHROME_TEXT_SERVICE at its root
 * (see impact-discipleship-library-new's ChromeTranslationService, which
 * implements this interface directly).
 *
 * The reader app resolves `t`/`html` against the signed-in patron's
 * preferred language via `commonTranslations` (see ChromeTranslationService's
 * own doc comment). The manager app - whose staff use its own UI in English
 * regardless of any patron's language preference - provides a no-op
 * implementation instead (see NOOP_CHROME_TEXT_SERVICE below), so this
 * component stays reusable by both apps without coupling the submodule to
 * either one's DI graph.
 */
export interface ChromeTextService {
  t(text: string, params?: Record<string, string | number>): string;
  html(text: string): string;
}

export const CHROME_TEXT_SERVICE = new InjectionToken<ChromeTextService>('CHROME_TEXT_SERVICE');

function substitute(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

/** Passthrough implementation - returns `text` itself (with `{token}`
 *  params substituted) unchanged. Provide this for CHROME_TEXT_SERVICE in
 *  any app that doesn't (yet) have its own translation lookup, so a shared
 *  component can always inject CHROME_TEXT_SERVICE unconditionally. */
export const NOOP_CHROME_TEXT_SERVICE: ChromeTextService = {
  t: (text, params) => (params ? substitute(text, params) : text),
  html: (text) => text,
};
