import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, PLATFORM_ID, computed, inject, signal, Service } from '@angular/core';
import type { ResumeTheme } from '../type/resume-theme.type.ts';
import { RESUME_THEME_STORAGE_KEY } from '../injection-token/resume-theme-storage-key.variable.ts';
import { THEME_CLASSES } from '../injection-token/theme-classes.variable.ts';
import { THEME_TRANSITION_CLASS } from '../injection-token/theme-transition-class.variable.ts';
import { THEME_TRANSITION_DURATION_MS } from '../injection-token/theme-transition-duration-ms.variable.ts';

/**
 * Resolves the active résumé theme and synchronizes it with document classes.
 *
 * @remarks
 * ### Theme Precedence Hierarchy
 * The active color scheme is resolved using the following order of precedence:
 * 1. **Stored Explicit Preference**: A valid theme ('light' | 'dark') saved in `localStorage`.
 * 2. **System Media Query**: When no stored choice exists, tracks `window.matchMedia('(prefers-color-scheme: dark)')`.
 * 3. **Application Fallback**: Defaults to 'light' during SSR or when media queries are unavailable.
 *
 * ```
 *                       +-----------------------------------+
 *                       |  localStorage['theme'] available? |
 *                       +-----------------+-----------------+
 *                                         |
 *                        +----------------+----------------+
 *                        | YES                             | NO
 *                        v                                 v
 *            +-----------------------+         +-----------------------+
 *            | Stored Explicit Theme |         | prefers-color-scheme  |
 *            | ('light' | 'dark')    |         | dark -> 'dark'        |
 *            | (System updates off)  |         | light -> 'light'      |
 *            +-----------------------+         | (System updates live) |
 *                                              +-----------------------+
 * ```
 *
 * ### Print Override State Machine
 * Printing requires high-contrast, ink-safe styling:
 * - `beforeprint`: Temporarily sets document classes to `resume-theme-light` without modifying the reactive
 *   `theme` signal or mutating `localStorage`.
 * - `afterprint`: Restores document classes matching the user's selected `theme` signal.
 *
 * ### Animated Transition Debounce
 * Switching themes applies a transient CSS marker class (`resume-theme-transitioning`) for 250ms
 * (`THEME_TRANSITION_DURATION_MS`) to smooth color token interpolation. Rapid toggling resets the timer
 * to prevent premature class removal.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resumeThemeStorageKey = inject(RESUME_THEME_STORAGE_KEY);
  private readonly themeClasses = inject(THEME_CLASSES);
  private readonly themeTransitionClass = inject(THEME_TRANSITION_CLASS);
  private readonly themeTransitionDurationMs = inject(THEME_TRANSITION_DURATION_MS);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;
  private readonly mediaQuery = this.view?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  private hasExplicitChoice = false;
  private isPrinting = false;
  private transitionCleanupTimer: number | null = null;

  /** Selected preference, independent of the temporary light print theme. */
  readonly theme = signal<ResumeTheme>('light');

  /** Whether the selected preference is dark. */
  readonly isDark = computed(() => this.theme() === 'dark');

  /**
   * Restores the initial preference, applies it, and registers browser
   * preference and print lifecycle listeners when those APIs are available.
   */
  constructor() {
    const storedTheme = this.readStoredTheme();
    this.hasExplicitChoice = storedTheme !== null;
    this.theme.set(storedTheme ?? (this.mediaQuery?.matches ? 'dark' : 'light'));
    this.applyTheme(this.theme());

    this.mediaQuery?.addEventListener('change', this.handleSystemThemeChange);
    this.view?.addEventListener('beforeprint', this.handleBeforePrint);
    this.view?.addEventListener('afterprint', this.handleAfterPrint);

    this.destroyRef.onDestroy(() => {
      this.mediaQuery?.removeEventListener('change', this.handleSystemThemeChange);
      this.view?.removeEventListener('beforeprint', this.handleBeforePrint);
      this.view?.removeEventListener('afterprint', this.handleAfterPrint);
      this.cancelThemeTransition();
    });
  }

  /** Switches to the opposite theme and records it as an explicit choice. */
  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  /**
   * Applies and persists an explicit theme preference.
   *
   * @param theme - Theme to expose through signals and document classes.
   * @remarks A transient root marker is added only when the selected value
   * changes; repeated assignments are still persisted as an explicit choice.
   */
  setTheme(theme: ResumeTheme): void {
    if (theme !== this.theme()) {
      this.startThemeTransition();
    }

    this.hasExplicitChoice = true;
    this.theme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  /**
   * Follows system preference changes only until the reader makes an explicit
   * choice. During printing, state is updated but the forced light classes are
   * retained until printing finishes.
   */
  private readonly handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.hasExplicitChoice) {
      return;
    }

    const theme: ResumeTheme = event.matches ? 'dark' : 'light';
    this.theme.set(theme);

    if (!this.isPrinting) {
      this.applyTheme(theme);
    }
  };

  /** Forces print-safe light classes without overwriting the selected theme. */
  private readonly handleBeforePrint = (): void => {
    this.isPrinting = true;
    this.cancelThemeTransition();
    this.applyTheme('light');
  };

  /** Restores document classes for the selected theme after printing. */
  private readonly handleAfterPrint = (): void => {
    this.isPrinting = false;
    this.applyTheme(this.theme());
  };

  /** Replaces the managed root theme class so schemes remain exclusive. */
  private applyTheme(theme: ResumeTheme): void {
    this.document.documentElement.classList.remove(...this.themeClasses);
    this.document.documentElement.classList.add(`resume-theme-${theme}`);
  }

  /**
   * Adds the animated-transition marker and restarts its cleanup window so
   * rapid changes cannot let an older timer remove the current marker early.
   */
  private startThemeTransition(): void {
    if (!this.view) {
      return;
    }

    if (this.transitionCleanupTimer !== null) {
      this.view.clearTimeout(this.transitionCleanupTimer);
    }

    this.document.documentElement.classList.add(this.themeTransitionClass);
    this.transitionCleanupTimer = this.view.setTimeout(() => {
      this.transitionCleanupTimer = null;
      this.document.documentElement.classList.remove(this.themeTransitionClass);
    }, this.themeTransitionDurationMs);
  }

  /** Clears pending cleanup and removes the transition marker immediately. */
  private cancelThemeTransition(): void {
    if (this.transitionCleanupTimer !== null) {
      this.view?.clearTimeout(this.transitionCleanupTimer);
      this.transitionCleanupTimer = null;
    }

    this.document.documentElement.classList.remove(this.themeTransitionClass);
  }

  /**
   * Reads a supported explicit preference when browser storage is accessible.
   *
   * @returns A stored theme, or `null` when absent, invalid, or unavailable.
   */
  private readStoredTheme(): ResumeTheme | null {
    try {
      const storedTheme = this.view?.localStorage.getItem(this.resumeThemeStorageKey);
      return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
    } catch {
      return null;
    }
  }

  /**
   * Best-effort persistence that leaves the in-memory and document themes
   * usable when browser storage rejects access.
   */
  private persistTheme(theme: ResumeTheme): void {
    try {
      this.view?.localStorage.setItem(this.resumeThemeStorageKey, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}
