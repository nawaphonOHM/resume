import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeProfile } from '../../helper/resume-profile/resume-profile.interface.ts';
import { ImageZoomDirective } from '../../directive/image-zome/image-zoom.directive.ts';

/** Presents the candidate's skills, public details, and external profile links. */
@Component({
  selector: 'app-profile-sidebar',
  imports: [
    ImageZoomDirective,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    NgOptimizedImage,
  ],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.scss',
})
export class ProfileSidebar {
  /** Complete profile supplying both sidebar sections and their link metadata. */
  readonly profile = input.required<ResumeProfile>();

  /** @returns A direct email URI for the profile's public address. */
  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
