const csp = require("helmet-csp");

module.exports = csp({
  directives: {
    // Most of these directives are necessary for Wistia embeds, but there are a few that are only needed for this particular example app,
    // because of the Glitch button on the upper right of the page. Those are denoted with "🎏" comment.

    childSrc: [`blob:`],

    connectSrc: [
      `'self'`,
      `https://*.litix.io`, // mux JSON POST beacons
      `http://*.wistia.com`,
      `https://*.wistia.com`, // wistia player
      `https://embedwistia-a.akamaihd.net`, // wistia player
      `https://api.glitch.com`, // 🎏
      `https://*.channel.io`,
      `wss://*.channel.io`,
      `https://*.googletagmanager.com/`,
      `https://*.google-analytics.com/`,
    ],

    defaultSrc: [`'self'`, `https://*.wistia.com`, `https://*.wistia.net`],

    fontSrc: [
      `'self'`,
      `data:`, // used in wistia player
      `https://*.wistia.com`, // wistia player font
      `https://*.fontawesome.com`,
      `https://*.gstatic.com`,
      `https://*.jsdelivr.net/`,
      `https://*.googleapis.com/`,
    ],

    frameSrc: [
      `https://fast.wistia.com`, // wistia player ("iframe shim")
      `https://fast.wistia.net`, // wistia player ("iframe shim")
      `https://www.youtube.com`,
      `https://*.iamport.kr`,
      `http://*.map.daum.net`,
    ],

    imgSrc: [
      `'self'`,
      `data:`, // wistia player
      `https://*.wistia.com`,
      `https://*.wistia.net`,
      `https://embedwistia-a.akamaihd.net`,
      `https://glitch.com`, // 🎏
      `https://cdn.glitch.com`, // 🎏
      `https://avatars0.githubusercontent.com`, // 🎏
      `https://*.s3.ap-northeast-2.amazonaws.com`,
      `https://*.channel.io`,
      `https://*.google-analytics.com/`,
      `https://picsum.photos/`,
      `https://*.picsum.photos/`,
    ],

    mediaSrc: [`'self'`, `blob:`, `data:`, `https://*.wistia.com`, `https://*.wistia.net`, `https://embedwistia-a.akamaihd.net`, `https://*.channel.io`, `https://*.s3.ap-northeast-2.amazonaws.com`],

    scriptSrc: [
      `'self'`,
      `'unsafe-inline'`,
      `'unsafe-eval'`,
      `https://*.wistia.com`, // wistia player (scripts/JSONP)
      `https://*.wistia.net`, // wistia player (hls)
      `https://src.litix.io`, // mux library
      `https://button.glitch.me`, // 🎏
      `https://unpkg.com`,
      `https://*.jsdelivr.net`,
      `https://*.jquery.com`,
      `https://*.googleapis.com`,
      `https://*.cloudflare.com`,
      `https://*.bootstrapcdn.com`,
      `https://*.iamport.kr`,
      `https://*.channel.io`,
      `https://*.sentry-cdn.com`,
      `https://*.googletagmanager.com/`,
      `https://*.google-analytics.com/`,
      `https://*.ckeditor.com/`,
      `https://*.youtube.com/`,
    ],
    // object - src 'self';

    styleSrc: [
      `'self'`,
      `'unsafe-inline'`,
      `blob:`, // wistia uploader
      `https://*.wistia.com`, // wistia uploader
      `https://button.glitch.me`, // 🎏
      `https://*.fontawesome.com`,
      `https://unpkg.com`,
      `https://*.jsdelivr.net`,
      `https://*.jquery.com`,
      `https://*.googleapis.com`,
      `https://*.cloudflare.com`,
      `https://*.bootstrapcdn.com`,
    ],

    workerSrc: [`'self'`, `blob:`],

    frameAncestors: [`https://*.youtube.com`],
  },
});
