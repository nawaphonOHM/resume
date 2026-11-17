#!/usr/bin/env node

// Export of the Playwright callbacks recorded during the GitRanks validation session.
// These are diagnostic observations, not assertions or a complete accessibility audit.
import { pathToFileURL } from 'node:url';

export const initialWcagAudit = async (page) => {
  await page.emulateMedia({ media: 'screen' });
  const audit = async () =>
    await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      });
      return {
        theme: document.documentElement.className,
        axeVersion: window.axe.version,
        violations: result.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          targets: nodes.map(({ target }) => target),
        })),
        incomplete: result.incomplete.map(({ id, impact, nodes }) => ({
          id,
          impact,
          nodes: nodes
            .slice(0, 4)
            .map(({ target, any }) => ({ target, checks: any.map(({ message }) => message) })),
          totalNodes: nodes.length,
        })),
      };
    });
  const toLight = page.getByRole('button', { name: 'Switch to light theme' });
  if (await toLight.count()) await toLight.click();
  await page.waitForTimeout(1000);
  const light = await audit();
  const toDark = page.getByRole('button', { name: 'Switch to dark theme' });
  if (await toDark.count()) await toDark.click();
  await page.waitForTimeout(1000);
  const dark = await audit();
  return { light, dark };
};

export const inspectPage = async (page) => {
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  return {
    title: await page.title(),
    online: await page.locator('.links-card').count(),
    badge: await page.locator('.gitranks-link').count(),
    viewport: await page.evaluate(() => ({ w: innerWidth, h: innerHeight })),
  };
};

export const loadAxe = async (page) => {
  try {
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js',
    });
    return await page.evaluate(() => ({ version: window.axe?.version }));
  } catch (e) {
    return { error: String(e) };
  }
};

export const inspectLayouts = async (page) => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      const button = page.getByRole('button', { name: `Switch to ${theme} theme` });
      if (await button.count()) await button.click();
      await page.waitForTimeout(300);
      await page.locator('.gitranks-link').scrollIntoViewIfNeeded();
      const layout = await page.evaluate(() => {
        const link = document.querySelector('.gitranks-link');
        const card = document.querySelector('.links-card');
        const image = link.querySelector('img');
        const label = link.querySelector('.gitranks-print-label');
        const r = link.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          link: { left: r.left, right: r.right, width: r.width },
          card: { left: c.left, right: c.right },
          image: image && { loaded: image.complete && image.naturalWidth > 0 },
          printLabelDisplay: getComputedStyle(label).display,
          links: Array.from(card.querySelectorAll('a')).map((a) => a.href),
        };
      });
      await page.locator('.gitranks-link').focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      const focus = await page.locator('.gitranks-link').evaluate((el) => ({
        focused: document.activeElement === el,
        focusVisible: el.matches(':focus-visible'),
        outline: getComputedStyle(el).outlineStyle,
        outlineWidth: getComputedStyle(el).outlineWidth,
        outlineColor: getComputedStyle(el).outlineColor,
      }));
      const axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        });
        return {
          violations: r.violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          incomplete: r.incomplete.map((v) => ({
            id: v.id,
            count: v.nodes.length,
            targets: v.nodes.map((n) => n.target),
          })),
        };
      });
      results.push({ width, theme, layout, focus, axe });
    }
  }
  return results;
};

export const inspectPrintAndFailure = async (page) => {
  await page.emulateMedia({ media: 'print' });
  const inspect = async () =>
    await page.evaluate(() => {
      const link = document.querySelector('.gitranks-link');
      const feature = document.querySelector('.gitranks-feature');
      const s = (selector) => {
        const e = feature.querySelector(selector);
        return e ? { display: getComputedStyle(e).display, text: e.textContent.trim() } : null;
      };
      return {
        link: {
          href: link.href,
          name: link.getAttribute('aria-label'),
          display: getComputedStyle(link).display,
          color: getComputedStyle(link).color,
          fontSize: getComputedStyle(link).fontSize,
        },
        label: s('.gitranks-print-label'),
        badge: s('img'),
        fallback: s('.gitranks-fallback'),
        icon: s('.gitranks-screen-icon'),
        screenLabel: s('.gitranks-label'),
      };
    });
  const normal = await inspect();
  await page.locator('.gitranks-link img').dispatchEvent('error');
  await page.waitForTimeout(100);
  const failed = await inspect();
  await page.emulateMedia({ media: 'screen' });
  const fallbackScreen = await page.locator('.gitranks-fallback').evaluate((e) => ({
    text: e.textContent.trim(),
    color: getComputedStyle(e).color,
    background: getComputedStyle(e.closest('a')).backgroundColor,
  }));
  return { normal, failed, fallbackScreen };
};

export const inspectFallbackContrast = async (page) => {
  const results = [];
  for (const theme of ['light', 'dark']) {
    const b = page.getByRole('button', { name: `Switch to ${theme} theme` });
    if (await b.count()) await b.click();
    await page.waitForTimeout(300);
    const value = await page.evaluate(async () => {
      const fallback = document.querySelector('.gitranks-fallback'),
        link = fallback.closest('a');
      const parse = (s) =>
        s
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      const luma = (rgb) =>
        rgb
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          })
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const fg = getComputedStyle(fallback).color,
        bg = getComputedStyle(link).backgroundColor;
      const a = luma(parse(fg)),
        b = luma(parse(bg));
      const r = await window.axe.run(document);
      return {
        fallback: { fg, bg, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) },
        violations: r.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      };
    });
    results.push({ theme, ...value });
  }
  return results;
};

export const inspectSettledAxeDetails = async (page) => {
  await page.waitForTimeout(3000);
  return await page.evaluate(async () => {
    let r = await window.axe.run(document);
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
          html: n.html,
          any: n.any,
        })),
      })),
      incomplete: r.incomplete.map((v) => ({
        id: v.id,
        nodes: v.nodes.slice(0, 2).map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    };
  });
};

export const inspectSettledThemes = async (page) => {
  let results = [];
  for (const theme of ['light', 'dark']) {
    const b = page.getByRole('button', { name: `Switch to ${theme} theme` });
    if (await b.count()) await b.click();
    await page.waitForTimeout(3000);
    const r = await page.evaluate(async () => {
      const r = await window.axe.run(document);
      return {
        violations: r.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      };
    });
    results.push({ theme, ...r });
  }
  return results;
};

async function main() {
  const { chromium } = await import('playwright');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(process.env.RESUME_URL ?? 'http://127.0.0.1:4317/');
    const pageInfo = await inspectPage(page);
    const axe = await loadAxe(page);
    if (axe.error) throw new Error(`Could not load axe-core: ${axe.error}`);
    const layouts = await inspectLayouts(page);
    const printAndFailure = await inspectPrintAndFailure(page);
    const fallbackContrast = await inspectFallbackContrast(page);
    const settledAxeDetails = await inspectSettledAxeDetails(page);
    const settledThemes = await inspectSettledThemes(page);
    console.log(
      JSON.stringify(
        {
          pageInfo,
          axe,
          layouts,
          printAndFailure,
          fallbackContrast,
          settledAxeDetails,
          settledThemes,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
