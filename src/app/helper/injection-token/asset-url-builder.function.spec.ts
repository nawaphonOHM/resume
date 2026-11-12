import { TestBed } from '@angular/core/testing';

import { assetUrlBuilder, createAssetUrlBuilder } from './asset-url-builder.function.ts';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';

describe('assetUrlBuilder', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('builds flattened asset URLs from the default origin', () => {
    TestBed.configureTestingModule({});
    const builder = TestBed.inject(assetUrlBuilder);

    expect(builder.file('mysql.svg')).toBe('https://ohm-mho.space/assets/mysql.svg');
  });

  it('encodes filenames as a single URL path segment', () => {
    const builder = createAssetUrlBuilder('https://assets.example.com/');

    expect(builder.file('resume file.pdf')).toBe(
      'https://assets.example.com/assets/resume%20file.pdf',
    );
  });

  it('encodes the compact status JSON as the complete favicon query string', () => {
    const builder = createAssetUrlBuilder('https://assets.example.com///');

    expect(builder.favicon('available')).toBe(
      'https://assets.example.com/assets/favicon.svg?%7B%22status%22%3A%22available%22%7D',
    );
  });

  it('uses an overridden asset origin and removes trailing slashes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: IMAGE_ASSET_ORIGIN, useValue: 'https://custom.example.com///' }],
    });
    const builder = TestBed.inject(assetUrlBuilder);

    expect(builder.file('github.svg')).toBe('https://custom.example.com/assets/github.svg');
  });
});
