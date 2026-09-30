/* 小学学习乐园 Service Worker
   策略：
   - 页面(HTML)：network-first —— 联网永远拿最新版，断网才用缓存
   - sw.js 自身：network-first —— ★ v4.108 关键修复：
     以前没管 sw.js，浏览器按默认策略缓存它 → 家长手机一直跑旧 SW，
     旧 SW 又把旧 HTML 喂回来 → 「明明发布了、手机上还是旧版」。
     现在显式对 sw.js 走网络优先，保证新 SW 一定能装上。
   - 图标/静态资源：cache-first
   这样保证家长后台与我发布的新版本都能及时生效，不会被旧缓存困住。

   ★ v4.110：缓存键按"真实路径"存，不再把所有页面都塞进 './index.html'。
   以前不管访问的是 / 还是 /app.html，都覆写到 index.html 这一个键上，
   导致跳板页和应用页互相覆盖。 */
var CACHE = 'primary-learn-v296';
var SW_VER_NUM = 'v4.296';
var ASSETS = [
  './',
  './index.html',
  './app_v4.296.html',
  './english_g1.js',
  './finder.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];
/* ★ v4.143：拼音录音包（py_syll_pack.js，3.2MB）不放进 install 的 addAll ——
   它太大会拖慢 SW 安装。改成首次用时由下面的 fetch 逻辑顺手缓存（cache-first），
   第二次进拼音页就是秒开，断网也能用。 */

self.addEventListener('install', function (e) {
  // ★ v4.290 改为立即接管：此前要等所有旧页面关闭新 SW 才生效，
  // 多次出现「传了新包手机还是旧版」。孩子做题中被打断的概率远小于
  // 卡在坏版本出不来的代价，故改为 install 即 skipWaiting。
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).catch(function () { /* 某些资源失败不影响安装 */ })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (url.origin !== self.location.origin) {
    /* ★ 跨域音频（拼音真人录音，百度 CDN）：缓存优先。
       内置录音只收常用音节，家长新加的生字可能缺音，
       缺的那几节去 CDN 现取。缓存后第二次秒开，断网也能用。
       用 no-cors 模式，因为该 CDN 不给 CORS 头。 */
    /* ★ v4.199：录音包 py_syll_pack.js 走「缓存优先 + 后台更新」。
       v4.143 说好"首次用时顺手缓存"，但 fetch 里根本没写这段 ——
       结果录音包永远进不了缓存，断网时加载不到，识字卡又退回 TTS 念汉字。
       这里是补上的那一段：命中缓存直接返回（离线可用），
       没命中就取回来塞进缓存（下次秒开）。 */
    if (url.pathname.indexOf('py_syll_pack.js') >= 0) {
      e.respondWith(
        caches.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) {
            try {
              if (res && res.status === 200) {
                var copy = res.clone();
                caches.open(CACHE).then(function (c) { c.put(req, copy); });
              }
            } catch (err) {}
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        })
      );
      return;
    }

    if (url.hostname.indexOf('bcebos.com') >= 0 && url.pathname.indexOf('.mp3') > 0) {
      e.respondWith(
        caches.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(new Request(req.url, { mode: 'no-cors' })).then(function (res) {
            try {
              var copy = res.clone();
              caches.open(CACHE).then(function (c) { c.put(req, copy); });
            } catch (err) {}
            return res;
          });
        })
      );
    }
    return;
  }

  /* ★★ v4.111 关键救援：把困在 /index.html 的家长重定向到 /app.html ★★

     为什么需要这一条：
       线上 CDN 把旧的 /index.html 缓存死了 —— 同一时刻
         /index.html        → 有时 v4.103、有时 v4.109（各约一半）
         /index.html?v=xxx  → 100% 最新
       也就是说 /index.html 这个精确路径已被污染，重复发布也覆盖不掉。
       家长从浏览器历史、书签、或桌面图标（旧 manifest 里 start_url 是 ./）
       进来时，有约一半概率拿到旧的 v4.103 —— 而旧版里没有「检查更新」
       按钮，家长就永远出不来。这就是她说的"你没有发布更新吗"。

     怎么救：
       只要新 SW（sw.js 本身没被污染）装上并生效，它就能在导航层
       把 /index.html 的请求直接重定向到 /app.html（干净路径）。
       这样无论 CDN 喂什么旧内容，家长都会被捞到最新版。

     注意：只在"真的在导航去 index.html"时重定向，
       不影响 SW 自己缓存、也不影响 app.html 与其它资源。 */
  if (req.mode === 'navigate' && url.pathname.endsWith('/index.html')) {
    e.respondWith(Response.redirect('/app_' + SW_VER_NUM + '.html?v=' + SW_VER_NUM, 302));
    return;
  }

  /* ★★ v4.118 关键救援 2：把困在**旧版 app 文件**里的家长重定向到最新版 ★★

     场景：家长手机上的旧版 app（如 app_v4.115.html）自带「更新」按钮，
     但旧代码那颗按钮是坏的 —— 它跳的是"当前版本自己"，原地刷新，永远升不上去。
     于是家长怎么点都出不来（这就是「点了更新毫无变化」的直接原因）。
     更麻烦的是：桌面图标若锁死在某份旧 app 文件上，冷启动也还是旧版。

     怎么救：只要新 SW 装上并生效，就在导航层把**任何旧版 app 文件**的请求，
     直接重定向到当前最新版 app_<SW_VER_NUM>.html。
     这样旧按钮再乱跳、图标锁得再死，家长都会被捞到最新版；
     且不会死循环（访问的就是最新版时，版本号相等，不再重定向）。 */
  var appM = url.pathname.match(/\/app_(v[\d.]+)\.html$/);
  if (req.mode === 'navigate' && appM && appM[1] !== SW_VER_NUM) {
    e.respondWith(Response.redirect('/app_' + SW_VER_NUM + '.html?v=' + SW_VER_NUM, 302));
    return;
  }

  /* ★ v4.108：sw.js 自身必须网络优先，否则新 SW 装不上，
     家长手机永远停留在旧版（这是「明明发布了却没更新」的真正原因）。
     sw.js 只有几 KB，每次多走一次网络不影响体验，却换来"更新一定能生效"。 */
  if (url.pathname.endsWith('/sw.js')) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' })).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  /* ★ v4.108：版本探针 ver.txt 也是网络优先，它是自检的"最后一道保险" */
  if (url.pathname.endsWith('/ver.txt')) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' })).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  /* ★ v4.148：练习包 / 年级包 JSON 必须网络优先。

     为什么单列这一条：
       App 里虽然写了 fetch(..., {cache:'no-store'})，但那只对浏览器的
       HTTP 缓存生效，拦不住 SW 自己的 Cache API。之前这些 JSON 落到
       「其它资源：缓存优先」，第一次取到后就锁死在缓存里 —— 于是我更新了
       线上的练习包，家长手机上点「获取」拿到的还是旧的那一份，
       表现为「明明更新了却没变化」。练习包恰恰是更新最频繁的内容，
       所以必须走网络优先；断网时自动回退缓存，离线照样能做。 */
  if (url.pathname.indexOf('/practice/') === 0 || /\/g[1-6]-pkg\.json$/.test(url.pathname)) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' })).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  /* ★ v4.167：一年级英语内容包（english_g1.js，以后还会有 g2~g6）同样必须网络优先。
     理由和内容包 JSON 一模一样：一旦被 Cache API 锁死，我更新了内容、家长手机上还是旧的，
     表现就是「明明加新产品却看不到」。断网时自动回退缓存，离线照样能念。 */
  if (/\/english_g[1-6]\.js$/.test(url.pathname)) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' })).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  /* ★ v4.272：笔顺名称表 hanzi_ordertype.js 也必须网络优先。
     和练习包/英语包一模一样的坑：它之前落在「其它资源：缓存优先」，
     第一次取到就被 Cache API 锁死。家长按百度核对后我改了数据（心=卧钩、
     字=弯钩），线上文件已经是新的，她手机上读的还是缓存里的旧表 ——
     表现为「你说改了，可还是显示斜钩」。笔顺数据是会被反复核对修正的，
     44KB 很小，每次走网络完全无感；断网时自动回退缓存，离线照样能看。 */
  if (url.pathname.indexOf('hanzi_ordertype.js') >= 0) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store' })).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  // 导航请求 / 首页 HTML：优先网络
  var isPage = req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.html') ||
    url.pathname.endsWith('/');
  if (isPage) {
    /* ★ v4.110：缓存键用「真实路径」而不是一律 './index.html'。
       以前跳板页和应用页会互相覆盖同一个键，断网时可能拿到错的那一页。
       现在是 app.html 就存 app.html，是 / 就存 /。 */
    var pageKey = url.pathname.endsWith('/app.html') ? './app.html'
                : url.pathname.endsWith('/index.html') ? './index.html'
                : /\/app_v[\d.]+\.html$/.test(url.pathname) ? url.pathname.replace(/^.*\//, './')
                : './';
    /* 跳板页必须永远拿最新（它只有几百字节，且是"逃生通道"，
       一旦被缓存住，家长就再也跳不到新版了）——所以查询串也带上去，
       让带 ?v=xxx 的请求各自独立，不与裸路径混淆。 */
    var fetchUrl = req.url;
    e.respondWith(
      fetch(new Request(fetchUrl, { cache: 'no-store' })).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(pageKey, copy); });
        } catch (err) {}
        return res;
      }).catch(function () {
        return caches.match(pageKey).then(function (r) {
          return r || caches.match('./app.html') || caches.match('./index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  // 其它资源：缓存优先
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      });
    })
  );
});

// 页面请求立即接管 / 清缓存指令
self.addEventListener('message', function (e) {
  var t = e.data && e.data.type ? e.data.type : e.data;
  if (t === 'SKIP_WAITING') self.skipWaiting();
  if (t === 'CLEAR_CACHE') {
    e.waitUntil(caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }));
  }
});
