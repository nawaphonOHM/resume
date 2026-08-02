import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeProfile } from './resume.model';

@Component({
  selector: 'app-hero-section',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {
  readonly profile = input.required<ResumeProfile>();

  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
