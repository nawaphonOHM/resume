import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-summary-section',
  imports: [MatCardModule],
  templateUrl: './summary-section.html',
  styleUrl: './summary-section.scss',
})
export class SummarySection {
  readonly summary = input.required<readonly string[]>();
}
