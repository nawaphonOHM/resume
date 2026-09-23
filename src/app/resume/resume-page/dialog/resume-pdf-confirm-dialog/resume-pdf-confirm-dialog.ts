import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

/**
 * Accessible confirmation dialog prompted when the user initiates a download for a potentially
 * unavailable résumé PDF asset.
 */
@Component({
  selector: 'app-resume-pdf-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './resume-pdf-confirm-dialog.html',
  host: {
    role: 'alertdialog',
    class: 'resume-pdf-confirm-dialog block',
  },
})
export class ResumePdfConfirmDialog {
  protected readonly dialogTitle = 'Confirm Download';
}
