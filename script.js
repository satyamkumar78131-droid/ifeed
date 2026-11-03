// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const feed = $("#feed");
const modal = $("#commentModal");
const commentList = $("#commentList");
const commentForm = $("#commentForm");
const commentInput = $("#commentInput");
const videoInput = $("#videoInput");

const screens = {
  profile: $("#profileScreen"),
  edit: $("#editScreen"),
  login: $("#loginScreen"),
};

const state = {
  loggedIn: false,
  muted: true,
  currentReelId: null,
  postCount: 0,
  profile: {
    name: "iFeed",
    username: "@ifeed",
    bio: "Welcome to my iFeed profile ✨",
  },
};

const comments = {};          // { reelId: [{ user, text }] }
const followed = new Set();   // reel ids jinko follow kiya
const saved = new Set();      // reel ids jo save ki
const watchHistory = [];      // jo videos play hui (UI mein nahi, sirf store)

function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed",
    bottom: "84px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(30,30,40,.95)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    zIndex: "100",
    transition: "opacity .3s",
    whiteSpace: "nowrap",
  });
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

function openScreen(s) { s.classList.add("show"); }
function closeScreen(s) { s.classList.remove("show"); }
function closeAllScreens() {
  Object.values(screens).forEach(closeScreen);
  modal.classList.remove("show");
}

function setActive(btn) {
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
}

function requireLogin() {
  if (state.loggedIn) return true;
  showToast("Pehle login karein");
  openScreen(screens.login);
  return false;
}

// ===== Reel setup =====
function addAction(reel, cls, icon, label, onClick) {
  const btn = document.createElement("button");
  btn.className = `action ${cls}`;
  btn.innerHTML = `<span>${icon}</span><small>${label}</small>`;
  btn.addEventListener("click", onClick);
  $(".reel-actions", reel).appendChild(btn);
  return btn;
}

function loadVideo(video) {
  if (!video.getAttribute("src") && video.dataset.src) {
    video.src = video.dataset.src;
    video.preload = "auto";
  }
}

function setupReel(reel) {
  const id = reel.dataset.id;
  const video = $(".reel-video", reel);
  comments[id] ??= [];

  // Lazy loading: src ko data-src mein rakho, zarurat padne par load karo
  if (video.getAttribute("src")) {
    video.dataset.src = video.getAttribute("src");
    video.removeAttribute("src");
  }
  video.muted = state.muted;
  video.preload = "none";

  // Seek bar
  const seek = document.createElement("input");
  seek.type = "range";
  seek.min = 0;
  seek.max = 100;
  seek.step = 0.1;
  seek.value = 0;
  seek.className = "seek";
  Object.assign(seek.style, {
    position: "absolute",
    left: "0",
    right: "0",
    bottom: "0",
    width: "100%",
    height: "4px",
    margin: "0",
    zIndex: "5",
  });
  reel.appendChild(seek);

  video.addEventListener("timeupdate", () => {
    if (video.duration) seek.value = (video.currentTime / video.duration) * 100;
  });
  seek.addEventListener("input", () => {
    if (video.duration) video.currentTime = (seek.value / 100) * video.duration;
  });

  // Tap par play/pause
  video.addEventListener("click", () => {
    video.paused ? video.play() : video.pause();
  });

  // Watch history
  video.addEventListener("play", () => {
    if (watchHistory[0] !== id) {
      watchHistory.unshift(id);
      if (watchHistory.length > 50) watchHistory.length = 50;
    }
  });

  // Like
  const likeBtn = $(".likeBtn", reel);
  const likeCount = $(".likeCount", reel);
  let likes = 0;
  likeBtn.addEventListener("click", () => {
    if (!requireLogin()) return;
    const liked = likeBtn.classList.toggle("liked");
    likes += liked ? 1 : -1;
    likeCount.textContent = likes;
    $("span", likeBtn).textContent = liked ? "♥" : "♡";
  });

  // Comment
  $(".commentBtn", reel).addEventListener("click", () => {
    if (!requireLogin()) return;
    state.currentReelId = id;
    renderComments(id);
    modal.classList.add("show");
    commentInput.focus();
  });

  // Share
  $(".shareBtn", reel).addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "iFeed",
          text: $(".caption", reel).textContent,
          url: location.href,
        });
      } else {
        await navigator.clipboard.writeText(location.href);
        showToast("Link copy ho gaya");
      }
    } catch (_) {}
  });

  // Follow
  const followBtn = $(".follow-btn", reel);
  followBtn.addEventListener("click", () => {
    if (!requireLogin()) return;
    if (followed.has(id)) followed.delete(id);
    else followed.add(id);
    followBtn.textContent = followed.has(id) ? "Following" : "Follow";
  });

  // Mute
  const muteBtn = addAction(reel, "muteBtn", state.muted ? "🔇" : "🔊", "Sound", () => {
    state.muted = !state.muted;
    $$(".reel-video").forEach((v) => (v.muted = state.muted));
    $$(".muteBtn span").forEach((s) => (s.textContent = state.muted ? "🔇" : "🔊"));
  });

  // Save
  const saveBtn = addAction(reel, "saveBtn", "🔖", "Save", () => {
    if (!requireLogin()) return;
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    const on = saved.has(id);
    saveBtn.classList.toggle("saved", on);
    $("span", saveBtn).textContent = on ? "🔖" : "🏷";
    showToast(on ? "Video save ho gayi" : "Save hata diya");
  });

  // Fullscreen
  addAction(reel, "fullBtn", "⤢", "Full", () => {
    const req = video.requestFullscreen || video.webkitRequestFullscreen;
    if (req) req.call(video);
  });
}

function reelTemplate(id) {
  return `
    <video class="reel-video" muted loop playsinline preload="metadata"></video>
    <div class="video-shade"></div>
    <div class="reel-details">
      <div class="creator">
        <div class="avatar"></div>
        <b></b>
        <button class="follow-btn">Follow</button>
      </div>
      <p class="caption"></p>
      <p class="music"></p>
    </div>
    <div class="reel-actions">
      <button class="action likeBtn"><span>♡</span><small class="likeCount">0</small></button>
      <button class="action commentBtn"><span>▢</span><small>Comment</small></button>
      <button class="action shareBtn"><span>➤</span><small>Share</small></button>
    </div>`;
}

// ===== Observers =====
// Lazy load: screen ke paas aane par hi video load hogi
const loadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) loadVideo($(".reel-video", e.target));
    });
  },
  { root: feed, rootMargin: "100% 0px" }
);

// Autoplay: jo reel 60% dikhe wahi chale, baaki pause
const playObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      const video = $(".reel-video", e.target);
      if (e.isIntersecting) {
        loadVideo(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  { root: feed, threshold: 0.6 }
);

function registerReel(reel) {
  setupReel(reel);
  loadObserver.observe(reel);
  playObserver.observe(reel);
}

// ===== Comments =====
function renderComments(id) {
  commentList.innerHTML = "";
  const list = comments[id] || [];
  if (!list.length) {
    commentList.textContent = "No comments yet. Be the first!";
    return;
  }
  list.forEach((c) => {
    const row = document.createElement("div");
    row.className = "comment";
    const b = document.createElement("b");
    b.textContent = c.user;
    row.append(b, document.createTextNode(c.text));
    commentList.appendChild(row);
  });
  commentList.scrollTop = commentList.scrollHeight;
}

function closeComments() {
  modal.classList.remove("show");
  state.currentReelId = null;
}

$("#closeComments").addEventListener("click", closeComments);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeComments();
});

commentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  const id = state.currentReelId;
  if (!text || !id) return;
  comments[id].push({ user: state.profile.username, text });
  commentInput.value = "";
  renderComments(id);
});

// ===== Search & Explore =====
function searchVideos() {
  const input = prompt("Caption ya creator ka naam likhein (khali chhodein to sab dikhega):");
  if (input === null) return;
  const q = input.trim().toLowerCase();

  $$(".reel").forEach((reel) => {
    reel.style.display = !q || reel.textContent.toLowerCase().includes(q) ? "" : "none";
  });
  feed.scrollTop = 0;
  showToast(q ? `"${q}" ke results` : "Sab videos dikh rahi hain");
}

$("#searchBtn").addEventListener("click", searchVideos);
$("#exploreBtn").addEventListener("click", () => {
  setActive($("#exploreBtn"));
  searchVideos();
});

// ===== Upload =====
function openUpload() {
  if (requireLogin()) videoInput.click();
}

$("#uploadBtn").addEventListener("click", openUpload);
$("#navUpload").addEventListener("click", openUpload);

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  const id = `upload_${Date.now()}`;
  const url = URL.createObjectURL(file);
  feed.insertAdjacentHTML("beforeend", `<section class="reel" data-id="${id}">${reelTemplate(id)}</section>`);

  const reel = $(`.reel[data-id="${id}"]`);
  $(".reel-video", reel).setAttribute("src", url);
  $(".avatar", reel).textContent = state.profile.username.charAt(1).toUpperCase();
  $(".creator b", reel).textContent = state.profile.username;
  $(".caption", reel).textContent = `Uploaded: ${file.name}`;
  $(".music", reel).textContent = `♫ Original audio · ${state.profile.username}`;

  registerReel(reel);
  state.postCount++;
  renderProfile();
  reel.scrollIntoView({ behavior: "smooth" });
  videoInput.value = "";
  showToast("Video upload ho gaya");
});

// ===== Navigation =====
$("#homeBtn").addEventListener("click", () => {
  closeAllScreens();
  setActive($("#homeBtn"));
  feed.scrollTo({ top: 0, behavior: "smooth" });
});

$("#activityBtn").addEventListener("click", () => {
  setActive($("#activityBtn"));
  if (!requireLogin()) return;
  showToast("Activity abhi basic demo mein hai");
});

$("#profileBtn").addEventListener("click", () => {
  setActive($("#profileBtn"));
  if (!state.loggedIn) {
    openScreen(screens.login);
    return;
  }
  renderProfile();
  openScreen(screens.profile);
});

$("#backToFeed").addEventListener("click", () => {
  closeScreen(screens.profile);
  setActive($("#homeBtn"));
});

// ===== Login =====
$("#closeLogin").addEventListener("click", () => closeScreen(screens.login));

$("#loginBtn").addEventListener("click", () => {
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  if (!email || !password) {
    showToast("Email aur password dono bharein");
    return;
  }
  state.loggedIn = true;
  closeScreen(screens.login);
  renderProfile();
  openScreen(screens.profile);
  showToast("Demo login ho gaya");
});

// ===== Profile & Edit =====
function renderProfile() {
  $("#profileName").textContent = state.profile.name;
  $("#profileUsername").textContent = state.profile.username;
  $("#profileBio").textContent = state.profile.bio;
  $("#postCount").textContent = state.postCount;
}

function openEdit() {
  $("#editName").value = state.profile.name;
  $("#editUsername").value = state.profile.username;
  $("#editBio").value = state.profile.bio;
  openScreen(screens.edit);
}

$("#editProfileBtn").addEventListener("click", openEdit);
$("#editProfileMain").addEventListener("click", openEdit);
$("#cancelEdit").addEventListener("click", () => closeScreen(screens.edit));

$("#saveProfileBtn").addEventListener("click", () => {
  const name = $("#editName").value.trim() || "iFeed";
  let username = $("#editUsername").value.trim() || "@ifeed";
  if (!username.startsWith("@")) username = "@" + username;
  state.profile = { name, username, bio: $("#editBio").value.trim() };
  renderProfile();
  closeScreen(screens.edit);
  showToast("Profile save ho gaya");
});

// ===== Init =====
$$(".reel").forEach(registerReel);
state.postCount = $$(".reel").length;
renderProfile();
setActive($("#homeBtn"));