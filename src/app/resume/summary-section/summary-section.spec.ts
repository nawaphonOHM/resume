/**
 * Verifies SummarySection rendering of ordered summary cards, card index formatting,
 * accessibility semantics, and data fidelity with string array inputs.
 */
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SummarySection } from './summary-section';
import { resumeProfileFixture } from '../../../../test/fixtures/resume-profile.ts';

describe('SummarySection', () => {
  const sampleSummaries: readonly string[] = [
    'Experienced engineer specialized in full-stack cloud systems.',
    'Led migration of monolithic architectures to resilient event-driven microservices.',
    'Passionate about web performance, accessibility, and modern front-end frameworks.',
  ];

  it('renders all summary statements as numbered cards with two-digit index formatting', () => {
    const fixture = TestBed.createComponent(SummarySection);
    fixture.componentRef.setInput('summary', sampleSummaries);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('.summary-card'));
    const numbers = Array.from(element.querySelectorAll('.summary-number'));
    const paragraphs = Array.from(
      element.querySelectorAll<HTMLParagraphElement>('.summary-card mat-card-content > p'),
    );

    expect(cards).toHaveLength(3);
    expect(numbers.map((num) => num.textContent.trim())).toEqual(['01', '02', '03']);
    expect(paragraphs.map((p) => p.textContent.trim())).toEqual(sampleSummaries);

    // Verify aria-hidden on decorative index numbers
    for (const numberEl of numbers) {
      expect(numberEl.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('preserves section landmark and accessibility heading associations', () => {
    const fixture = TestBed.createComponent(SummarySection);
    fixture.componentRef.setInput('summary', sampleSummaries);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector<HTMLElement>('section#about');

    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-resume-section')).toBe('');
    expect(section?.getAttribute('aria-labelledby')).toBe('summary-title');

    const heading = element.querySelector<HTMLElement>('#summary-title');
    expect(heading).not.toBeNull();
    expect(heading?.textContent.trim()).toBe('From interface to infrastructure');
  });

  it('renders correctly with fixture summaries', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(SummarySection);
    fixture.componentRef.setInput('summary', fullData.summary);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('.summary-card'));

    expect(cards).toHaveLength(fullData.summary.length);
    for (let i = 0; i < fullData.summary.length; i++) {
      const cardText = cards[i].textContent;
      expect(cardText).toContain(fullData.summary[i]);
      expect(cardText).not.toContain('[object Object]');
    }
  });
});
