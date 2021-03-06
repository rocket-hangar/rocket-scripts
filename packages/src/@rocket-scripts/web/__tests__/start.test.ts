import { start } from '@rocket-scripts/web';
import { copyFixture } from '@ssen/copy-fixture';
import { createInkWriteStream } from '@ssen/ink-helpers';
import fs from 'fs-extra';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

describe('web/start', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1200,
        height: 900,
      },
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  test.each(['start', 'webpack-config', 'css'])(
    'should read h1 text and the text should change with HMR (%s)',
    async (dir: string) => {
      // Arrange : project directories
      const cwd: string = await copyFixture(`test/fixtures/web/${dir}`);
      const staticFileDirectories: string[] = ['{cwd}/public'];
      const app: string = 'app';

      // Arrange : stdout
      const stdout = createInkWriteStream();

      // Act : server start
      const { port, close } = await start({
        cwd,
        staticFileDirectories,
        app,
        stdout,
        logfile: process.env.CI
          ? path.join(process.cwd(), `logs/start-basic.${dir}.txt`)
          : undefined,
        webpackConfig:
          dir === 'webpack-config' ? '{cwd}/webpack.config.js' : undefined,
      });

      await timeout(1000 * 5);

      // Arrange : wait server start
      const url: string = `http://localhost:${port}`;

      page = await browser.newPage();

      await page.goto(url, { timeout: 1000 * 60 });

      await page.waitForSelector('#app h1', { timeout: 1000 * 60 });

      // Assert
      await expect(page.$eval('#app h1', (e) => e.innerHTML)).resolves.toBe(
        'Hello World!',
      );

      // Act : update the source file to be causing HMR
      const file: string = path.join(cwd, 'src/app/index.tsx');
      const source: string = await fs.readFile(file, 'utf8');
      await fs.writeFile(file, source.replace(/(Hello)/g, 'Hi'), {
        encoding: 'utf8',
      });

      // Assert : update browser text by HMR (but, it can fail)
      const waitMs: number = 1000;
      let count: number = 20;
      while (count >= 0) {
        const text: string = await page.$eval(
          '#app h1',
          (e: Element) => e.innerHTML,
        );
        if (text === 'Hi World!') {
          break;
        } else if (count === 0) {
          // Assert : when HMR did not work
          console.warn(`HMR did not work`);
          await page.reload({ waitUntil: 'load' });
          await timeout(1000 * 2);
          await page.waitForSelector('#app h1', { timeout: 1000 * 60 });
          await expect(
            page.$eval('#app h1', (e: Element) => e.innerHTML),
          ).resolves.toBe('Hi World!');
        }
        await timeout(waitMs);
        count -= 1;
      }

      // Exit
      await close();

      console.log(stdout.lastFrame());
    },
  );

  test.each(['alias', 'alias-group'])(
    'should make abc text from alias directories (%s)',
    async (dir: string) => {
      // Arrange : project directories
      const cwd: string = await copyFixture(`test/fixtures/web/${dir}`);
      const staticFileDirectories: string[] = ['{cwd}/public'];
      const app: string = 'app';

      // Arrange : stdout
      const stdout = createInkWriteStream();

      // Act : server start
      const { port, close } = await start({
        cwd,
        staticFileDirectories,
        app,
        stdout,
        logfile: process.env.CI
          ? path.join(process.cwd(), `logs/start-alias.${dir}.txt`)
          : undefined,
      });

      await timeout(1000 * 5);

      // Arrange : wait server start
      const url: string = `http://localhost:${port}`;

      page = await browser.newPage();

      await page.goto(url, { timeout: 1000 * 60 });

      await page.waitForSelector('#app h1', { timeout: 1000 * 60 });

      // Assert
      await expect(
        page.$eval('#app h1', (e: Element) => e.innerHTML),
      ).resolves.toBe('abc');

      // Exit
      await close();

      console.log(stdout.lastFrame());
    },
  );

  test('should create an isolate script', async () => {
    // Arrange : project directories
    const cwd: string = await copyFixture('test/fixtures/web/isolated-scripts');
    const staticFileDirectories: string[] = ['{cwd}/public'];
    const app: string = 'app';

    // Arrange : stdout
    const stdout = createInkWriteStream();

    // Act : server start
    const { port, close } = await start({
      cwd,
      staticFileDirectories,
      app,
      stdout,
      logfile: process.env.CI
        ? path.join(process.cwd(), `logs/isolate-script.txt`)
        : undefined,
      isolatedScripts: {
        isolate: 'isolate.ts',
      },
    });

    await timeout(1000 * 5);

    // Arrange : wait server start
    const url: string = `http://localhost:${port}`;

    page = await browser.newPage();

    await page.goto(url, { timeout: 1000 * 60 });

    await page.waitForSelector('#app h1', { timeout: 1000 * 60 });

    // Assert
    await expect(
      page.$eval('#app h1', (e: Element) => e.innerHTML),
    ).resolves.toBe('Hello World!');

    const manifest = await fetch(`http://localhost:${port}/manifest.json`);
    expect(manifest.status).toBeLessThan(299);

    const isolate = await fetch(`http://localhost:${port}/isolate.js`);
    expect(isolate.status).toBeLessThan(299);

    // Arrange : server close
    await close();

    // Assert : print stdout
    console.log(stdout.lastFrame());
  });

  test('should rewrite url with history fallback', async () => {
    // Arrange : project directories
    const cwd: string = await copyFixture('test/fixtures/web/react-router');
    const staticFileDirectories: string[] = ['{cwd}/public'];
    const app: string = 'app';

    // Arrange : stdout
    const stdout = createInkWriteStream();

    // Act : server start
    const { port, close } = await start({
      cwd,
      staticFileDirectories,
      app,
      stdout,
      logfile: process.env.CI
        ? path.join(process.cwd(), `logs/history-fallback.txt`)
        : undefined,
    });

    await timeout(1000 * 5);

    // Arrange : wait server start
    const url: string = `http://localhost:${port}/b`;

    page = await browser.newPage();

    await page.goto(url, { timeout: 1000 * 60 });

    await page.waitForSelector('#app section div', { timeout: 1000 * 60 });

    // Assert
    await expect(
      page.$eval('#app section div', (e: Element) => e.innerHTML),
    ).resolves.toBe('B');

    // Arrange : server close
    await close();

    // Assert : print stdout
    console.log(stdout.lastFrame());
  });

  test('should get static files with multiple static file directories', async () => {
    // Arrange : project directories
    const cwd: string = await copyFixture(
      'test/fixtures/web/static-file-directories',
    );
    const staticFileDirectories: string[] = ['{cwd}/public', '{cwd}/static'];
    const app: string = 'app';

    // Arrange : stdout
    const stdout = createInkWriteStream();

    // Act : server start
    const { port, close } = await start({
      cwd,
      staticFileDirectories,
      app,
      stdout,
      logfile: process.env.CI
        ? path.join(process.cwd(), `logs/start-static-file-directories.txt`)
        : undefined,
    });

    await timeout(1000 * 5);

    // Arrange : wait server start
    const url: string = `http://localhost:${port}`;

    page = await browser.newPage();

    await page.goto(url, { timeout: 1000 * 60 });

    await page.waitForSelector('#app h1', { timeout: 1000 * 60 });

    // Assert
    await expect(
      page.$eval('#app h1', (e: Element) => e.innerHTML),
    ).resolves.toBe('Hello World!');

    const manifest = await fetch(`http://localhost:${port}/manifest.json`);
    expect(manifest.status).toBeLessThan(299);

    const hello = await fetch(`http://localhost:${port}/hello.json`);
    expect(hello.status).toBeLessThan(299);

    // Arrange : server close
    await close();

    // Assert : print stdout
    console.log(stdout.lastFrame());
  });

  test('should use proxy api', async () => {
    // Arrange : project directories
    const cwd: string = await copyFixture('test/fixtures/web/proxy');
    const staticFileDirectories: string[] = ['{cwd}/public'];
    const app: string = 'app';

    // Arrange : stdout
    const stdout = createInkWriteStream();

    // Act : server start
    const { port, close } = await start({
      cwd,
      staticFileDirectories,
      app,
      stdout,
      logfile: process.env.CI
        ? path.join(process.cwd(), `logs/start-proxy.txt`)
        : undefined,
      webpackDevServerConfig: {
        proxy: {
          '/api': {
            target: 'http://labs.ssen.name',
            changeOrigin: true,
            logLevel: 'debug',
            pathRewrite: {
              '^/api': '',
            },
          },
        },
      },
    });

    await timeout(1000 * 5);

    // Assert
    const api = await fetch(
      `http://localhost:${port}/api/assets/book-opened.svg`,
    );
    expect(api.status).toBeLessThan(299);

    // Exit
    await close();

    console.log(stdout.lastFrame());
  });
});
