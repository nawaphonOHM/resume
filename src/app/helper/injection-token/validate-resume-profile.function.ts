import { inject, InjectionToken } from '@angular/core';
import { isRecord } from './is-record.function.ts';
import { assertNonEmptyStringArray } from './assert-non-empty-string-array.function.ts';
import { assertNonEmptyString } from './assert-non-empty-string.function.ts';
import { PHONE_LABEL } from './phone-lable-variable.ts';
import { assertEmploymentTypes } from './assert-employment-types.function.ts';
import { PHONE_PATTERN } from './phone-pattern.variable.ts';

/** Validates publication-critical fields before constructing a résumé PDF. */
export const validateResumeProfile = new InjectionToken<(profile: unknown) => void>(
  'validateResumeProfile',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (
        isRecordFn: (value: unknown) => value is Record<string, unknown>,
        assertNonEmptyStringArrayFn: (
          value: unknown,
          fieldName: string,
        ) => asserts value is string[],
        assertNonEmptyStringFn: (value: unknown, fieldName: string) => asserts value is string,
        phoneLabel: string,
        assertEmploymentTypesFn: (value: unknown, fieldName: string) => void,
        phonePattern: RegExp,
      ) => {
        return (profile: unknown): void => {
          if (!isRecordFn(profile)) {
            throw new Error('The résumé profile is required.');
          }

          assertNonEmptyStringFn(profile['name'], 'name');
          assertNonEmptyStringFn(profile['title'], 'title');
          assertNonEmptyStringArrayFn(profile['summary'], 'summary');
          assertNonEmptyStringArrayFn(profile['skills'], 'skills');

          const details = profile['details'];
          if (!isRecordFn(details)) {
            throw new Error('The résumé profile details are required.');
          }

          for (const [fieldName, value] of Object.entries(details)) {
            assertNonEmptyStringFn(value, `details.${fieldName}`);
          }

          if (details['phoneLabel'] !== phoneLabel) {
            throw new Error(`The résumé phone value must remain "${phoneLabel}".`);
          }

          const education = profile['education'];
          if (!isRecordFn(education)) {
            throw new Error('The résumé education is required.');
          }

          for (const fieldName of ['degree', 'institution', 'period', 'gpax']) {
            assertNonEmptyStringFn(education[fieldName], `education.${fieldName}`);
          }

          const seniorProject = education['seniorProject'];
          if (!isRecordFn(seniorProject)) {
            throw new Error('The résumé education seniorProject is required.');
          }

          assertNonEmptyStringFn(seniorProject['name'], 'education.seniorProject.name');
          const projectUrl = seniorProject['url'];
          assertNonEmptyStringFn(projectUrl, 'education.seniorProject.url');

          let parsedProjectUrl: URL;
          try {
            parsedProjectUrl = new URL(projectUrl);
          } catch {
            throw new Error(`The résumé education project link is invalid: ${projectUrl}`);
          }

          if (parsedProjectUrl.protocol !== 'https:') {
            throw new Error(`The résumé education project link must use HTTPS: ${projectUrl}`);
          }

          const links = profile['links'];
          if (!Array.isArray(links) || links.length === 0) {
            throw new Error('The résumé links must contain at least one item.');
          }

          for (const [index, link] of links.entries()) {
            const label = isRecordFn(link) ? link['label'] : undefined;
            const url = isRecordFn(link) ? link['url'] : undefined;
            assertNonEmptyStringFn(label, `links[${index}].label`);
            assertNonEmptyStringFn(url, `links[${index}].url`);

            if (/^tel:/i.test(url)) {
              throw new Error('The résumé contains a telephone link and cannot be published.');
            }

            let parsedUrl: URL;
            try {
              parsedUrl = new URL(url);
            } catch {
              throw new Error(`The résumé link is invalid: ${url}`);
            }

            if (parsedUrl.protocol !== 'https:') {
              throw new Error(`The résumé link must use HTTPS: ${url}`);
            }
          }

          const experienceEntries = profile['experience'];
          if (!Array.isArray(experienceEntries) || experienceEntries.length === 0) {
            throw new Error('The résumé experience must contain at least one item.');
          }

          for (const [index, experience] of experienceEntries.entries()) {
            const experienceRecord = isRecordFn(experience) ? experience : {};

            for (const fieldName of ['role', 'company', 'location', 'period']) {
              assertNonEmptyStringFn(
                experienceRecord[fieldName],
                `experience[${index}].${fieldName}`,
              );
            }

            assertEmploymentTypesFn(
              experienceRecord['employmentTypes'],
              `experience[${index}].employmentTypes`,
            );
            assertNonEmptyStringArrayFn(
              experienceRecord['highlights'],
              `experience[${index}].highlights`,
            );
            assertNonEmptyStringArrayFn(
              experienceRecord['technologies'],
              `experience[${index}].technologies`,
            );
          }

          const serializedProfile = JSON.stringify(profile);

          if (phonePattern.test(serializedProfile)) {
            throw new Error('The résumé contains phone data and cannot be published.');
          }

          if (/tel:/i.test(serializedProfile)) {
            throw new Error('The résumé contains a telephone link and cannot be published.');
          }
        };
      };

      return fn(
        inject(isRecord),
        inject(assertNonEmptyStringArray),
        inject(assertNonEmptyString),
        inject(PHONE_LABEL),
        inject(assertEmploymentTypes),
        inject(PHONE_PATTERN),
      );
    },
  },
);
