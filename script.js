
document.addEventListener("DOMContentLoaded", () => {
  const feed = document.getElementById("feed");
  const videoInput = document.getElementById("videoInput");
  const modal = document.getElementById("commentModal");
  const commentList = document.getElementById("commentList");
  const commentInput = document.getElementById("commentInput");

  let currentReel = null;
  let observer = null;

  // STORAGE HELPERS
  function getSaved(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      alert("Device storage is full or unavailable.");
    }
  }

  // SCREEN NAVIGATION
  const screens = [
    "profileScreen",
    "editScreen",
    "loginScreen"
  ];

  function showScreen(id) {
    screens.forEach(screenId => {
      document.getElementById(screenId).classList.remove("show");
    });

    document.getElementById(id).classList.add("show");
  }

  function closeScreens() {
    screens.forEach(id => {
      document.getElementById(id).classList.remove("show");
    });
  }

  // PROFILE DATA
  function loadProfile() {
    const profile = getSaved("ifeed_profile", {
      name: "iFeed",
      username: "ifeed",
      bio: "Welcome to my iFeed profile ✨"
    });

    document.getElementById("profileName").textContent =
      profile.name;

    document.getElementById("profileUsername").textContent =
      "@" + profile.username;

    document.getElementById("profileBio").textContent =
      profile.bio;

    document.getElementById("editName").value =
      profile.name;

    document.getElementById("editUsername").value =
      profile.username;

    document.getElementById("editBio").value =
      profile.bio;

    document.getElementById("postCount").textContent =
      document.querySelectorAll(".reel").length;
  }

  function openEditProfile() {
    loadProfile();
    showScreen("editScreen");
  }

  function saveProfile() {
    const name = document.getElementById("editName").value.trim();
    const username = document.getElementById("editUsername").value
      .trim()
      .replace(/^@/, "")
      .replace(/[^a-zA-Z0-9_.]/g, "");

    const bio = document.getElementById("editBio").value.trim();

    if (!name || !username) {
      alert("Name and username are required.");
      return;
    }

    const profile = { name, username, bio };

    save("ifeed_profile", profile);
    loadProfile();
    showScreen("profileScreen");
    alert("Profile updated!");
  }

  document.getElementById("profileBtn").onclick = () => {
    loadProfile();
    showScreen("profileScreen");
  };

  document.getElementById("backToFeed").onclick = closeScreens;
  document.getElementById("cancelEdit").onclick = () => {
    showScreen("profileScreen");
  };

  document.getElementById("editProfileBtn").onclick =
    openEditProfile;

  document.getElementById("editProfileMain").onclick =
    openEditProfile;

  document.getElementById("saveProfileBtn").onclick =
    saveProfile;

  // DEMO LOGIN UI
  document.getElementById("loginOpenBtn").onclick = () => {
    showScreen("loginScreen");
  };

  document.getElementById("closeLogin").onclick = () => {
    showScreen("profileScreen");
  };

  document.getElementById("loginBtn").onclick = () => {
    const email = document.getElementById("loginEmail")
      .value.trim();

    const password = document.getElementById("loginPassword")
      .value;

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    alert(
      "This is only a demo login screen. Real account login is not connected yet."
    );
  };

  // LIKE SYSTEM
  function setupLike(reel) {
    const id = reel.dataset.id;
    const button = reel.querySelector(".likeBtn");
    const countElement = reel.querySelector(".likeCount");

    const likes = getSaved("ifeed_likes", {});
    let liked = Boolean(likes[id]?.liked);
    let count = Number(likes[id]?.count) || 0;

    function update() {
      button.classList.toggle("liked", liked);
      button.querySelector("span").textContent =
        liked ? "♥" : "♡";

      countElement.textContent = count;
    }

    update();

    button.onclick = () => {
      liked = !liked;
      count = Math.max(0, count + (liked ? 1 : -1));

      const updatedLikes = getSaved("ifeed_likes", {});
      updatedLikes[id] = { liked, count };

      save("ifeed_likes", updatedLikes);
      update();
    };
  }

  // COMMENT SYSTEM
  function showComments(id) {
    const allComments = getSaved("ifeed_comments", {});
    const comments = allComments[id] || [];

    commentList.innerHTML = "";

    if (!comments.length) {
      commentList.textContent =
        "No comments yet. Be the first!";
      return;
    }

    comments.forEach(item => {
      const div = document.createElement("div");
      div.className = "comment";

      const name = document.createElement("b");
      name.textContent = "@you";

      const message = document.createElement("span");
      message.textContent = item;

      div.append(name, message);
      commentList.appendChild(div);
    });
  }

  function setupComments(reel) {
    const id = reel.dataset.id;

    reel.querySelector(".commentBtn").onclick = () => {
      currentReel = id;
      showComments(id);
      modal.classList.add("show");
    };
  }

  document.getElementById("commentForm").onsubmit = event => {
    event.preventDefault();

    const message = commentInput.value.trim();

    if (!message || !currentReel) return;

    const allComments = getSaved("ifeed_comments", {});
    allComments[currentReel] =
      allComments[currentReel] || [];

    allComments[currentReel].push(message);

    save("ifeed_comments", allComments);

    commentInput.value = "";
    showComments(currentReel);
  };

  document.getElementById("closeComments").onclick = () => {
    modal.classList.remove("show");
  };

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.remove("show");
    }
  });

  // SHARE SYSTEM
  function setupShare(reel) {
    reel.querySelector(".shareBtn").onclick = async () => {
      const shareData = {
        title: "iFeed",
        text: "Check out this video on iFeed!"
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          // Sharing cancelled.
        }
      } else {
        alert("Sharing is not supported in this browser.");
      }
    };
  }

  // SINGLE VIDEO PLAYBACK
  function pauseAllExcept(activeVideo) {
    document.querySelectorAll(".reel-video").forEach(video => {
      if (video !== activeVideo) {
        video.pause();
      }
    });
  }

  function activateVideo(video) {
    if (!video) return;

    pauseAllExcept(video);
    video.play().catch(() => {});
  }

  function setupVideo(reel) {
    const video = reel.querySelector(".reel-video");

    video.autoplay = false;
    video.pause();

    video.addEventListener("click", () => {
      if (video.paused) {
        activateVideo(video);
      } else {
        video.pause();
      }
    });

    if (observer) {
      observer.observe(video);
    }
  }

  // SETUP REEL
  function setupReel(reel) {
    setupLike(reel);
    setupComments(reel);
    setupShare(reel);
    setupVideo(reel);
  }

  // FIND MOST VISIBLE VIDEO
  function updateActiveVideo() {
    const videos = [
      ...document.querySelectorAll(".reel-video")
    ];

    const feedRect = feed.getBoundingClientRect();

    let bestVideo = null;
    let bestRatio = 0;

    videos.forEach(video => {
      const rect = video.getBoundingClientRect();

      const visibleHeight = Math.max(
        0,
        Math.min(rect.bottom, feedRect.bottom) -
        Math.max(rect.top, feedRect.top)
      );

      const ratio = rect.height
        ? visibleHeight / rect.height
        : 0;

      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestVideo = video;
      }
    });

    if (bestVideo && bestRatio >= 0.65) {
      activateVideo(bestVideo);
    } else {
      pauseAllExcept(null);
    }
  }

  observer = new IntersectionObserver(() => {
    updateActiveVideo();
  }, {
    root: feed,
    threshold: [0, 0.25, 0.65, 1]
  });

  feed.addEventListener("scroll", updateActiveVideo);

  // VIDEO UPLOAD
  function openUpload() {
    videoInput.click();
  }

  document.getElementById("uploadBtn").onclick = openUpload;
  document.getElementById("navUpload").onclick = openUpload;

  videoInput.addEventListener("change", () => {
    const file = videoInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.");
      videoInput.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    const id = "upload_" + Date.now();

    const reel = document.createElement("section");
    reel.className = "reel";
    reel.dataset.id = id;

    reel.innerHTML = `
      <video class="reel-video" muted loop playsinline></video>

      <div class="video-shade"></div>

      <div class="reel-details">
        <div class="creator">
          <div class="avatar">i</div>
          <b>@ifeed</b>
          <button class="follow-btn">Following</button>
        </div>

        <p class="caption"></p>
        <p class="music">♫ Original audio · iFeed</p>
      </div>

      <div class="reel-actions">
        <button class="action likeBtn">
          <span>♡</span>
          <small class="likeCount">0</small>
        </button>

        <button class="action commentBtn">
          <span>▢</span>
          <small>Comment</small>
        </button>

        <button class="action shareBtn">
          <span>➤</span>
          <small>Share</small>
        </button>
      </div>
    `;

    const video = reel.querySelector("video");
    video.src = url;

    reel.querySelector(".caption").textContent = file.name;

    feed.appendChild(reel);
    setupReel(reel);

    document.getElementById("postCount").textContent =
      document.querySelectorAll(".reel").length;

    reel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    videoInput.value = "";
  });

  // HOME
  document.getElementById("homeBtn").onclick = () => {
    closeScreens();

    feed.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // SEARCH
  document.getElementById("searchBtn").onclick = () => {
    const query = prompt("Search creators or captions:");

    if (!query) return;

    const reels = [...document.querySelectorAll(".reel")];

    const found = reels.find(reel =>
      reel.textContent.toLowerCase().includes(
        query.toLowerCase()
      )
    );

    if (found) {
      closeScreens();
      found.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("No matching video found.");
    }
  };

  // EXPLORE
  document.getElementById("exploreBtn").onclick = () => {
    closeScreens();

    feed.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    alert("Explore: More videos coming soon!");
  };

  // ACTIVITY
  document.getElementById("activityBtn").onclick = () => {
    const likes = getSaved("ifeed_likes", {});
    const totalLikes = Object.values(likes)
      .filter(item => item.liked).length;

    alert("Your liked videos: " + totalLikes);
  };

  // INITIALIZE
  document.querySelectorAll(".reel").forEach(setupReel);

  loadProfile();

  console.log("iFeed V4 Ready!");
});
