import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';

/** Root application shell that hosts the routed single-page résumé and initial loading indicator. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressSpinner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Indicates whether the application shell is waiting for initial or in-flight route resolution. */
  readonly isRouteLoading = signal(true);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof RouteConfigLoadStart) {
        this.isRouteLoading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isRouteLoading.set(false);
      }
    });
  }
}
