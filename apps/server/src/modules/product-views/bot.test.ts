import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isCountableUserAgent } from './bot.ts';

const COUNTED = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
];

const NOT_COUNTED = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36',
  'curl/8.5.0',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'python-requests/2.31.0',
  'axios/1.7.2',
  'Go-http-client/1.1',
  'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
  'Mozilla/5.0 Chrome-Lighthouse',
];

test('real browsers are counted', () => {
  for (const ua of COUNTED) assert.equal(isCountableUserAgent(ua), true, ua);
});

test('crawlers, headless browsers and HTTP libraries are not', () => {
  for (const ua of NOT_COUNTED) assert.equal(isCountableUserAgent(ua), false, ua);
});

test('a missing or empty User-Agent is not counted', () => {
  assert.equal(isCountableUserAgent(undefined), false);
  assert.equal(isCountableUserAgent(null), false);
  assert.equal(isCountableUserAgent(''), false);
});
