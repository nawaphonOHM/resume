import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root application shell that hosts the routed single-page résumé. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
