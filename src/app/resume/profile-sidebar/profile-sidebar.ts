import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeProfile } from '../../helper/interface/resume-profile/resume-profile.interface.ts';

/** Presents the candidate's skills and public profile details. */
@Component({
  selector: 'app-profile-sidebar',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
  ],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.scss',
})
export class ProfileSidebar {
  /** Complete profile supplying the sidebar sections. */
  readonly profile = input.required<ResumeProfile>();

  /** @returns A direct email URI for the profile's public address. */
  private emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
