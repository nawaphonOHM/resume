import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ResumePdfConfirmDialog } from './resume-pdf-confirm-dialog';
import type { ResumePdfConfirmDialogResult } from '../../../../helper/type/resume-pdf-confirm-dialog-result.type.ts';

@Component({
  template: '',
})
class TestHostComponent {
  readonly name = 'test-host';
}

describe('ResumePdfConfirmDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, ResumePdfConfirmDialog, TestHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    const dialog = TestBed.inject(MatDialog);
    dialog.closeAll();
  });

  it('renders with alertdialog role, dialog title, message, and action buttons', () => {
    const fixture = TestBed.createComponent(ResumePdfConfirmDialog);
    fixture.detectChanges();

    const hostElement = fixture.nativeElement as HTMLElement;
    expect(hostElement.getAttribute('role')).toBe('alertdialog');

    const titleElement = hostElement.querySelector<HTMLElement>('[mat-dialog-title]');
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent.trim()).toBe('Confirm Download');

    const contentElement = hostElement.querySelector<HTMLElement>('mat-dialog-content');
    expect(contentElement).not.toBeNull();
    expect(contentElement?.textContent.trim()).toBe(
      'The file may be unavailable. Do you confirm to continue?',
    );

    const buttons = Array.from(hostElement.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons).toHaveLength(2);

    const [cancelButton, continueButton] = buttons;
    expect(cancelButton.textContent.trim()).toBe('Cancel');
    expect(continueButton.textContent.trim()).toBe('Continue');
    expect(continueButton.hasAttribute('cdkfocusinitial')).toBe(true);
  });

  it('closes dialog with false when Cancel button is clicked', async () => {
    const dialog = TestBed.inject(MatDialog);
    const dialogRef = dialog.open<ResumePdfConfirmDialog, unknown, ResumePdfConfirmDialogResult>(
      ResumePdfConfirmDialog,
    );
    dialogRef.componentRef?.changeDetectorRef.detectChanges();

    const closedPromise = firstValueFrom(dialogRef.afterClosed());

    const overlayElement = document.querySelector<HTMLElement>('.mat-mdc-dialog-container');
    expect(overlayElement).not.toBeNull();

    const cancelButton = overlayElement?.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:first-child',
    );
    expect(cancelButton).not.toBeNull();
    expect(cancelButton?.textContent.trim()).toBe('Cancel');

    cancelButton?.click();

    const result = await closedPromise;
    expect(result).toBe(false);
  });

  it('closes dialog with true when Continue button is clicked', async () => {
    const dialog = TestBed.inject(MatDialog);
    const dialogRef = dialog.open<ResumePdfConfirmDialog, unknown, ResumePdfConfirmDialogResult>(
      ResumePdfConfirmDialog,
    );
    dialogRef.componentRef?.changeDetectorRef.detectChanges();

    const closedPromise = firstValueFrom(dialogRef.afterClosed());

    const overlayElement = document.querySelector<HTMLElement>('.mat-mdc-dialog-container');
    expect(overlayElement).not.toBeNull();

    const continueButton = overlayElement?.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:last-child',
    );
    expect(continueButton).not.toBeNull();
    expect(continueButton?.textContent.trim()).toBe('Continue');

    continueButton?.click();

    const result = await closedPromise;
    expect(result).toBe(true);
  });

  it('dismisses dialog without confirmation when closed programmatically or via backdrop/escape', async () => {
    const dialog = TestBed.inject(MatDialog);
    const dialogRef = dialog.open<ResumePdfConfirmDialog, unknown, ResumePdfConfirmDialogResult>(
      ResumePdfConfirmDialog,
    );

    const closedPromise = firstValueFrom(dialogRef.afterClosed());
    dialogRef.close();

    const result = await closedPromise;
    expect(result).toBeUndefined();
  });
});
