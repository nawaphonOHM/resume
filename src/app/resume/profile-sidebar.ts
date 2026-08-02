import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeProfile } from './resume.model';

@Component({
  selector: 'app-profile-sidebar',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatDividerModule, MatIconModule],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.scss',
})
export class ProfileSidebar {
  readonly profile = input.required<ResumeProfile>();

  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
