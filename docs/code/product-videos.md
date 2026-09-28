# Product videos

`products.media.videos` holds two kinds of entry in one ordered list:

```ts
{ path: 'products/<id>/1a2b3c4d-demo.mp4', mimeType: 'video/mp4', alt }   // uploaded file
{ provider: 'youtube' | 'facebook' | 'link', url, alt }                   // external
```

The key tells them apart (`isExternalVideo` checks for `url`). External videos
own no bucket object, so `commitProductMedia` passes them through untouched and
the delete-diff never sees them.

Code: `packages/validators/src/video.ts` (parse + embed), `media.ts`
(`ExternalVideoSchema`), admin `lib/components/video-field.svelte`.

## What gets stored

The admin pastes anything; `parseVideoUrl` stores one canonical URL.

```
pasted                                                        stored
1  https://youtu.be/dQw4w9WgXcQ?si=x                    →  youtube   https://www.youtube.com/watch?v=dQw4w9WgXcQ
2  https://www.youtube.com/shorts/dQw4w9WgXcQ           →  youtube   (same)
3  <iframe src="https://www.youtube.com/embed/dQw…">    →  youtube   (same)
4  https://m.facebook.com/mia/videos/123/?mibextid=a    →  facebook  https://www.facebook.com/mia/videos/123/
5  <iframe src="…/plugins/video.php?href=…%2Freel%2F5"> →  facebook  https://www.facebook.com/reel/5
6  https://cdn.example.com/demo.mp4                     →  link      https://cdn.example.com/demo.mp4
```

Fallbacks — rejected, the admin sees the reason at the input:

```
7  https://www.youtube.com/@mia        →  null   (a YouTube page, not a video)
8  https://www.facebook.com/mia        →  null   (a Facebook page, not a video)
9  http://cdn.example.com/demo.mp4     →  null   (http is mixed content on the storefront)
```

A YouTube or Facebook URL pasted under the admin's "Link" source is filed under
its platform (row 1 under "Link" still stores `youtube`). The schema re-parses
the stored URL and requires the same provider and the same canonical string, so
nothing else can reach the column.

## What gets rendered

The embed URL is derived at render time (`videoEmbedUrl`), never stored, so the
player's look can change without a data migration. The public product DTO
carries it ready-made as `embedUrl`.

```
stored                                      iframe src
youtube   …/watch?v=dQw4w9WgXcQ     →  https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&iv_load_policy=3&playsinline=1
facebook  …/reel/5                  →  https://www.facebook.com/plugins/video.php?href=<encoded>&show_text=false&width=560
link      https://cdn…/demo.mp4     →  null — play it in <video src=url controls>
```

- YouTube: the privacy-enhanced host sets no cookie until play; `rel=0` limits
  end-screen suggestions to the same channel; `iv_load_policy=3` hides
  annotations. `modestbranding` is not used — YouTube deprecated it in 2023.
- Facebook: `plugins/video.php` is the iframe Facebook's own "Embed" button
  produces. `show_text=false` drops the post text, leaving only the player.
- Iframes need `referrerpolicy="strict-origin-when-cross-origin"` — YouTube
  refuses to play without a referrer — and `allow={VIDEO_IFRAME_ALLOW}`.
