import { Component } from '@angular/core';

import { ResumePage } from './resume/resume-page/resume-page';

/** Root application shell that hosts the single-page résumé. */
@Component({
  selector: 'app-root',
  imports: [ResumePage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
