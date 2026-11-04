/* =====================================================================
   iFeed — MODIFIED version of YOUR old script.js (vibe code)
   Purana code poora rakha gaya hai: SAMPLE, store, likes, tab, query,
   muted, esc, ytId, toast, visibleList, render, IntersectionObserver,
   feed click, search, bottombar, addDialog, PWA.
   Sirf ye ADVANCED cheezein add ki gayi hain (neeche // ADVANCED likha hai):
   1. Guarded bindings — agar HTML me koi ID missing ho to script
      beech me crash nahi hoga, render() phir bhi chalega (purane bug ka fix)
   2. Follow + Share-to-followed list (user ID ke saath)
   3. Comment (localStorage me save)
   4. Video details: quality, size, duration, aspect
   5. Settings: watch quality Auto / 360p / 720p / 1080p / 4K UHD
   6. Upload: URL ke saath phone ki video FILE bhi (file wali sirf is session me,
      kyunki blob URL reload ke baad kaam nahi karta — URL wali hamesha bachti hai)
   7. Music: demo tune (WebAudio) ya apni audio file
   8. Search + Related: liked videos ke tags se related list
   9. Help / Ask AI: chat sirf is device par save hoti hai
   10. Profile view: total / saved / following count
   Storage keys PURANE hi rakhe hain (vibe.likes, vibe.custom) taaki
   tumhare saved aur add ki hui URL videos replace karne ke baad bhi rahen.
   ===================================================================== */

const BASE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';
const SAMPLE = [
  { id: 's1', title: 'Big Buck Bunny', author: 'blender', src: BASE + 'BigBuckBunny.mp4', tags: ['comedy', 'animation'] },
  { id: 's2', title: 'Elephants Dream', author: 'blender', src: BASE + 'ElephantsDream.mp4', tags: ['animation', 'dream'] },
  { id: 's3', title: 'For Bigger Blazes', author: 'google', src: BASE + 'ForBiggerBlazes.mp4', tags: ['promo', 'google'] },
  { id: 's4', title: 'Sintel', author: 'blender', src: BASE + 'Sintel.mp4', tags: ['animation', 'fantasy'] },
  { id: 's5', title: 'Tears of Steel', author: 'blender', src: BASE + 'TearsOfSteel.mp4', tags: ['sci-fi', 'action'] },
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

// ---------- ADVANCED: state (purane keys + naye keys) ----------
let following = new Set(store.get('vibe.following', []));
let commentsMap = store.get('vibe.comments', {});
let qualityPref = localStorage.getItem('vibe.quality') || 'auto';
const qualityLabels = { auto: 'Auto', '360': '360p', '720': '720p', '1080': '1080p', '2160': '4K UHD' };
let meta = {}; // id -> { width, height, duration, sizeMB }
let currentCommentId = null, currentShareVideo = null;
let musicCtx = null, musicTimer = null, musicAudio = null, musicStep = 0;

const feed = $('#feed');
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9C.9 8.7 2.7 4.5 6.7 4.5c2.2 0 3.7 1.3 5.3 3.1 1.6-1.8 3.1-3.1 5.3-3.1 4 0 5.8 4.2 4.3 7.5-2.1 4.4-9.6 9-9.6 9z"/></svg>';

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function ytId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// In-app user ID (asli account ID nahi, sirf is app me dikhane ke liye)
function userIdFor(author) {
  let h = 0; String(author).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 900 + 100; });
  return 'IFD-' + h;
}
function fmtTime(s) {
  if (!s || isNaN(s)) return '—';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' + sec : sec);
}
function fmtSize(mb) {
  if (!mb) return 'Online demo — size server par hai';
  return mb < 1 ? Math.round(mb * 1024) + ' KB' : mb.toFixed(1) + ' MB';
}
function qualityBadge(v) {
  if (qualityPref !== 'auto') return qualityLabels[qualityPref];
  const m = meta[v.id];
  if (!m || !m.width) return 'Auto';
  if (m.width >= 3840) return '4K UHD';
  if (m.width >= 1920) return '1080p';
  if (m.width >= 1280) return '720p';
  return '360p+';
}
function aspectLabel(v) {
  const m = meta[v.id];
  if (!m || !m.width) return '—';
  return m.width > m.height ? '16:9 Landscape (' + m.width + '×' + m.height + ')' : '9:16 Vertical (' + m.width + '×' + m.height + ')';
}
function likedTags() {
  const s = new Set();
  videos.forEach(v => { if (likes.has(v.id)) (v.tags || []).forEach(t => s.add(t)); });
  return s;
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
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

/* ---------- ADVANCED: demo music (WebAudio, koi file nahi chahiye) ---------- */
const musicTracks = {
  chill: { notes: [261, 293, 329, 392], ms: 600 },
  beat: { notes: [220, 277, 330, 440], ms: 320 },
  calm: { notes: [523, 587, 659, 784], ms: 850 },
};
function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (musicAudio) { musicAudio.pause(); musicAudio = null; }
}
function startMusic(v) {
  stopMusic();
  if (!v) return;
  if (v.audioSrc) {
    musicAudio = new Audio(v.audioSrc); musicAudio.loop = true;
    musicAudio.play().catch(() => {});
    return;
  }
  const track = musicTracks[v.music];
  if (!track) return;
  try {
    if (!musicCtx) musicCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (musicCtx.state === 'suspended') musicCtx.resume();
    musicStep = 0;
    musicTimer = setInterval(() => {
      const osc = musicCtx.createOscillator(), gain = musicCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = track.notes[musicStep % track.notes.length];
      gain.gain.setValueAtTime(0.05, musicCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, musicCtx.currentTime + 0.5);
      osc.connect(gain); gain.connect(musicCtx.destination);
      osc.start(); osc.stop(musicCtx.currentTime + 0.55);
      musicStep++;
    }, track.ms);
  } catch (e) {}
}

/* ---------- Render (purana, sirf naye buttons + badge add hue) ---------- */
function render() {
  if (!feed) return;
  // ADVANCED: settings/help/profile/explore view khula ho to feed render mat karo
  if (tab === 'settings' || tab === 'help' || tab === 'profile' || tab === 'explore') return;
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
    const isFollowing = following.has(v.author);
    const cmts = commentsMap[v.id] || [];
    el.innerHTML = `
      <div class="media">
        ${yt
          ? `<iframe data-yt="${yt}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
          : `<video src="${esc(v.src)}" playsinline loop muted preload="metadata"></video>`}
      </div>
      <div class="shade"></div>
      <div class="reel-top"><span class="qbadge">${qualityBadge(v)}</span></div>
      <div class="info">
        <div class="author">@${esc(v.author || 'unknown')}</div>
        <div class="title">${esc(v.title)}</div>
        <div class="tags">${(v.tags || []).map(t => '#' + esc(t)).join(' ')} ${v.music ? '• 🎵 ' + esc(v.music) : ''}</div>
      </div>
      <div class="actions">
        <button class="act ${likes.has(v.id) ? 'on' : ''}" data-act="like" aria-label="Like">${HEART}</button>
        <button class="act ${isFollowing ? 'on' : ''}" data-act="follow" aria-label="Follow">${isFollowing ? '✓' : '+'}</button>
        <button class="act" data-act="comment" aria-label="Comment">💬${cmts.length ? ' ' + cmts.length : ''}</button>
        <button class="act" data-act="sound" aria-label="Sound">${muted ? '🔇' : '🔊'}</button>
        <button class="act" data-act="share" aria-label="Share">↗</button>
        <button class="act" data-act="details" aria-label="Details">ℹ️</button>
      </div>`;
    feed.appendChild(el);
    const vid = el.querySelector('video');
    if (vid) {
      vid.addEventListener('loadedmetadata', () => {
        meta[v.id] = { width: vid.videoWidth, height: vid.videoHeight, duration: vid.duration, sizeMB: v.sizeMB || 0 };
        if (vid.videoWidth > vid.videoHeight) el.classList.add('landscape');
        const b = el.querySelector('.qbadge'); if (b) b.textContent = qualityBadge(v);
      });
    }
    io.observe(el);
  }
  feed.scrollTop = 0;
}

/* ---------- Autoplay only the visible reel (purana + music + pause others) ---------- */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    const vid = e.target.querySelector('video');
    const frame = e.target.querySelector('iframe');
    const v = videos.find(x => x.id === e.target.dataset.id);
    if (e.isIntersecting) {
      $$('#feed video').forEach(o => { if (o !== vid) o.pause(); });
      if (vid) { vid.muted = muted; vid.play().catch(() => {}); startMusic(v); }
      if (frame && !frame.src) {
        frame.src = `https://www.youtube.com/embed/${frame.dataset.yt}?autoplay=1&playsinline=1&rel=0&mute=${muted ? 1 : 0}&enablejsapi=1`;
      }
    } else {
      if (vid) vid.pause();
      if (frame && frame.src) frame.src = '';
      stopMusic();
    }
  }
}, { root: feed, threshold: 0.6 });

/* ---------- ADVANCED: dialogs (agar HTML me hon to hi khulenge) ---------- */
function openDlg(el) {
  if (!el) return false;
  try { if (typeof el.showModal === 'function') el.showModal(); else el.classList.add('open'); return true; }
  catch (e) { el.classList.add('open'); return true; }
}
function closeDlg(el) { if (!el) return; try { el.close(); } catch (e) {} el.classList.remove('open'); }

function renderComments() {
  const listEl = $('#commentList'); if (!listEl) return;
  const cmts = commentsMap[currentCommentId] || [];
  listEl.innerHTML = cmts.length ? cmts.map(c => `<div>${esc(c)}</div>`).join('') : '<div class="muted">Abhi koi comment nahi.</div>';
}
function renderShareList() {
  const box = $('#shareList'); if (!box || !currentShareVideo) return;
  const list = [...following];
  box.innerHTML = list.length ? list.map(a =>
    `<div class="share-row"><div><b>@${esc(a)}</b><div class="muted">User ID: ${userIdFor(a)}</div></div>` +
    `<button class="primary" data-share-to="${esc(a)}">Share</button></div>`).join('')
    : '<p class="muted">Abhi kisi ko follow nahi kiya. Pehle kisi video par + (Follow) dabao, phir wahi account yahan dikhega.</p>';
}
function renderDetails(v) {
  const box = $('#detailsBox'); if (!box) return;
  const m = meta[v.id] || {};
  box.innerHTML =
    `<b>Title:</b> ${esc(v.title)}<br><b>Author:</b> @${esc(v.author)} (ID: ${userIdFor(v.author)})<br>` +
    `<b>Source:</b> ${ytId(v.src) ? 'YouTube' : (v.isFile ? 'Phone ki file (is session me)' : 'MP4 link')}<br>` +
    `<b>Quality:</b> ${qualityBadge(v)} • Setting: ${qualityLabels[qualityPref]}<br>` +
    `<b>Size:</b> ${fmtSize(v.sizeMB || m.sizeMB)}<br><b>Duration:</b> ${fmtTime(m.duration)}<br>` +
    `<b>Aspect:</b> ${aspectLabel(v)}<br><b>Likes:</b> ${likes.has(v.id) ? 'Saved ❤️' : '—'} • <b>Comments:</b> ${(commentsMap[v.id] || []).length}<br>` +
    `<b>Tags:</b> ${(v.tags || []).join(', ') || '—'} • <b>Music:</b> ${esc(v.music || 'none')}`;
}

/* ---------- ADVANCED: Explore / Related / Profile ---------- */
function renderExplore() {
  const tags = likedTags();
  const related = [...videos].sort((a, b) => {
    const sa = (a.tags || []).filter(t => tags.has(t)).length, sb = (b.tags || []).filter(t => tags.has(t)).length;
    return sb - sa;
  });
  const relEl = $('#relatedList');
  if (relEl) relEl.innerHTML = related.slice(0, 5).map(v =>
    `<div class="related-item" data-open="${v.id}"><b>${esc(v.title)}</b><div class="muted">@${esc(v.author)} • ${(v.tags || []).join(' ')}</div></div>`).join('');
  const grid = $('#exploreGrid');
  if (grid) {
    const list = visibleList();
    grid.innerHTML = list.map(v => `<div class="thumb" data-open="${v.id}">${esc(v.title)}<div class="muted">@${esc(v.author)}</div></div>`).join('') || '<p class="muted">Kuch nahi mila.</p>';
  }
}
function renderProfile() {
  const s = $('#profileStats'); if (s) s.innerHTML = `Total videos: ${videos.length} • Saved: ${[...likes].length} • Following: ${following.size}`;
  const g = $('#profileGrid'); if (g) g.innerHTML = videos.filter(v => v.author === 'me').map(v => `<div class="thumb" data-open="${v.id}">${esc(v.title)}</div>`).join('') || '<p class="muted">Tumhari (author: me) koi video nahi.</p>';
}
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) { tab = 'home'; showView('home'); render(); setTimeout(() => { const el = document.querySelector(`.reel[data-id="${opener.dataset.open}"]`); if (el) el.scrollIntoView({ block: 'start' }); }, 80); }
  const shareBtn = e.target.closest('[data-share-to]');
  if (shareBtn) { toast(`@${shareBtn.dataset.shareTo} ko share ho gaya ✓`); closeDlg($('#shareDialog')); }
});

/* ---------- Views (purane HTML me .view na ho to sirf feed dikhega) ---------- */
function showView(name) {
  const views = $$('.view');
  if (!views.length) { tab = 'home'; render(); return; }
  views.forEach(v => v.classList.remove('active'));
  const target = $('#view-' + name);
  if (target) target.classList.add('active'); else $('#view-home')?.classList.add('active');
  $$('.bottombar button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('#feed video').forEach(v => v.pause()); stopMusic();
}
function setTab(newTab, btn) {
  if (newTab === 'add') { openDlg($('#addDialog')); return; }
  tab = newTab;
  if (btn) $$('.bottombar button').forEach(x => x.classList.toggle('active', x === btn));
  if (tab === 'explore') renderExplore();
  if (tab === 'profile') renderProfile();
  if (['explore', 'settings', 'help', 'profile'].includes(tab)) showView(tab);
  else { showView('home'); render(); }
}

/* ---------- Interactions (purana + naye actions) ---------- */
if (feed) feed.addEventListener('click', (e) => {
  const reel = e.target.closest('.reel');
  if (!reel) return;
  const v = videos.find(x => x.id === reel.dataset.id);
  if (!v) return;
  const btn = e.target.closest('[data-act]');

  if (!btn) {                       // tap on video = play / pause
    const vid = reel.querySelector('video');
    if (vid) { if (vid.paused) { vid.play(); startMusic(v); } else { vid.pause(); stopMusic(); } }
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

  // ADVANCED: follow
  if (act === 'follow') {
    if (following.has(v.author)) following.delete(v.author); else following.add(v.author);
    store.set('vibe.following', [...following]);
    btn.classList.toggle('on', following.has(v.author));
    btn.textContent = following.has(v.author) ? '✓' : '+';
    toast(following.has(v.author) ? `@${v.author} ko follow kiya` : `@${v.author} ko unfollow kiya`);
  }

  // ADVANCED: comment
  if (act === 'comment') {
    currentCommentId = v.id; renderComments();
    if (!openDlg($('#commentDialog'))) toast('Comment dialog naye HTML me hai');
  }

  if (act === 'sound') {
    muted = !muted;
    $$('video').forEach(x => (x.muted = muted));
    $$('.act[data-act="sound"]').forEach(b => (b.textContent = muted ? '🔇' : '🔊'));
    // YouTube iframe ka mute bhi update karo (reload ke saath)
    $$('#feed iframe').forEach(f => { if (f.src) f.src = f.src.replace(/mute=[01]/, 'mute=' + (muted ? 1 : 0)); });
  }

  // ADVANCED: share — pehle followed list, fallback purana native share
  if (act === 'share') {
    currentShareVideo = v; renderShareList();
    if (!openDlg($('#shareDialog'))) {
      if (navigator.share) navigator.share({ title: v.title, url: v.src }).catch(() => {});
      else { navigator.clipboard?.writeText(v.src); toast('Link copy ho gaya'); }
    }
  }

  // ADVANCED: details
  if (act === 'details') {
    renderDetails(v);
    if (!openDlg($('#detailsDialog'))) toast(`Quality: ${qualityBadge(v)} • Size: ${fmtSize(v.sizeMB || (meta[v.id] || {}).sizeMB)}`);
  }
});

if (feed) feed.addEventListener('dblclick', (e) => {
  const reel = e.target.closest('.reel'); if (!reel) return;
  const v = videos.find(x => x.id === reel.dataset.id); if (!v || likes.has(v.id)) return;
  likes.add(v.id); store.set('vibe.likes', [...likes]); render(); toast('Saved ❤️');
});

// ADVANCED: guarded search (purane crash ka fix — #search na ho to bhi render chalega)
const searchEl = $('#search');
if (searchEl) searchEl.addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  if (tab === 'explore') renderExplore(); else render();
});

$$('.bottombar button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab, b)));

// ADVANCED: topbar settings / help (agar hon to)
const settingsBtn = $('#settingsBtn'); if (settingsBtn) settingsBtn.addEventListener('click', () => { tab = 'settings'; showView('settings'); });
const helpBtn = $('#helpBtn'); if (helpBtn) helpBtn.addEventListener('click', () => { tab = 'help'; showView('help'); });
const homeLogo = $('#logoBtn'); if (homeLogo) homeLogo.addEventListener('click', () => setTab('home', document.querySelector('.bottombar button[data-tab="home"]')));

/* ---------- Add video dialog (purana + file / tags / music) ---------- */
const dlg = $('#addDialog');
const cancelBtn = $('#cancelBtn');
if (cancelBtn && dlg) cancelBtn.addEventListener('click', () => closeDlg(dlg));

const addForm = $('#addForm');
if (addForm) addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const title = (fd.get('title') || '').trim();
  const url = (fd.get('url') || '').trim();
  const file = fd.get('videoFile');
  const hasFile = file && file.size > 0;
  if (!title || (!url && !hasFile)) { toast('Title aur video (link ya file) dono chahiye'); return; }

  const tags = (fd.get('tags') || '').split(/[#,\s]+/).filter(Boolean);
  const music = fd.get('music') || 'none';
  const audioFile = fd.get('audioFile');
  const item = {
    id: 'u' + Date.now(),
    title,
    author: (fd.get('author') || 'me').trim().replace(/^@/, ''),
    src: hasFile ? URL.createObjectURL(file) : url,
    tags: tags.length ? tags : ['new'],
    music: music === 'file' ? 'file' : music,
    audioSrc: (music === 'file' && audioFile && audioFile.size > 0) ? URL.createObjectURL(audioFile) : null,
    sizeMB: hasFile ? file.size / (1024 * 1024) : 0,
    isFile: hasFile,
  };
  if (hasFile) {
    // Blob URL reload ke baad kaam nahi karta, isliye file wali ko localStorage me mat daalo
    videos.push(item);
    toast('Video add ho gaya 🎬 (file wali sirf is session me dikhegi, URL wali hamesha bachegi)');
  } else {
    custom.push(item);
    store.set('vibe.custom', custom);
    videos.push(item);
    toast('Video add ho gaya 🎬');
  }

  e.target.reset();
  closeDlg(dlg);
  setTab('home', document.querySelector('.bottombar button[data-tab="home"]'));
});

/* ---------- ADVANCED: comment / share / details close + forms ------