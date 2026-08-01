// Shared dark-mode + color-theme signal/persistence machinery for both apps.
// Each app's own ThemeService (still its own @Injectable, still the thing
// components inject) extends this and implements two hooks: where the
// signed-in user's saved preferences come from (`loadProfile$`) and how to
// write changes back (`persist`) - the reader resolves/writes via
// LibraryUserService keyed by email, the manager via UserService keyed by
// uid. Everything else (the signals, the <html> class-toggling effects, the
// localStorage bootstrap-before-auth layering) lives here once.

import { computed, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

const DARK_MODE_KEY = 'darkMode';
const LIGHT_COLOR_THEME_KEY = 'lightColorTheme';
const DARK_COLOR_THEME_KEY = 'darkColorTheme';

/** Ids match the `.theme-{id}` classes in _theme-palettes.scss. Shown in each
 *  app's Settings page Color Theme dropdown as swatches (+ name), never as
 *  raw ids. `'default'` is the app's original base theme and needs no extra
 *  class (see BaseThemeService's color-theme effect). */
export const LIGHT_COLOR_THEMES: readonly string[] = ['default', 'ocean', 'forest', 'sunset', 'berry', 'crimson', 'navy'];
export const DARK_COLOR_THEMES: readonly string[] = ['default', 'midnight', 'emerald', 'amber', 'plum', 'ruby', 'navy', 'matrix'];
export const DEFAULT_COLOR_THEME = 'default';

export interface ThemePreferences {
  darkMode?: boolean;
  lightColorTheme?: string;
  darkColorTheme?: string;
}

/**
 * App-wide dark mode + color theme toggle. `localStorage` is the fast,
 * pre-auth bootstrap value (there's no Firestore access before sign-in, and
 * reading it synchronously avoids a flash of the wrong theme while the
 * profile loads); once the signed-in user's profile loads via `loadProfile$`,
 * its fields become the source of truth and follow them across devices.
 * `setDarkMode`/`setColorTheme` write both.
 *
 * Light and dark mode each have their own independent color theme choice
 * (`lightColorTheme`/`darkColorTheme`) rather than a single shared value,
 * since LIGHT_COLOR_THEMES/DARK_COLOR_THEMES are different catalogs -
 * toggling dark mode switches which one is active without losing the other.
 */
export abstract class BaseThemeService {
  readonly darkMode = signal<boolean>(this.readInitialDarkMode());
  readonly lightColorTheme = signal<string>(this.readInitialColorTheme(LIGHT_COLOR_THEME_KEY));
  readonly darkColorTheme = signal<string>(this.readInitialColorTheme(DARK_COLOR_THEME_KEY));

  /** The color theme actually in effect right now, given the current mode. */
  readonly activeColorTheme = computed(() => (this.darkMode() ? this.darkColorTheme() : this.lightColorTheme()));

  /** Tracks whichever `theme-{id}` class is currently applied to <html>, so
   *  the next change can remove exactly that one rather than guessing. */
  private appliedThemeClass: string | undefined;

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark-theme', this.darkMode());
      localStorage.setItem(DARK_MODE_KEY, String(this.darkMode()));
    });

    effect(() => localStorage.setItem(LIGHT_COLOR_THEME_KEY, this.lightColorTheme()));
    effect(() => localStorage.setItem(DARK_COLOR_THEME_KEY, this.darkColorTheme()));

    effect(() => {
      const theme = this.activeColorTheme();
      if (this.appliedThemeClass) {
        document.documentElement.classList.remove(this.appliedThemeClass);
        this.appliedThemeClass = undefined;
      }
      if (theme !== DEFAULT_COLOR_THEME) {
        this.appliedThemeClass = `theme-${theme}`;
        document.documentElement.classList.add(this.appliedThemeClass);
      }
    });
  }

  /**
   * Wires up syncing from `loadProfile$()` into the signals above. Not run
   * automatically from this base constructor: a subclass's own fields
   * (e.g. an injected AuthService/UserService that `loadProfile$` reads)
   * aren't initialized yet while `super()` is still running - per JS class
   * semantics, derived-class field initializers run *after* `super()`
   * returns. Each subclass must call this itself, once, at the end of its
   * own constructor (after its fields are set).
   */
  protected initRemoteSync(): void {
    const profile = toSignal(this.loadProfile$(), { initialValue: undefined });
    effect(() => {
      const remoteDarkMode = profile()?.darkMode;
      if (remoteDarkMode !== undefined && remoteDarkMode !== this.darkMode()) {
        this.darkMode.set(remoteDarkMode);
      }
      const remoteLight = profile()?.lightColorTheme;
      if (remoteLight !== undefined && remoteLight !== this.lightColorTheme()) {
        this.lightColorTheme.set(remoteLight);
      }
      const remoteDark = profile()?.darkColorTheme;
      if (remoteDark !== undefined && remoteDark !== this.darkColorTheme()) {
        this.darkColorTheme.set(remoteDark);
      }
    });
  }

  setDarkMode(value: boolean): void {
    this.darkMode.set(value);
    void this.persist({ darkMode: value });
  }

  /** Sets the color theme for whichever mode (light/dark) is currently active. */
  setColorTheme(value: string): void {
    if (this.darkMode()) {
      this.darkColorTheme.set(value);
      void this.persist({ darkColorTheme: value });
    } else {
      this.lightColorTheme.set(value);
      void this.persist({ lightColorTheme: value });
    }
  }

  /** Resolves to the signed-in user's saved theme preferences (or undefined
   *  if signed out / no profile yet). Emits again whenever the profile
   *  changes, so a preference set on another device is picked up here too. */
  protected abstract loadProfile$(): Observable<ThemePreferences | undefined>;

  /** Persists a partial preference change for the signed-in user. A no-op
   *  (never called) while signed out. */
  protected abstract persist(changes: ThemePreferences): Promise<void>;

  private readInitialDarkMode(): boolean {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private readInitialColorTheme(key: string): string {
    return localStorage.getItem(key) ?? DEFAULT_COLOR_THEME;
  }
}
