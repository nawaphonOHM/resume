import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ResumeTheme = 'light' | 'dark';

export const RESUME_THEME_STORAGE_KEY = 'resume-theme';

const THEME_CLASSES = ['resume-theme-light', 'resume-theme-dark'] as const;
const THEME_TRANSITION_CLASS = 'resume-theme-transitioning';
const THEME_TRANSITION_DURATION_MS = 250;

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

  readonly theme = signal<ResumeTheme>('light');
  readonly isDark = computed(() => this.theme() === 'dark');

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

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: ResumeTheme): void {
    if (theme !== this.theme()) {
      this.startThemeTransition();
    }

    this.hasExplicitChoice = true;
    this.theme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

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

  private readonly handleBeforePrint = (): void => {
    this.isPrinting = true;
    this.cancelThemeTransition();
    this.applyTheme('light');
  };

  private readonly handleAfterPrint = (): void => {
    this.isPrinting = false;
    this.applyTheme(this.theme());
  };

  private applyTheme(theme: ResumeTheme): void {
    this.document.documentElement.classList.remove(...THEME_CLASSES);
    this.document.documentElement.classList.add(`resume-theme-${theme}`);
  }

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

  private cancelThemeTransition(): void {
    if (this.transitionCleanupTimer !== null) {
      this.view?.clearTimeout(this.transitionCleanupTimer);
      this.transitionCleanupTimer = null;
    }

    this.document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
  }

  private readStoredTheme(): ResumeTheme | null {
    try {
      const storedTheme = this.view?.localStorage.getItem(RESUME_THEME_STORAGE_KEY);
      return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
    } catch {
      return null;
    }
  }

  private persistTheme(theme: ResumeTheme): void {
    try {
      this.view?.localStorage.setItem(RESUME_THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}
