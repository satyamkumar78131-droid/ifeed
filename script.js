
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>iFeed - Your Videos. Your Feed. Your World.</title>

  <meta name="theme-color" content="#09090f">
  <meta name="description" content="Discover and share videos on iFeed.">

  <link rel="manifest" href="./manifest.json">
  <link rel="stylesheet" href="./style.css">
</head>

<body>

  <!-- TOP HEADER -->
  <header class="topbar">
    <div class="logo">iFeed<span>.</span></div>

    <div class="top-actions">
      <button id="searchBtn" aria-label="Search">⌕</button>
      <button id="uploadBtn" aria-label="Upload video">＋</button>
    </div>
  </header>

  <!-- VIDEO FEED -->
  <main id="feed">

    <!-- VIDEO 1 -->
    <section class="reel" data-id="video_1">

      <video
        class="reel-video"
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        muted
        loop
        playsinline
        preload="metadata">
      </video>

      <div class="video-shade"></div>

      <div class="reel-details">
        <div class="creator">
          <div class="avatar">i</div>
          <b>@ifeed</b>
          <button class="follow-btn">Follow</button>
        </div>

        <p class="caption">Welcome to iFeed! ✨</p>
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
    </section>

    <!-- VIDEO 2 -->
    <section class="reel" data-id="video_2">

      <video
        class="reel-video"
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        muted
        loop
        playsinline
        preload="metadata">
      </video>

      <div class="video-shade"></div>

      <div class="reel-details">
        <div class="creator">
          <div class="avatar">i</div>
          <b>@ifeed</b>
          <button class="follow-btn">Follow</button>
        </div>

        <p class="caption">Discover something amazing! 🚀</p>
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
    </section>

    <!-- VIDEO 3 -->
    <section class="reel" data-id="video_3">

      <video
        class="reel-video"
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        muted
        loop
        playsinline
        preload="metadata">
      </video>

      <div class="video-shade"></div>

      <div class="reel-details">
        <div class="creator">
          <div class="avatar">i</div>
          <b>@ifeed</b>
          <button class="follow-btn">Follow</button>
        </div>

        <p class="caption">Your Videos. Your Feed. Your World.</p>
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
    </section>

  </main>

  <!-- VIDEO UPLOAD INPUT -->
  <input
    type="file"
    id="videoInput"
    accept="video/*"
    hidden
  >

  <!-- BOTTOM NAVIGATION -->
  <nav class="bottom-nav">

    <button id="homeBtn" class="nav-item">
      <span>⌂</span>
      <small>Home</small>
    </button>

    <button id="exploreBtn" class="nav-item">
      <span>⌕</span>
      <small>Explore</small>
    </button>

    <button id="navUpload" class="nav-item">
      <span>＋</span>
      <small>Upload</small>
    </button>

    <button id="activityBtn" class="nav-item">
      <span>♡</span>
      <small>Activity</small>
    </button>

    <button id="profileBtn" class="nav-item">
      <span>◉</span>
      <small>Profile</small>
    </button>

  </nav>

  <!-- PROFILE SCREEN -->
  <section id="profileScreen" class="app-screen">

    <header class="screen-header">
      <button id="backToFeed">←</button>
      <h2>Profile</h2>
      <span></span>
    </header>

    <div class="profile-content">

      <div class="profile-avatar">i</div>

      <h2 id="profileName">iFeed</h2>
      <p id="profileUsername">@ifeed</p>

      <div class="profile-stats">
        <div>
          <strong id="postCount">3</strong>
          <small>Posts</small>
        </div>

        <div>
          <strong>0</strong>
          <small>Followers</small>
        </div>

        <div>
          <strong>0</strong>
          <small>Following</small>
        </div>
      </div>

      <p id="profileBio">
        Welcome to my iFeed profile ✨
      </p>

      <button id="editProfileBtn">Edit Profile</button>
      <button id="editProfileMain">Edit Details</button>

      <h3>Your Videos</h3>
      <p>Your uploaded videos will appear in your profile.</p>

    </div>
  </section>

  <!-- EDIT PROFILE SCREEN -->
  <section id="editScreen" class="app-screen">

    <header class="screen-header">
      <button id="cancelEdit">←</button>
      <h2>Edit Profile</h2>
      <span></span>
    </header>

    <div class="edit-form">

      <label for="editName">Name</label>
      <input
        id="editName"
        type="text"
        placeholder="Your name"
      >

      <label for="editUsername">Username</label>
      <input
        id="editUsername"
        type="text"
        placeholder="Username"
      >

      <label for="editBio">Bio</label>
      <textarea
        id="editBio"
        placeholder="Write something about yourself">
      </textarea>

      <button id="saveProfileBtn">Save Changes</button>

    </div>
  </section>

  <!-- LOGIN SCREEN -->
  <section id="loginScreen" class="app-screen">

    <header class="screen-header">
      <button id="closeLogin">←</button>
      <h2>Login</h2>
      <span></span>
    </header>

    <div class="login-content">

      <h1>Welcome to iFeed</h1>
      <p>Sign in to your account</p>

      <label for="loginEmail">Email</label>
      <input
        id="loginEmail"
        type="email"
        placeholder="Enter your email"
      >

      <label for="loginPassword">Password</label>
      <input
        id="loginPassword"
        type="password"
        placeholder="Enter your password"
      >

      <button id="loginBtn">Continue</button>

      <p class="login-note">
        Demo login only. Real account authentication
        is not connected yet.
      </p>

    </div>
  </section>

  <!-- COMMENTS MODAL -->
  <div id="commentModal" class="modal">

    <div class="comment-box">

      <div class="comment-header">
        <h3>Comments</h3>
        <button id="closeComments">✕</button>
      </div>

      <div id="commentList">
        No comments yet. Be the first!
      </div>

      <form id="commentForm">
        <input
          id="commentInput"
          type="text"
          placeholder="Write a comment..."
          required
        >

        <button type="submit">Send</button>
      </form>

    </div>
  </div>

  <!-- JAVASCRIPT -->
  <script src="./script.js"></script>

  <!-- SERVICE WORKER -->
  <script>
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
          .then(() => console.log("iFeed offline support ready"))
          .catch(error => console.log("Service Worker error:", error));
      });
    }
  </script>

</body>
</html>
