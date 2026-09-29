/** Verifies 2D periodic motion orbital position calculation, fundamental period derivation, time-modulo wrapping, large timestamp precision, and token overriding. */
import { TestBed } from '@angular/core/testing';

import { HERO_CODE_OMEGA } from './hero-code-parameters.omega.variable.ts';
import { HERO_CODE_PHI_LEFT } from './hero-code-parameters.phi-left.variable.ts';
import { HERO_CODE_PHI_RIGHT } from './hero-code-parameters.phi-right.variable.ts';
import { HERO_CODE_R_LEFT } from './hero-code-parameters.radius-left.variable.ts';
import { HERO_CODE_R_RIGHT } from './hero-code-parameters.radius-right.variable.ts';
import { calculateHeroCodePosition } from './hero-code-position.function.ts';

describe('calculateHeroCodePosition', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('default injection configuration', () => {
    it('computes initial Cartesian coordinates at t = 0 matching radius and phase offset defaults', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);

      const pos0 = calcPosition(0);

      expect(pos0.left.x).toBeCloseTo(37.0, 6);
      expect(pos0.left.y).toBeCloseTo(0.0, 6);
      expect(pos0.right.x).toBeCloseTo(50.0, 6);
      expect(pos0.right.y).toBeCloseTo(0.0, 6);
    });

    it('satisfies circular orbital radius constraints (x^2 + y^2 = r^2) across diverse timestamps', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const testTimestamps = [0, 0.5, 10, 42.5, 1337, 86400, 133200];

      for (const t of testTimestamps) {
        const pos = calcPosition(t);
        const leftRadiusSquared = pos.left.x ** 2 + pos.left.y ** 2;
        const rightRadiusSquared = pos.right.x ** 2 + pos.right.y ** 2;

        expect(leftRadiusSquared).toBeCloseTo(37 ** 2, 4);
        expect(rightRadiusSquared).toBeCloseTo(50 ** 2, 4);
      }
    });

    it('satisfies exact periodicity invariant pos(t) === pos(t + k * T) across integer cycle multipliers k', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const omega = TestBed.inject(HERO_CODE_OMEGA);
      const period = (2 * Math.PI * 37) / omega;

      const baseTimestamps = [0, 12.345, 100, 500, 1000];
      const multipliers = [1, 2, 5, 10, 50, 100];

      for (const t of baseTimestamps) {
        const basePos = calcPosition(t);

        for (const k of multipliers) {
          const periodicPos = calcPosition(t + k * period);

          expect(periodicPos.left.x).toBeCloseTo(basePos.left.x, 5);
          expect(periodicPos.left.y).toBeCloseTo(basePos.left.y, 5);
          expect(periodicPos.right.x).toBeCloseTo(basePos.right.x, 5);
          expect(periodicPos.right.y).toBeCloseTo(basePos.right.y, 5);
        }
      }
    });

    it('completes exact revolution counts for right badge (37 revs) and left badge (50 revs) over one period T', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const omega = TestBed.inject(HERO_CODE_OMEGA);
      const period = (2 * Math.PI * 37) / omega;

      // At t = period / 37, right badge completes exactly 1 revolution (returns to x=50, y=0)
      const rightSingleRevPos = calcPosition(period / 37);
      expect(rightSingleRevPos.right.x).toBeCloseTo(50.0, 5);
      expect(rightSingleRevPos.right.y).toBeCloseTo(0.0, 5);

      // At t = period / 50, left badge completes exactly 1 revolution (returns to x=37, y=0)
      const leftSingleRevPos = calcPosition(period / 50);
      expect(leftSingleRevPos.left.x).toBeCloseTo(37.0, 5);
      expect(leftSingleRevPos.left.y).toBeCloseTo(0.0, 5);
    });
  });

  describe('numerical stability with large Unix epoch timestamps', () => {
    it('maintains sub-pixel coordinate accuracy and circular radius invariant for large Unix timestamps (t > 1.7e9 s)', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const largeTimestamps = [
        Date.now() / 1000,
        1_770_000_000,
        1_800_000_000.5,
        2_000_000_000.123,
      ];

      for (const t of largeTimestamps) {
        const pos = calcPosition(t);
        const leftRadius = Math.hypot(pos.left.x, pos.left.y);
        const rightRadius = Math.hypot(pos.right.x, pos.right.y);

        expect(leftRadius).toBeCloseTo(37.0, 8);
        expect(rightRadius).toBeCloseTo(50.0, 8);
      }
    });

    it('maintains exact periodicity for large Unix epoch timestamps modulated by cycle period T', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const omega = TestBed.inject(HERO_CODE_OMEGA);
      const period = (2 * Math.PI * 37) / omega;

      const unixEpochStart = 1_770_000_000;
      const basePos = calcPosition(unixEpochStart);

      for (const k of [1, 2, 10, 50, 100]) {
        const periodicPos = calcPosition(unixEpochStart + k * period);

        expect(periodicPos.left.x).toBeCloseTo(basePos.left.x, 5);
        expect(periodicPos.left.y).toBeCloseTo(basePos.left.y, 5);
        expect(periodicPos.right.x).toBeCloseTo(basePos.right.x, 5);
        expect(periodicPos.right.y).toBeCloseTo(basePos.right.y, 5);
      }
    });

    it('produces smooth continuous positional changes between consecutive high-frequency animation frames at large timestamps', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);

      const unixEpochStart = 1_770_000_000;
      const dt = 1 / 60; // 60 FPS tick duration (~16.67ms)

      const pos1 = calcPosition(unixEpochStart);
      const pos2 = calcPosition(unixEpochStart + dt);

      const leftDelta = Math.hypot(pos2.left.x - pos1.left.x, pos2.left.y - pos1.left.y);
      const rightDelta = Math.hypot(pos2.right.x - pos1.right.x, pos2.right.y - pos1.right.y);

      expect(leftDelta).toBeGreaterThan(0);
      expect(leftDelta).toBeLessThan(1);
      expect(rightDelta).toBeGreaterThan(0);
      expect(rightDelta).toBeLessThan(1);
    });
  });

  describe('dependency injection parameter overrides', () => {
    it('derives cycle period with shared factor radii (GCD > 1) and verifies periodicity', () => {
      // rLeft = 80, rRight = 50 => gcd(80, 50) = 10
      // T = 2 * PI * (80 / 10) / omega = 16 * PI / omega
      // Right completes 8 revs in T, left completes 5 revs in T
      const omega = 0.5;
      TestBed.configureTestingModule({
        providers: [
          { provide: HERO_CODE_OMEGA, useValue: omega },
          { provide: HERO_CODE_R_LEFT, useValue: 80 },
          { provide: HERO_CODE_R_RIGHT, useValue: 50 },
        ],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const expectedPeriod = (2 * Math.PI * 8) / omega;

      const pos0 = calcPosition(0);
      expect(pos0.left.x).toBeCloseTo(80.0, 6);
      expect(pos0.left.y).toBeCloseTo(0.0, 6);
      expect(pos0.right.x).toBeCloseTo(50.0, 6);
      expect(pos0.right.y).toBeCloseTo(0.0, 6);

      const t = 15.75;
      const basePos = calcPosition(t);
      for (const k of [1, 2, 5]) {
        const periodicPos = calcPosition(t + k * expectedPeriod);
        expect(periodicPos.left.x).toBeCloseTo(basePos.left.x, 5);
        expect(periodicPos.left.y).toBeCloseTo(basePos.left.y, 5);
        expect(periodicPos.right.x).toBeCloseTo(basePos.right.x, 5);
        expect(periodicPos.right.y).toBeCloseTo(basePos.right.y, 5);
      }

      // At t = expectedPeriod / 8, right badge completes 1 revolution
      const rightRevPos = calcPosition(expectedPeriod / 8);
      expect(rightRevPos.right.x).toBeCloseTo(50.0, 5);
      expect(rightRevPos.right.y).toBeCloseTo(0.0, 5);

      // At t = expectedPeriod / 5, left badge completes 1 revolution
      const leftRevPos = calcPosition(expectedPeriod / 5);
      expect(leftRevPos.left.x).toBeCloseTo(80.0, 5);
      expect(leftRevPos.left.y).toBeCloseTo(0.0, 5);
    });

    it('derives cycle period when left and right radii are equal (gcd = r)', () => {
      // rLeft = 40, rRight = 40 => gcd(40, 40) = 40
      // T = 2 * PI * (40 / 40) / omega = 2 * PI / omega
      const omega = 1.0;
      TestBed.configureTestingModule({
        providers: [
          { provide: HERO_CODE_OMEGA, useValue: omega },
          { provide: HERO_CODE_R_LEFT, useValue: 40 },
          { provide: HERO_CODE_R_RIGHT, useValue: 40 },
        ],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const expectedPeriod = (2 * Math.PI) / omega;

      const t = 3.14;
      const basePos = calcPosition(t);
      const periodicPos = calcPosition(t + expectedPeriod);

      expect(periodicPos.left.x).toBeCloseTo(basePos.left.x, 5);
      expect(periodicPos.left.y).toBeCloseTo(basePos.left.y, 5);
      expect(periodicPos.right.x).toBeCloseTo(basePos.right.x, 5);
      expect(periodicPos.right.y).toBeCloseTo(basePos.right.y, 5);
    });

    it('applies initial phase offsets PHI_LEFT and PHI_RIGHT correctly', () => {
      const omega = 2.0;
      TestBed.configureTestingModule({
        providers: [
          { provide: HERO_CODE_OMEGA, useValue: omega },
          { provide: HERO_CODE_R_LEFT, useValue: 30 },
          { provide: HERO_CODE_R_RIGHT, useValue: 60 },
          { provide: HERO_CODE_PHI_LEFT, useValue: Math.PI / 2 },
          { provide: HERO_CODE_PHI_RIGHT, useValue: Math.PI },
        ],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);

      // At t = 0:
      // left: angle = 0 + PI/2 => x = 30 * cos(PI/2) = 0, y = 30 * sin(PI/2) = 30
      // right: angle = 0 + PI => x = 60 * cos(PI) = -60, y = 60 * sin(PI) = 0
      const pos0 = calcPosition(0);
      expect(pos0.left.x).toBeCloseTo(0.0, 5);
      expect(pos0.left.y).toBeCloseTo(30.0, 5);
      expect(pos0.right.x).toBeCloseTo(-60.0, 5);
      expect(pos0.right.y).toBeCloseTo(0.0, 5);

      // gcd(30, 60) = 30 => T = 2 * PI * (30 / 30) / 2.0 = PI
      const expectedPeriod = Math.PI;
      const periodicPos = calcPosition(expectedPeriod);
      expect(periodicPos.left.x).toBeCloseTo(0.0, 5);
      expect(periodicPos.left.y).toBeCloseTo(30.0, 5);
      expect(periodicPos.right.x).toBeCloseTo(-60.0, 5);
      expect(periodicPos.right.y).toBeCloseTo(0.0, 5);
    });

    it('handles non-integer radii cleanly through rounded GCD computation', () => {
      const omega = 1.0;
      TestBed.configureTestingModule({
        providers: [
          { provide: HERO_CODE_OMEGA, useValue: omega },
          { provide: HERO_CODE_R_LEFT, useValue: 37.4 },
          { provide: HERO_CODE_R_RIGHT, useValue: 49.8 },
        ],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      // gcd(Math.round(37.4), Math.round(49.8)) = gcd(37, 50) = 1
      // period = 2 * PI * 37.4 / 1.0 = 74.8 * PI
      const expectedPeriod = (2 * Math.PI * 37.4) / omega;

      const basePos = calcPosition(10);
      const periodicPos = calcPosition(10 + expectedPeriod);

      expect(periodicPos.left.x).toBeCloseTo(basePos.left.x, 5);
      expect(periodicPos.left.y).toBeCloseTo(basePos.left.y, 5);
      expect(periodicPos.right.x).toBeCloseTo(basePos.right.x, 5);
      expect(periodicPos.right.y).toBeCloseTo(basePos.right.y, 5);
    });
  });

  describe('edge cases and boundary protections', () => {
    it('handles zero angular frequency (omega = 0) without throwing or returning NaN', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: HERO_CODE_OMEGA, useValue: 0 }],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const pos = calcPosition(100);

      expect(Number.isFinite(pos.left.x)).toBe(true);
      expect(Number.isFinite(pos.left.y)).toBe(true);
      expect(Number.isFinite(pos.right.x)).toBe(true);
      expect(Number.isFinite(pos.right.y)).toBe(true);

      expect(pos.left.x).toBeCloseTo(37.0, 5);
      expect(pos.left.y).toBeCloseTo(0.0, 5);
      expect(pos.right.x).toBeCloseTo(50.0, 5);
      expect(pos.right.y).toBeCloseTo(0.0, 5);
    });

    it('handles negative angular frequency (omega < 0) gracefully', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: HERO_CODE_OMEGA, useValue: -0.5 }],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const pos = calcPosition(10);

      expect(Number.isFinite(pos.left.x)).toBe(true);
      expect(Number.isFinite(pos.left.y)).toBe(true);
      expect(Number.isFinite(pos.right.x)).toBe(true);
      expect(Number.isFinite(pos.right.y)).toBe(true);

      const leftRadius = Math.hypot(pos.left.x, pos.left.y);
      const rightRadius = Math.hypot(pos.right.x, pos.right.y);
      expect(leftRadius).toBeCloseTo(37.0, 6);
      expect(rightRadius).toBeCloseTo(50.0, 6);
    });

    it('handles negative elapsed time gracefully without NaN', () => {
      TestBed.configureTestingModule({});
      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const pos = calcPosition(-50);

      expect(Number.isFinite(pos.left.x)).toBe(true);
      expect(Number.isFinite(pos.left.y)).toBe(true);
      expect(Number.isFinite(pos.right.x)).toBe(true);
      expect(Number.isFinite(pos.right.y)).toBe(true);

      const leftRadius = Math.hypot(pos.left.x, pos.left.y);
      const rightRadius = Math.hypot(pos.right.x, pos.right.y);
      expect(leftRadius).toBeCloseTo(37.0, 6);
      expect(rightRadius).toBeCloseTo(50.0, 6);
    });

    it('handles zero right radius gracefully', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: HERO_CODE_R_RIGHT, useValue: 0 }],
      });

      const calcPosition = TestBed.inject(calculateHeroCodePosition);
      const pos = calcPosition(50);

      expect(Number.isFinite(pos.left.x)).toBe(true);
      expect(Number.isFinite(pos.left.y)).toBe(true);
      expect(Number.isFinite(pos.right.x)).toBe(true);
      expect(Number.isFinite(pos.right.y)).toBe(true);

      expect(pos.right.x).toBeCloseTo(0.0, 6);
      expect(pos.right.y).toBeCloseTo(0.0, 6);
    });
  });
});
