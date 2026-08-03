import { Component } from '@angular/core';

import { ResumePage } from './resume/resume-page/resume-page';

@Component({
  selector: 'app-root',
  imports: [ResumePage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
