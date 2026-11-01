
document.addEventListener("DOMContentLoaded", () => {
  const feed = document.getElementById("feed");
  const videoInput = document.getElementById("videoInput");
  const modal = document.getElementById("commentModal");
  const commentList = document.getElementById("commentList");
  const commentInput = document.getElementById("commentInput");

  let currentReel = null;
  let observer = null;

  // SAFE LOCAL STORAGE
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
      button.querySelector("span").textContent = liked ? "♥" : "♡";
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
      commentList.textContent = "No comments yet. Be the first!";
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

  document.getElementById("commentForm").addEventListener("submit", event => {
    event.preventDefault();

    const message = commentInput.value.trim();

    if (!message || !currentReel) return;

    const allComments = getSaved("ifeed_comments", {});
    allComments[currentReel] = allComments[currentReel] || [];
    allComments[currentReel].push(message);

    save("ifeed_comments", allComments);

    commentInput.value = "";
    showComments(currentReel);
  });

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
          // Sharing cancelled by user
        }
      } else {
        alert("Sharing is not supported in this browser.");
      }
    };
  }

  // VIDEO PLAYBACK SYSTEM
  function setupVideo(reel) {
    const video = reel.querySelector(".reel-video");

    // All videos start paused.
    video.autoplay = false;
    video.pause();

    video.addEventListener("click", () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    if (observer) {
      observer.observe(video);
    }
  }

  // SETUP EACH REEL
  function setupReel(reel) {
    setupLike(reel);
    setupComments(reel);
    setupShare(reel);
    setupVideo(reel);
  }

  // ONLY ONE VIDEO CAN PLAY AT A TIME
  function pauseAllExcept(activeVideo) {
    document.querySelectorAll(".reel-video").forEach(video => {
      if (video !== activeVideo && !video.paused) {
        video.pause();
      }
    });
  }

  observer = new IntersectionObserver(entries => {
    let activeVideo = null;
    let maxVisibility = 0;

    entries.forEach(entry => {
      if (
        entry.isIntersecting &&
        entry.intersectionRatio > maxVisibility
      ) {
        maxVisibility = entry.intersectionRatio;
        activeVideo = entry.target;
      }
    });

    if (activeVideo && maxVisibility >= 0.65) {
      pauseAllExcept(activeVideo);
      activeVideo.play().catch(() => {});
    }
  }, {
    root: feed,
    threshold: [0, 0.65, 1]
  });

  // UPLOAD SYSTEM
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
          <div class="avatar">Y</div>
          <b>@you</b>
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

    // Pause current videos before adding the new reel.
    pauseAllExcept(null);

    feed.appendChild(reel);

    setupReel(reel);

    reel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    videoInput.value = "";
  });

  // NAVIGATION
  document.getElementById("homeBtn").onclick = () => {
    feed.scrollTo({ top: 0, behavior: "smooth" });
  };

  document.getElementById("searchBtn").onclick = () => {
    const query = prompt("Search creators or captions:");

    if (!query) return;

    const reels = [...document.querySelectorAll(".reel")];

    const found = reels.find(reel =>
      reel.textContent.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      found.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("No matching video found.");
    }
  };

  document.getElementById("exploreBtn").onclick = () => {
    feed.scrollTo({ top: 0, behavior: "smooth" });
    alert("Explore: More videos coming soon!");
  };

  document.getElementById("activityBtn").onclick = () => {
    alert("Your likes and comments are saved on this device.");
  };

  document.getElementById("profileBtn").onclick = () => {
    alert("Profile: @you");
  };

  // INITIALIZE EXISTING VIDEOS
  document.querySelectorAll(".reel").forEach(setupReel);

  console.log("iFeed Modern V3 Ready!");
});
