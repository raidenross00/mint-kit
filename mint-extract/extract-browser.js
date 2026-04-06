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
  'color', 'background-color', 'font-family', 'font-size', 'font-weight',
  'line-height', 'letter-spacing', 'border-radius', 'box-shadow',
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

// --- Scale Generation — Compounding Opacity (matches mint-system exactly) ---

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

function generateScale(heroHex) {
  const hero = parseColor(heroHex);
  if (!hero) return null;
  const white = { r: 1, g: 1, b: 1 };
  const black = { r: 0, g: 0, b: 0 };
  const alpha = 0.8;

  const s400 = composite(hero, white, alpha);
  const s300 = composite(s400, white, alpha);
  const s200 = composite(s300, white, alpha);
  const s100 = composite(s200, white, alpha);
  const s50  = composite(s100, white, alpha);

  const s600 = composite(hero, black, alpha);
  const s700 = composite(s600, black, alpha);
  const s800 = composite(s700, black, alpha);
  const s900 = composite(s800, black, alpha);
  const s950 = composite(s900, black, alpha);

  return {
    '50': rgb01ToHex(s50), '100': rgb01ToHex(s100), '200': rgb01ToHex(s200),
    '300': rgb01ToHex(s300), '400': rgb01ToHex(s400), '500': rgb01ToHex(hero),
    '600': rgb01ToHex(s600), '700': rgb01ToHex(s700), '800': rgb01ToHex(s800),
    '900': rgb01ToHex(s900), '950': rgb01ToHex(s950),
  };
}

// --- Cross-reference: which custom properties actually appear in rendered elements? ---

function crossReferenceUsage(captureResult) {
  const { customProperties, computedStyles } = captureResult;

  // Collect every rendered color and background-color value across all elements
  const renderedColors = new Map(); // value → { count, selectors }
  for (const [sel, props] of Object.entries(computedStyles)) {
    for (const colorProp of ['color', 'background-color']) {
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

    // Pre-compute 50-950 scales for every unique rendered color
    // (so the LLM never has to do color math)
    const seenColors = new Set();
    const colorScales = {};
    // From custom properties that are actually rendered
    for (const [name, info] of Object.entries(customPropertyUsage)) {
      if (info.renderedCount > 0 && !seenColors.has(info.value)) {
        const scale = generateScale(info.value);
        if (scale) {
          colorScales[name] = { hero: info.value, scale };
          seenColors.add(info.value);
        }
      }
    }
    // From top computed color/background-color values (not already covered)
    for (const [sel, props] of Object.entries(light.computedStyles)) {
      for (const colorProp of ['color', 'background-color']) {
        if (!props[colorProp]) continue;
        for (const entry of props[colorProp]) {
          const v = entry.value;
          if (seenColors.has(v)) continue;
          // Skip transparent, white, black, and near-variants
          if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          const parsed = parseColor(v);
          if (!parsed) continue;
          // Skip pure white/black
          if (parsed.r > 0.98 && parsed.g > 0.98 && parsed.b > 0.98) continue;
          if (parsed.r < 0.02 && parsed.g < 0.02 && parsed.b < 0.02) continue;
          const scale = generateScale(v);
          if (scale) {
            const label = `computed:${sel}:${colorProp}`;
            colorScales[label] = { hero: v, heroHex: rgb01ToHex(parsed), scale };
            seenColors.add(v);
          }
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
