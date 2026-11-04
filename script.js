const BASE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';
const SAMPLE = [
  { id: 's1', title: 'Big Buck Bunny', author: 'blender', src: BASE + 'BigBuckBunny.mp4' },
  { id: 's2', title: 'Elephants Dream', author: 'blender', src: BASE + 'ElephantsDream.mp4' },
  { id: 's3', title: 'For Bigger Blazes', author: 'google', src: BASE + 'ForBiggerBlazes.mp4' },
  { id: 's4', title: 'Sintel', author: 'blender', src: BASE + 'Sintel.mp4' },
  { id: 's5', title: 'Tears of Steel', author: 'blender', src: BASE + 'TearsOfSteel.mp4' },
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};

let custom = store.get('vibe.custom', []);
let videos = [...SAMPLE, ...custom];
let likes = new Set(store.get('vibe.likes', []));
let tab = 'home';
let query = '';
let muted = true;

const feed = $('#feed');
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9C.9 8.7 2.7 4.5 6.7 4.5c2.2 0 3.7 1.3 5.3 3.1 1.6-1.8 3.1-3.1 5.3-3.1 4 0 5.8 4.2 4.3 7.5-2.1 4.4-9.6 9-9.6 9z"/></svg>';

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1600);
}

function visibleList() {
  let list = tab === 'saved' ? videos.filter(v => likes.has(v.id)) : videos;
  if (query) list = list.filter(v => (v.title + ' ' + v.author).toLowerCase().includes(query));
  return list;
}

/* ---------- Render ---------- */
function render() {
  const list = visibleList();
  feed.innerHTML = '';
  io.disconnect();

  if (!list.length) {
    feed.innerHTML = `<div class="empty">${tab === 'saved' ? 'Abhi koi saved video nahi ❤️' : 'Kuch nahi mila 😕'}</div>`;
    return;
  }

  for (const v of list) {
    const yt = ytId(v.src);
    const el = document.createElement('section');
    el.className = 'reel';
    el.dataset.id = v.id;
    el.innerHTML = `
      <div class="media">
        ${yt
          ? `<iframe data-yt="${yt}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
          : `<video src="${esc(v.src)}" playsinline loop muted preload="metadata"></video>`}
      </div>
      <div class="shade"></div>
      <div class="info">
        <div class="author">@${esc(v.author || 'unknown')}</div>
        <div class="title">${esc(v.title)}</div>
      </div>
      <div class="actions">
        <button class="act ${likes.has(v.id) ? 'on' : ''}" data-act="like" aria-label="Like">${HEART}</button>
        <button class="act" data-act="sound" aria-label="Sound">${muted ? '🔇' : '🔊'}</button>
        <button class="act" data-act="share" aria-label="Share">↗</button>
      </div>`;
    feed.appendChild(el);
    io.observe(el);
  }
  feed.scrollTop = 0;
}

/* ---------- Autoplay only the visible reel ---------- */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    const vid = e.target.querySelector('video');
    const frame = e.target.querySelector('iframe');
    if (e.isIntersecting) {
      if (vid) { vid.muted = muted; vid.play().catch(() => {}); }
      if (frame && !frame.src) {
        frame.src = `https://www.youtube.com/embed/${frame.dataset.yt}?autoplay=1&playsinline=1&rel=0&mute=${muted ? 1 : 0}`;
      }
    } else {
      if (vid) vid.pause();
      if (frame && frame.src) frame.src = '';
    }
  }
}, { root: feed, threshold: 0.6 });

/* ---------- Interactions ---------- */
feed.addEventListener('click', (e) => {
  const reel = e.target.closest('.reel');
  if (!reel) return;
  const v = videos.find(x => x.id === reel.dataset.id);
  const btn = e.target.closest('[data-act]');

  if (!btn) {                       // tap on video = play / pause
    const vid = reel.querySelector('video');
    if (vid) vid.paused ? vid.play() : vid.pause();
    return;
  }

  const act = btn.dataset.act;

  if (act === 'like') {
    likes.has(v.id) ? likes.delete(v.id) : likes.add(v.id);
    store.set('vibe.likes', [...likes]);
    btn.classList.toggle('on', likes.has(v.id));
    if (tab === 'saved') render();
    toast(likes.has(v.id) ? 'Saved ❤️' : 'Removed');
  }

  if (act === 'sound') {
    muted = !muted;
    $$('video').forEach(x => (x.muted = muted));
    $$('.act[data-act="sound"]').forEach(b => (b.textContent = muted ? '🔇' : '🔊'));
  }

  if (act === 'share') {
    if (navigator.share) {
      navigator.share({ title: v.title, url: v.src }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(v.src);
      toast('Link copy ho gaya');
    }
  }
});

$('#search').addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});

$$('.bottombar button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === 'add') return $('#addDialog').showModal();
  tab = b.dataset.tab;
  $$('.bottombar button').forEach(x => x.classList.toggle('active', x === b));
  render();
}));

/* ---------- Add video dialog ---------- */
const dlg = $('#addDialog');
$('#cancelBtn').addEventListener('click', () => dlg.close());

$('#addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const title = fd.get('title').trim();
  const url = fd.get('url').trim();
  if (!title || !url) return;

  const item = {
    id: 'u' + Date.now(),
    title,
    author: (fd.get('author') || 'me').trim().replace(/^@/, ''),
    src: url,
  };
  custom.push(item);
  store.set('vibe.custom', custom);
  videos.push(item);

  e.target.reset();
  dlg.close();
  tab = 'home';
  $$('.bottombar button').forEach(x => x.classList.toggle('active', x.dataset.tab === 'home'));
  render();
  toast('Video add ho gaya 🎬');
});

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}

render();