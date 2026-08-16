import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/** Displays the ordered professional-summary statements as numbered cards. */
@Component({
  selector: 'app-summary-section',
  imports: [MatCardModule],
  templateUrl: './summary-section.html',
  styleUrl: './summary-section.scss',
})
export class SummarySection {
  /** Summary statements to render without reordering or rewriting their content. */
  readonly summary = input.required<readonly string[]>();
}
