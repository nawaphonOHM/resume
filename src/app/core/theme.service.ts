import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

/** Color schemes that can be selected and persisted for the résumé. */
export type ResumeTheme = 'light' | 'dark';

/** Browser storage key containing the reader's explicit theme preference. */
export const RESUME_THEME_STORAGE_KEY = 'resume-profile-theme';

/** Mutually exclusive root classes managed by the service. */
const THEME_CLASSES = ['resume-theme-light', 'resume-theme-dark'] as const;

/** Root marker that enables the stylesheet's animated token transition. */
const THEME_TRANSITION_CLASS = 'resume-theme-transitioning';

/** Time after which the transient theme-transition marker is removed. */
const THEME_TRANSITION_DURATION_MS = 250;

/**
 * Resolves the active résumé theme and synchronizes it with document classes.
 *
 * @remarks
 * A valid stored choice takes precedence over the system color-scheme
 * preference. Without an explicit choice, system changes remain live. Printing
 * temporarily forces light document classes without changing the selected
 * signal or persisted value, and all listeners and pending transition cleanup
 * are released when the service is destroyed. Unavailable browser storage is
 * treated as optional rather than as an application error.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
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
    this.document.documentElement.classList.remove(...THEME_CLASSES);
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

    this.document.documentElement.classList.add(THEME_TRANSITION_CLASS);
    this.transitionCleanupTimer = this.view.setTimeout(() => {
      this.transitionCleanupTimer = null;
      this.document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
    }, THEME_TRANSITION_DURATION_MS);
  }

  /** Clears pending cleanup and removes the transition marker immediately. */
  private cancelThemeTransition(): void {
    if (this.transitionCleanupTimer !== null) {
      this.view?.clearTimeout(this.transitionCleanupTimer);
      this.transitionCleanupTimer = null;
    }

    this.document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
  }

  /**
   * Reads a supported explicit preference when browser storage is accessible.
   *
   * @returns A stored theme, or `null` when absent, invalid, or unavailable.
   */
  private readStoredTheme(): ResumeTheme | null {
    try {
      const storedTheme = this.view?.localStorage.getItem(RESUME_THEME_STORAGE_KEY);
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
      this.view?.localStorage.setItem(RESUME_THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}
