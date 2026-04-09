#!/usr/bin/env node
// mint-extract browser discovery + computed style extraction
// Usage: node extract-browser.js <url>
//        node extract-browser.js --install-firefox
// Outputs JSON to stdout. Errors also output JSON: { error, suggestion }

const { execSync, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const os = require('os');
const path = require('path');

const TOKEN_PROPERTIES = [
  'color', 'background-color', 'border-color', 'font-family', 'font-size',
  'font-weight', 'line-height', 'letter-spacing', 'border-radius', 'box-shadow',
  'padding', 'margin', 'gap', 'opacity'
];

const SELECTORS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'input',
  'textarea', 'select', 'nav', 'header', 'footer', 'main', 'section',
  'article', 'aside', 'label', 'span', 'div', 'ul', 'ol', 'li', 'table',
  'th', 'td', 'img', 'form', 'details', 'summary', 'code', 'pre', 'blockquote'
];

function output(obj) {
  console.log(JSON.stringify(obj));
  process.exit(0);
}

function fail(error, suggestion) {
  output({ error, suggestion });
}

// --- Browser Discovery ---

function discoverChromium() {
  const platform = os.platform();

  if (platform === 'darwin') {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const p of candidates) {
      if (existsSync(p)) return { path: p, name: path.basename(path.dirname(p)), type: 'chromium' };
    }
  }

  if (platform === 'linux') {
    const names = [
      'google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium',
      'microsoft-edge', 'brave-browser',
    ];
    for (const name of names) {
      try {
        const result = execSync(`which ${name} 2>/dev/null`, { encoding: 'utf8' }).trim();
        if (result) return { path: result, name, type: 'chromium' };
      } catch {}
    }
  }

  if (platform === 'win32') {
    const names = ['chrome', 'msedge', 'brave'];
    for (const name of names) {
      try {
        const result = execSync(`where ${name} 2>nul`, { encoding: 'utf8' }).trim().split('\n')[0];
        if (result) return { path: result, name, type: 'chromium' };
      } catch {}
    }
    const fallbacks = [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ];
    for (const p of fallbacks) {
      if (p && existsSync(p)) return { path: p, name: path.basename(p, '.exe'), type: 'chromium' };
    }
  }

  return null;
}

function discoverFirefox() {
  const platform = os.platform();

  if (platform === 'darwin') {
    const p = '/Applications/Firefox.app/Contents/MacOS/firefox';
    if (existsSync(p)) return { path: p, name: 'firefox', type: 'firefox' };
  }

  if (platform === 'linux') {
    try {
      const result = execSync('which firefox 2>/dev/null', { encoding: 'utf8' }).trim();
      if (result) {
        let snapWarning = false;
        try {
          const resolved = execSync('readlink -f $(which firefox) 2>/dev/null', { encoding: 'utf8' }).trim();
          if (resolved.includes('/snap/')) snapWarning = true;
        } catch {}
        return { path: result, name: 'firefox', type: 'firefox', snapWarning };
      }
    } catch {}
  }

  if (platform === 'win32') {
    try {
      const result = execSync('where firefox 2>nul', { encoding: 'utf8' }).trim().split('\n')[0];
      if (result) return { path: result, name: 'firefox', type: 'firefox' };
    } catch {}
    const p = `${process.env.PROGRAMFILES}\\Mozilla Firefox\\firefox.exe`;
    if (p && existsSync(p)) return { path: p, name: 'firefox', type: 'firefox' };
  }

  return null;
}

function playwrightFirefoxInstalled() {
  try {
    const pw = require('playwright-core');
    // playwright stores browsers in a known location; check if firefox channel resolves
    const registryPath = path.join(
      process.env.PLAYWRIGHT_BROWSERS_PATH ||
      path.join(os.homedir(), '.cache', 'ms-playwright'),
      'firefox-*'
    );
    // Simpler check: try to find the executable via playwright's registry
    const { Glob } = require('fs');
    // Just check the directory exists
    const cacheDir = process.env.PLAYWRIGHT_BROWSERS_PATH ||
      path.join(os.homedir(), '.cache', 'ms-playwright');
    if (!existsSync(cacheDir)) return false;
    const entries = require('fs').readdirSync(cacheDir);
    return entries.some(e => e.startsWith('firefox-'));
  } catch {
    return false;
  }
}

// --- Firefox native headless screenshot ---

function firefoxNativeScreenshot(url, firefoxPath) {
  const ts = Date.now();
  const screenshotPath = `/tmp/mint-extract-screenshot-${ts}.png`;

  // Firefox --screenshot writes to the current dir, so we use a temp dir
  const tmpDir = `/tmp/mint-extract-${ts}`;
  require('fs').mkdirSync(tmpDir, { recursive: true });

  const result = spawnSync(firefoxPath, [
    '--headless', `--screenshot=${path.join(tmpDir, 'screenshot.png')}`,
    '--window-size=1440,900', url
  ], { timeout: 30000, cwd: tmpDir });

  // Firefox saves to the specified path or CWD/screenshot.png
  const candidates = [
    path.join(tmpDir, 'screenshot.png'),
    path.join(tmpDir, 'Screenshot.png'),
  ];

  for (const c of candidates) {
    if (existsSync(c)) {
      require('fs').copyFileSync(c, screenshotPath);
      require('fs').rmSync(tmpDir, { recursive: true, force: true });
      return screenshotPath;
    }
  }

  require('fs').rmSync(tmpDir, { recursive: true, force: true });
  return null;
}

// --- Computed style extraction (runs in-page via playwright) ---

async function captureStyles(page) {
  return page.evaluate(({ selectors, props }) => {
    const rootStyles = getComputedStyle(document.documentElement);
    const customProperties = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ':root' || rule.selectorText === 'html') {
            for (let i = 0; i < rule.style.length; i++) {
              const name = rule.style[i];
              if (name.startsWith('--')) {
                customProperties[name] = rootStyles.getPropertyValue(name).trim();
              }
            }
          }
        }
      } catch {}
    }
    // Also grab --* from all rules (CSS-in-JS, scoped styles)
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style) {
              for (let i = 0; i < rule.style.length; i++) {
                const name = rule.style[i];
                if (name.startsWith('--') && !customProperties[name]) {
                  customProperties[name] = rootStyles.getPropertyValue(name).trim();
                }
              }
            }
          }
        } catch {}
      }
    } catch {}

    const computedStyles = {};
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (!els.length) continue;
      const instances = [];
      els.forEach(el => {
        const cs = getComputedStyle(el);
        const values = {};
        for (const prop of props) {
          values[prop] = cs.getPropertyValue(prop).trim();
        }
        instances.push(values);
      });
      const grouped = {};
      for (const prop of props) {
        const freq = {};
        for (const inst of instances) {
          const v = inst[prop];
          if (v) freq[v] = (freq[v] || 0) + 1;
        }
        if (Object.keys(freq).length > 0) {
          grouped[prop] = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .map(([value, frequency]) => ({ value, frequency, totalInstances: instances.length }));
        }
      }
      computedStyles[sel] = grouped;
    }

    const runtimeCSS = [];
    document.querySelectorAll('style').forEach(s => {
      if (s.textContent.trim()) runtimeCSS.push(s.textContent.trim());
    });

    return { customProperties, computedStyles, runtimeCSS };
  }, { selectors: SELECTORS, props: TOKEN_PROPERTIES });
}

// --- Scale Generation (13-step, matches mint-system exactly) ---
// 13 steps: 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 950
//
// Two paths based on what the scale is FOR:
// - Chromatic (C >= 0.03): Adaptive OKLCH with hero at step 500.
//   Even L distribution from hero to endpoints. Hero is the brand color.
// - Neutral (C < 0.03): Endpoint-anchored, Radix-weighted. No hero concept.
//   Dense light side (surfaces, borders), sparse dark side (text, dark mode).
//   Hero hue preserved for tint consistency.

const SCALE_KNOBS = {
  // Chromatic path
  LIGHT_END: 0.985,
  DARK_BASE: 0.13,
  DARK_CHROMA_SCALE: 0.8,
  DARK_CAP: 0.30,
  LIGHT_STEPS: 7,
  DARK_STEPS: 5,
  LIGHT_CHROMA_POWER: 2,
  LIGHT_CHROMA_FLOOR: 0.20,
  DARK_CHROMA_COEFF: 0.45,
  DARK_CHROMA_SCALE_POINT: 0.10,
  // Neutral detection
  NEUTRAL_THRESHOLD: 0.03,
};

// Neutral L targets (Radix-weighted, hand-tuned for interface use)
const NEUTRAL_L_TARGETS = {
  '50':  0.985, '100': 0.970, '150': 0.950, '200': 0.925,
  '250': 0.895, '300': 0.860, '400': 0.790, '500': 0.700,
  '600': 0.580, '700': 0.460, '800': 0.340, '900': 0.240, '950': 0.180,
};

function parseHexToRgb01(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
    a: 1
  };
}

function parseRgbString(str) {
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1]/255, g: +m[2]/255, b: +m[3]/255, a: 1 };
}

function parseColor(str) {
  if (!str) return null;
  str = str.trim();
  if (str.startsWith('#')) return parseHexToRgb01(str);
  if (str.startsWith('rgb')) return parseRgbString(str);
  return null;
}

function rgb01ToHex(c) {
  const to8 = v => Math.round(Math.min(1, Math.max(0, v)) * 255);
  const h = v => to8(v).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b);
}

function composite(fg, bg, alpha) {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
    a: 1
  };
}

// --- OKLCH conversion utilities ---

function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linearToSrgb(c) { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1/2.4) - 0.055; }

function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb;
  const m = 0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb;
  const s = 0.0883024619*lr + 0.2817188376*lg + 0.6299787005*lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
    1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
    0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
  ];
}

function oklabToRgb01(L, a, b) {
  const l_ = L + 0.3963377774*a + 0.2158037573*b;
  const m_ = L - 0.1055613458*a - 0.0638541728*b;
  const s_ = L - 0.0894841775*a - 1.2914855480*b;
  const l = l_*l_*l_, m = m_*m_*m_, s = s_*s_*s_;
  const r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s;
  const g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s;
  const bl = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s;
  return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(bl) };
}

function oklabToOklch(L, a, b) {
  const C = Math.sqrt(a*a + b*b);
  let H = Math.atan2(b, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToOklab(L, C, H) {
  const hr = H * Math.PI / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

function isInGamut(L, C, H) {
  const [aL, aa, ab] = oklchToOklab(L, C, H);
  const rgb = oklabToRgb01(aL, aa, ab);
  return rgb.r >= -0.002 && rgb.r <= 1.002 && rgb.g >= -0.002 && rgb.g <= 1.002 && rgb.b >= -0.002 && rgb.b <= 1.002;
}

function maxChromaAtL(L, H) {
  let lo = 0, hi = 0.4;
  while (isInGamut(L, hi, H) && hi < 0.5) hi *= 1.5;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut(L, mid, H)) lo = mid; else hi = mid;
  }
  return lo;
}

// --- Neutral path: Endpoint-anchored, Radix-weighted ---

function generateScaleNeutral(heroC, heroH) {
  const heroMaxC = maxChromaAtL(0.55, heroH);
  const gamutRatio = heroMaxC > 0.001 ? Math.min(heroC / heroMaxC, 1.0) : 0;

  const result = {};
  for (const [stepStr, targetL] of Object.entries(NEUTRAL_L_TARGETS)) {
    const maxC = maxChromaAtL(targetL, heroH);
    // Taper chroma at extremes to prevent navy at dark end / tint blowout at light end
    const dist = Math.abs(targetL - 0.55) / 0.55;
    const chromaTaper = Math.max(0.1, 1 - dist * 0.6);
    const targetC = maxC * gamutRatio * chromaTaper * 0.5; // gentle tint
    const [aL, aa, ab] = oklchToOklab(targetL, targetC, heroH);
    const rgb = oklabToRgb01(aL, aa, ab);
    result[stepStr] = { r: Math.max(0, Math.min(1, rgb.r)), g: Math.max(0, Math.min(1, rgb.g)), b: Math.max(0, Math.min(1, rgb.b)), a: 1 };
  }
  return result;
}

// --- Chromatic path: Adaptive OKLCH (hero at step 500) ---

function generateScaleChromatic(heroL, heroC, heroH) {
  const K = SCALE_KNOBS;
  const chromaT = Math.min(1, heroC / 0.06);
  const darkBase = 0.06 + chromaT * (K.DARK_BASE - 0.06);
  const darkEnd = Math.min(K.DARK_CAP, darkBase + heroC * K.DARK_CHROMA_SCALE);
  const lightStep = (K.LIGHT_END - heroL) / K.LIGHT_STEPS;
  const darkStep = (heroL - darkEnd) / K.DARK_STEPS;

  const heroMaxC = maxChromaAtL(heroL, heroH);
  const gamutRatio = heroMaxC > 0.001 ? Math.min(heroC / heroMaxC, 1.0) : 0;

  const lightNames = [50, 100, 150, 200, 250, 300, 400];
  const darkNames = [600, 700, 800, 900, 950];
  const lTargets = { 500: heroL };
  for (let i = 0; i < K.LIGHT_STEPS; i++) lTargets[lightNames[i]] = heroL + lightStep * (K.LIGHT_STEPS - i);
  for (let i = 0; i < K.DARK_STEPS; i++) lTargets[darkNames[i]] = heroL - darkStep * (i + 1);

  const result = {};
  for (const [stepStr, targetL] of Object.entries(lTargets)) {
    const step = +stepStr;
    if (step === 500) {
      // Hero: exact color
      const [aL, aa, ab] = oklchToOklab(heroL, heroC, heroH);
      const rgb = oklabToRgb01(aL, aa, ab);
      result[stepStr] = { r: Math.max(0, Math.min(1, rgb.r)), g: Math.max(0, Math.min(1, rgb.g)), b: Math.max(0, Math.min(1, rgb.b)), a: 1 };
      continue;
    }
    const maxC = maxChromaAtL(targetL, heroH);
    let chromaMult;
    if (targetL > heroL) {
      const t = (targetL - heroL) / (1 - heroL + 0.001);
      // Adaptive: extreme-light heroes differentiate through chroma, not lightness
      const lightBoost = Math.max(0, (heroL - 0.7)) * 3.3;
      const effectivePower = K.LIGHT_CHROMA_POWER + lightBoost;
      const effectiveFloor = Math.min(0.40, K.LIGHT_CHROMA_FLOOR + lightBoost * 0.08);
      const falloff = Math.pow(1 - t, effectivePower);
      chromaMult = effectiveFloor + (1 - effectiveFloor) * falloff;
    } else {
      const t = (heroL - targetL) / (heroL + 0.001);
      const darkCoeff = K.DARK_CHROMA_COEFF * Math.min(1, heroC / K.DARK_CHROMA_SCALE_POINT);
      chromaMult = 1 - t * t * darkCoeff;
    }
    const targetC = maxC * gamutRatio * chromaMult;
    const [aL, aa, ab] = oklchToOklab(targetL, targetC, heroH);
    const rgb = oklabToRgb01(aL, aa, ab);
    result[stepStr] = { r: Math.max(0, Math.min(1, rgb.r)), g: Math.max(0, Math.min(1, rgb.g)), b: Math.max(0, Math.min(1, rgb.b)), a: 1 };
  }
  return result;
}

// --- Main entry point: generateScale(heroHex) → { '50': '#hex', ... '950': '#hex' } ---

function generateScale(heroHex) {
  const hero = parseColor(heroHex);
  if (!hero) return null;

  // Convert to OKLCH to decide which path
  const [oL, oa, ob] = rgbToOklab(hero.r, hero.g, hero.b);
  const [heroL, heroC, heroH] = oklabToOklch(oL, oa, ob);

  // Neutral path: endpoint-anchored, Radix-weighted (dense light side for interfaces)
  // Chromatic path: hero at 500, even L distribution (brand color radiates tints/shades)
  const scale = heroC < SCALE_KNOBS.NEUTRAL_THRESHOLD
    ? generateScaleNeutral(heroC, heroH)
    : generateScaleChromatic(heroL, heroC, heroH);

  const result = {};
  for (const [step, color] of Object.entries(scale)) {
    result[step] = rgb01ToHex(color);
  }
  return result;
}

// --- Cross-reference: which custom properties actually appear in rendered elements? ---

function crossReferenceUsage(captureResult) {
  const { customProperties, computedStyles } = captureResult;

  // Collect every rendered color, background-color, and border-color value across all elements
  const renderedColors = new Map(); // value → { count, selectors }
  for (const [sel, props] of Object.entries(computedStyles)) {
    for (const colorProp of ['color', 'background-color', 'border-color']) {
      if (!props[colorProp]) continue;
      for (const entry of props[colorProp]) {
        const existing = renderedColors.get(entry.value);
        if (existing) {
          existing.count += entry.frequency;
          if (!existing.selectors.includes(sel)) existing.selectors.push(sel);
        } else {
          renderedColors.set(entry.value, { count: entry.frequency, selectors: [sel] });
        }
      }
    }
  }

  // For each custom property, check if its resolved value appears in rendered colors
  const usage = {};
  for (const [name, value] of Object.entries(customProperties)) {
    const match = renderedColors.get(value);
    usage[name] = {
      value,
      renderedCount: match ? match.count : 0,
      selectors: match ? match.selectors : [],
    };
  }

  return usage;
}

function stylesAreIdentical(a, b) {
  return JSON.stringify(a.customProperties) === JSON.stringify(b.customProperties) &&
         JSON.stringify(a.computedStyles) === JSON.stringify(b.computedStyles);
}

// --- Full extraction via playwright (Chromium or playwright Firefox) ---

async function fullExtraction(pw, launchFn, url, browserName) {
  const instance = await launchFn();

  try {
    const context = await instance.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for styles to settle — JS frameworks need a moment to inject CSS
    await page.waitForTimeout(2000);

    // Light mode capture
    const light = await captureStyles(page);

    // Theme detection
    let dark = null;
    let themeMethod = 'none-detected';

    // Tier 1: prefers-color-scheme emulation
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    const darkT1 = await captureStyles(page);

    if (!stylesAreIdentical(light, darkT1)) {
      dark = darkT1;
      themeMethod = 'prefers-color-scheme';
    } else {
      // Tier 2: DOM mutation
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(200);

      const mutations = [
        `document.documentElement.setAttribute('data-theme', 'dark')`,
        `document.documentElement.setAttribute('data-color-scheme', 'dark')`,
        `document.documentElement.classList.add('dark')`,
        `document.documentElement.classList.add('dark-mode')`,
        `document.body.classList.add('dark')`,
      ];
      const resets = [
        `document.documentElement.removeAttribute('data-theme')`,
        `document.documentElement.removeAttribute('data-color-scheme')`,
        `document.documentElement.classList.remove('dark')`,
        `document.documentElement.classList.remove('dark-mode')`,
        `document.body.classList.remove('dark')`,
      ];

      for (let i = 0; i < mutations.length; i++) {
        await page.evaluate(mutations[i]);
        await page.waitForTimeout(300);
        const candidate = await captureStyles(page);
        if (!stylesAreIdentical(light, candidate)) {
          dark = candidate;
          themeMethod = 'dom-mutation';
          break;
        }
        await page.evaluate(resets[i]);
        await page.waitForTimeout(100);
      }
    }

    // Cross-reference: which custom properties are actually rendered?
    const customPropertyUsage = crossReferenceUsage(light);

    // --- Collect all unique rendered colors ---
    const allColors = []; // { value, parsed, label }
    const seenColorValues = new Set();

    // From custom properties that are actually rendered
    for (const [name, info] of Object.entries(customPropertyUsage)) {
      if (info.renderedCount > 0 && !seenColorValues.has(info.value)) {
        const parsed = parseColor(info.value);
        if (parsed) {
          allColors.push({ value: info.value, parsed, label: name });
          seenColorValues.add(info.value);
        }
      }
    }
    // From top computed color/background-color/border-color values
    for (const [sel, props] of Object.entries(light.computedStyles)) {
      for (const colorProp of ['color', 'background-color', 'border-color']) {
        if (!props[colorProp]) continue;
        for (const entry of props[colorProp]) {
          const v = entry.value;
          if (seenColorValues.has(v)) continue;
          if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          const parsed = parseColor(v);
          if (!parsed) continue;
          if (parsed.r > 0.98 && parsed.g > 0.98 && parsed.b > 0.98) continue;
          if (parsed.r < 0.02 && parsed.g < 0.02 && parsed.b < 0.02) continue;
          allColors.push({ value: v, parsed, label: `computed:${sel}:${colorProp}` });
          seenColorValues.add(v);
        }
      }
    }

    // --- Scale family detection ---
    // Group colors by OKLCH hue (within 15 degrees). If multiple colors share a
    // hue, they may be steps of the same hand-picked scale. Slot them into their
    // nearest step positions and only generate the missing steps. This preserves
    // the source site's hand-picked values instead of overwriting with formula output.
    const HUE_TOLERANCE = 15; // degrees
    const SCALE_STEPS = [50,100,150,200,250,300,400,500,600,700,800,900,950];

    // Fixed L-to-step mapping for slotting (not derived from input — avoids circular logic).
    // Chromatic: linear from 0.985 (step 50) to 0.15 (step 950), matching the adaptive OKLCH endpoints.
    // Neutral: uses NEUTRAL_L_TARGETS directly.
    const CHROMATIC_L_MAP = {};
    (function() {
      const lightEnd = 0.985, darkEnd = 0.15;
      for (const step of SCALE_STEPS) {
        const t = (step - 50) / (950 - 50);
        CHROMATIC_L_MAP[step] = lightEnd - t * (lightEnd - darkEnd);
      }
    })();

    function detectScaleFamilies(colors) {
      // Convert each color to OKLCH
      const withOklch = colors.map(c => {
        const [oL, oa, ob] = rgbToOklab(c.parsed.r, c.parsed.g, c.parsed.b);
        const [L, C, H] = oklabToOklch(oL, oa, ob);
        return { ...c, L, C, H };
      });

      // Sort by hue before grouping (deterministic order, fixes order-dependent clustering)
      const chromatic = withOklch.filter(c => c.C >= SCALE_KNOBS.NEUTRAL_THRESHOLD);
      const neutrals = withOklch.filter(c => c.C < SCALE_KNOBS.NEUTRAL_THRESHOLD);
      chromatic.sort((a, b) => a.H - b.H);

      const families = []; // [{ hue, members: [...] }]

      // All near-neutrals in one family
      if (neutrals.length > 0) {
        // Use the member with highest chroma for the most stable hue reading
        const bestNeutral = neutrals.reduce((a, b) => a.C > b.C ? a : b);
        families.push({ hue: bestNeutral.H, isNeutral: true, members: neutrals });
      }

      // Chromatic: group by hue with running centroid
      for (const color of chromatic) {
        let matched = false;
        for (const fam of families) {
          if (fam.isNeutral) continue;
          let hueDiff = Math.abs(fam.hue - color.H);
          if (hueDiff > 180) hueDiff = 360 - hueDiff;
          if (hueDiff <= HUE_TOLERANCE) {
            fam.members.push(color);
            // Update centroid (circular mean would be ideal, but simple average works
            // within a 15-degree window where wrapping isn't an issue)
            const sumH = fam.members.reduce((s, m) => s + m.H, 0);
            fam.hue = sumH / fam.members.length;
            matched = true;
            break;
          }
        }
        if (!matched) {
          families.push({ hue: color.H, isNeutral: false, members: [color] });
        }
      }
      return families;
    }

    function slotIntoScale(members, isNeutral) {
      // For each member, find the nearest scale step by L value using a FIXED
      // L-to-step mapping (not derived from input — avoids circular logic).
      const lMap = isNeutral ? NEUTRAL_L_TARGETS : CHROMATIC_L_MAP;
      const slotted = {};
      for (const m of members) {
        let bestStep = 500;
        let bestDist = Infinity;
        for (const step of SCALE_STEPS) {
          const expectedL = typeof lMap[step] === 'number' ? lMap[step] : lMap[String(step)];
          const dist = Math.abs(m.L - expectedL);
          if (dist < bestDist) {
            bestDist = dist;
            bestStep = step;
          }
        }
        // Only slot if we don't already have a closer match for this step
        if (!slotted[bestStep] || bestDist < slotted[bestStep].dist) {
          slotted[bestStep] = { hex: rgb01ToHex(m.parsed), L: m.L, dist: bestDist, label: m.label, isHandPicked: true };
        }
      }
      return slotted;
    }

    // --- Build colorScales with family detection ---
    const colorScales = {};
    const families = detectScaleFamilies(allColors);

    for (const family of families) {
      if (family.members.length < 2) {
        // Single color, no family detected. Generate full scale from formula.
        const m = family.members[0];
        const scale = generateScale(m.value);
        if (scale) {
          colorScales[m.label] = { hero: m.value, heroHex: rgb01ToHex(m.parsed), scale };
        }
        continue;
      }

      // Multiple colors in the same hue family — likely a pre-existing scale.
      // Slot hand-picked values into nearest steps, generate missing steps.
      const slotted = slotIntoScale(family.members, family.isNeutral);
      const handPickedCount = Object.keys(slotted).length;

      // Hero selection: highest chroma member (most likely the actual brand color).
      // For neutrals this doesn't affect the formula output (neutral path ignores heroL)
      // but gives the most stable hue reading for tint preservation.
      const heroMember = family.members.reduce((best, m) => m.C > best.C ? m : best);

      // Generate full scale from formula
      const formulaScale = generateScale(heroMember.value);
      if (!formulaScale) continue;

      // Merge: hand-picked values override formula values at their slotted positions.
      // All other steps come from the formula. Output uses string keys for consistency
      // with generateScale's native output format.
      const mergedScale = {};
      for (const step of SCALE_STEPS) {
        const key = String(step);
        if (slotted[step]) {
          mergedScale[key] = slotted[step].hex;
        } else {
          mergedScale[key] = formulaScale[key] || formulaScale[step];
        }
      }

      const familyLabel = family.isNeutral ? 'neutral-family' : `family:${heroMember.label}`;
      colorScales[familyLabel] = {
        hero: heroMember.value,
        heroHex: rgb01ToHex(heroMember.parsed),
        scale: mergedScale,
        handPickedSteps: Object.keys(slotted).map(Number),
        handPickedCount,
        totalMembers: family.members.length,
      };

      // Individual members also get their OWN scale entry (the merged family scale)
      // so the consuming LLM can look up any member's color and find a full scale.
      // This avoids the familyRef indirection that would confuse the LLM.
      for (const m of family.members) {
        if (m.label !== heroMember.label) {
          colorScales[m.label] = {
            hero: m.value,
            heroHex: rgb01ToHex(m.parsed),
            scale: mergedScale,
            familyLabel,
            handPickedSteps: Object.keys(slotted).map(Number),
          };
        }
      }
    }

    // Screenshot
    const ts = Date.now();
    const screenshotPath = `/tmp/mint-extract-screenshot-${ts}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Resize if >5MB
    const fs = require('fs');
    const stats = fs.statSync(screenshotPath);
    if (stats.size > 5 * 1024 * 1024) {
      await page.setViewportSize({ width: 720, height: 450 });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    const version = instance.version();

    output({
      light: { customProperties: light.customProperties, computedStyles: light.computedStyles },
      dark: dark ? { customProperties: dark.customProperties, computedStyles: dark.computedStyles } : null,
      customPropertyUsage,
      colorScales,
      runtimeCSS: light.runtimeCSS,
      screenshotPath,
      browser: { name: browserName, version },
      themeMethod,
    });
  } finally {
    await instance.close();
  }
}

// --- Main ---

async function run() {
  // Handle --install-firefox flag
  if (process.argv[2] === '--install-firefox') {
    const scriptDir = path.dirname(require.resolve('./package.json'));
    const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    console.error('Installing playwright Firefox browser (~80MB)...');
    const result = spawnSync(npxPath, ['playwright', 'install', 'firefox'], {
      cwd: scriptDir,
      stdio: ['ignore', 'inherit', 'inherit'],
      timeout: 120000,
    });
    if (result.status === 0) {
      output({ installed: true, browser: 'firefox' });
    } else {
      fail('Failed to install playwright Firefox.', 'Check network connection and try again.');
    }
    return;
  }

  const url = process.argv[2];
  if (!url) fail('No URL provided.', 'Usage: node extract-browser.js <url>');

  try { new URL(url); } catch {
    fail(`Invalid URL: ${url}`, 'Provide a full URL starting with http:// or https://');
  }

  let pw;
  try {
    pw = require('playwright-core');
  } catch {
    fail(
      'playwright-core not installed.',
      'Run: cd ~/.claude/skills/mint-kit/mint-extract && npm install'
    );
  }

  // Tier 1: System Chromium browser (preferred — zero downloads)
  const chromium = discoverChromium();
  if (chromium) {
    try {
      await fullExtraction(pw, () => pw.chromium.launch({
        executablePath: chromium.path,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }), url, chromium.name);
      return;
    } catch (e) {
      fail(`Failed to launch ${chromium.name} at ${chromium.path}: ${e.message}`,
        'Try running the browser manually to check for issues.');
    }
  }

  // Tier 2+3: Firefox
  const firefox = discoverFirefox();
  if (!firefox) {
    fail('No browser found on this system.',
      'Install Google Chrome, Chromium, Edge, Brave, or Firefox.');
  }

  if (firefox.snapWarning) {
    console.error('Note: Firefox is installed via Snap, which may cause headless issues.');
  }

  // Tier 2: Playwright's patched Firefox (full extraction, requires one-time install)
  if (playwrightFirefoxInstalled()) {
    try {
      await fullExtraction(pw, () => pw.firefox.launch({ headless: true }), url, 'firefox-playwright');
      return;
    } catch (e) {
      // Fall through to native screenshot
      console.error(`Playwright Firefox launch failed: ${e.message}. Falling back to native screenshot.`);
    }
  }

  // Tier 3: Firefox native headless (screenshot only, no computed styles)
  const screenshotPath = firefoxNativeScreenshot(url, firefox.path);
  if (screenshotPath) {
    output({
      partial: true,
      reason: 'firefox-native-only',
      screenshotPath,
      browser: { name: 'firefox', version: 'native-headless' },
      needsFirefoxInstall: true,
      installCommand: 'node ~/.claude/skills/mint-kit/mint-extract/extract-browser.js --install-firefox',
    });
  } else {
    output({
      error: 'Firefox native screenshot failed.',
      needsFirefoxInstall: true,
      installCommand: 'node ~/.claude/skills/mint-kit/mint-extract/extract-browser.js --install-firefox',
      suggestion: 'Install playwright Firefox for full support, or install a Chromium-based browser.',
    });
  }
}

run();
