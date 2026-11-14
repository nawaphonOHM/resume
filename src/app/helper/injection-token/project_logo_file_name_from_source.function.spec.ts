import { TestBed } from '@angular/core/testing';

import { PROJECT_LOGO_FILE_NAME_FROM_SOURCE } from './project_logo_file_name_from_source.function.ts';
import { PROJECT_LOGO_FILE_NAMES_BY_PATH } from './project-logo-file-names-by-path.variable.ts';
import { PROJECT_LOGO_ORIGIN } from './project-logo-origin.variable.ts';

describe('PROJECT_LOGO_FILE_NAME_FROM_SOURCE', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('resolves known logo paths when called outside an injection context', () => {
    TestBed.configureTestingModule({});
    const fileNameFromSource = TestBed.inject(PROJECT_LOGO_FILE_NAME_FROM_SOURCE);

    expect(fileNameFromSource('/company-logos/accord-innovations.png')).toBe(
      'accord-innovations.png',
    );
    expect(fileNameFromSource('https://ohm-mho.space/company-logos/accord-innovations.png')).toBe(
      'accord-innovations.png',
    );
  });

  it('uses overridden path mappings and logo origin', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PROJECT_LOGO_FILE_NAMES_BY_PATH,
          useValue: new Map([['/custom-logos/custom.svg', 'custom.svg']]),
        },
        { provide: PROJECT_LOGO_ORIGIN, useValue: 'https://logos.example.com' },
      ],
    });
    const fileNameFromSource = TestBed.inject(PROJECT_LOGO_FILE_NAME_FROM_SOURCE);

    expect(fileNameFromSource('/custom-logos/custom.svg')).toBe('custom.svg');
    expect(fileNameFromSource('https://logos.example.com/custom-logos/custom.svg')).toBe(
      'custom.svg',
    );
  });

  it('rejects untrusted, malformed, and non-string sources', () => {
    TestBed.configureTestingModule({});
    const fileNameFromSource = TestBed.inject(PROJECT_LOGO_FILE_NAME_FROM_SOURCE);

    expect(
      fileNameFromSource('https://untrusted.example.com/company-logos/accord-innovations.png'),
    ).toBeUndefined();
    expect(
      fileNameFromSource('https://ohm-mho.space/company-logos/accord-innovations.png?size=large'),
    ).toBeUndefined();
    expect(fileNameFromSource('https://[invalid')).toBeUndefined();
    expect(fileNameFromSource(42)).toBeUndefined();
  });
});
