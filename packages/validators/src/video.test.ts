import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from 'valibot';

import { ProductMediaSchema } from './media.ts';
import { isExternalVideo, parseVideoUrl, videoEmbedUrl } from './video.ts';

const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('parseVideoUrl — YouTube', () => {
  it('reduces every shape of YouTube URL to the canonical watch URL', () => {
    for (const input of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL1',
      'https://youtu.be/dQw4w9WgXcQ?si=tracking',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0',
      '  https://www.youtube.com/embed/dQw4w9WgXcQ  ',
    ]) {
      assert.deepEqual(parseVideoUrl(input), { provider: 'youtube', url: YT }, input);
    }
  });

  it('accepts the iframe snippet from the Share → Embed button', () => {
    const snippet =
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=x" ' +
      'title="YouTube video player" frameborder="0" allowfullscreen></iframe>';
    assert.deepEqual(parseVideoUrl(snippet), { provider: 'youtube', url: YT });
  });

  it('rejects a YouTube page that is not a video, rather than keeping it as a link', () => {
    assert.equal(parseVideoUrl('https://www.youtube.com/@miamedical'), null);
    assert.equal(parseVideoUrl('https://www.youtube.com/watch?v=short'), null);
    assert.equal(parseVideoUrl('https://youtu.be/'), null);
  });
});

describe('parseVideoUrl — Facebook', () => {
  it('keeps the path that names the video and drops tracking params', () => {
    assert.deepEqual(
      parseVideoUrl('https://m.facebook.com/miamedical/videos/1234567890/?mibextid=abc'),
      { provider: 'facebook', url: 'https://www.facebook.com/miamedical/videos/1234567890/' },
    );
    assert.deepEqual(parseVideoUrl('https://www.facebook.com/watch/?v=987&ref=share'), {
      provider: 'facebook',
      url: 'https://www.facebook.com/watch/?v=987',
    });
    assert.deepEqual(parseVideoUrl('https://www.facebook.com/reel/555'), {
      provider: 'facebook',
      url: 'https://www.facebook.com/reel/555',
    });
    assert.deepEqual(parseVideoUrl('https://fb.watch/aBcD12/'), {
      provider: 'facebook',
      url: 'https://fb.watch/aBcD12/',
    });
  });

  it('unwraps the plugin iframe from the Embed button to the video href', () => {
    const href = encodeURIComponent('https://www.facebook.com/miamedical/videos/1234567890/');
    const snippet = `<iframe src="https://www.facebook.com/plugins/video.php?height=314&amp;href=${href}&amp;show_text=false" width="560"></iframe>`;
    assert.deepEqual(parseVideoUrl(snippet), {
      provider: 'facebook',
      url: 'https://www.facebook.com/miamedical/videos/1234567890/',
    });
  });

  it('rejects a page, profile or photo URL', () => {
    assert.equal(parseVideoUrl('https://www.facebook.com/miamedical'), null);
    assert.equal(parseVideoUrl('https://www.facebook.com/photo/?fbid=1'), null);
  });
});

describe('parseVideoUrl — direct link', () => {
  it('keeps any other https URL as a link', () => {
    assert.deepEqual(parseVideoUrl('https://cdn.example.com/demo.mp4?v=2'), {
      provider: 'link',
      url: 'https://cdn.example.com/demo.mp4?v=2',
    });
  });

  it('rejects http (mixed content) and non-URLs', () => {
    assert.equal(parseVideoUrl('http://cdn.example.com/demo.mp4'), null);
    assert.equal(parseVideoUrl('demo.mp4'), null);
    assert.equal(parseVideoUrl(''), null);
  });

  it('is idempotent on its own output — the schema relies on it', () => {
    for (const input of [YT, 'https://fb.watch/aBcD12/', 'https://cdn.example.com/a b.mp4']) {
      const once = parseVideoUrl(input)!;
      assert.deepEqual(parseVideoUrl(once.url), once);
    }
  });
});

describe('videoEmbedUrl', () => {
  it('builds a bare player for each platform and nothing for a link', () => {
    assert.equal(
      videoEmbedUrl({ provider: 'youtube', url: YT }),
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&iv_load_policy=3&playsinline=1',
    );
    assert.equal(
      videoEmbedUrl({ provider: 'facebook', url: 'https://www.facebook.com/reel/555' }),
      'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F555&show_text=false&width=560',
    );
    assert.equal(videoEmbedUrl({ provider: 'link', url: 'https://cdn.example.com/a.mp4' }), null);
  });
});

describe('isExternalVideo', () => {
  it('tells an uploaded file from an external video by its key', () => {
    assert.equal(isExternalVideo({ path: 'products/x/a.mp4', mimeType: 'video/mp4' }), false);
    assert.equal(isExternalVideo({ provider: 'youtube', url: YT }), true);
  });
});

describe('ProductMediaSchema — videos', () => {
  const media = (videos: unknown[]) => ({
    thumbnail: null,
    cleanPng: null,
    gallery: [],
    documents: [],
    videos,
  });
  const accepts = (videos: unknown[]) => v.safeParse(ProductMediaSchema, media(videos)).success;

  it('takes uploaded files and external videos in one list', () => {
    assert.equal(
      accepts([
        { path: 'products/x/a.mp4', mimeType: 'video/mp4' },
        { provider: 'youtube', url: YT, alt: { it: 'Montaggio' } },
        { provider: 'facebook', url: 'https://www.facebook.com/reel/555' },
        { provider: 'link', url: 'https://cdn.example.com/a.mp4' },
      ]),
      true,
    );
  });

  it('rejects a provider that does not match the URL, or a URL not in canonical form', () => {
    assert.equal(accepts([{ provider: 'link', url: YT }]), false);
    assert.equal(accepts([{ provider: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' }]), false);
    assert.equal(accepts([{ provider: 'link', url: 'http://x.com/a.mp4' }]), false);
    assert.equal(accepts([{ provider: 'vimeo', url: 'https://vimeo.com/1' }]), false);
  });
});
