
document.addEventListener("DOMContentLoaded", () => {

    const feed = document.getElementById("feed");
    const videos = document.querySelectorAll(".reel-video");
    const videoInput = document.getElementById("videoInput");

    // Automatic play and pause
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting) {
                videos.forEach(other => {
                    if (other !== video) {
                        other.pause();
                    }
                });

                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, {
        root: feed,
        threshold: 0.65
    });

    videos.forEach(video => observer.observe(video));

    // Like button
    document.querySelectorAll(".likeBtn").forEach(button => {
        button.addEventListener("click", () => {
            const count = button.querySelector("span");
            let likes = Number(count.textContent);

            if (button.classList.contains("liked")) {
                likes--;
                button.classList.remove("liked");
                button.firstChild.textContent = "♡ ";
            } else {
                likes++;
                button.classList.add("liked");
                button.firstChild.textContent = "♥ ";
            }

            count.textContent = likes;
        });
    });

    // Comment button
    document.querySelectorAll(".commentBtn").forEach(button => {
        button.addEventListener("click", () => {
            const comment = prompt("Write your comment:");

            if (comment && comment.trim()) {
                alert("Comment added locally: " + comment);
            }
        });
    });

    // Share button
    document.querySelectorAll(".shareBtn").forEach(button => {
        button.addEventListener("click", async () => {
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: "iFeed",
                        text: "Watch videos on iFeed!",
                        url: window.location.href
                    });
                } else {
                    alert("Share is not supported on this browser.");
                }
            } catch (error) {
                console.log("Share cancelled");
            }
        });
    });

    // Upload video preview
    function openUpload() {
        videoInput.click();
    }

    document.getElementById("uploadBtn")
        .addEventListener("click", openUpload);

    document.getElementById("navUpload")
        .addEventListener("click", openUpload);

    videoInput.addEventListener("change", () => {
        const file = videoInput.files[0];

        if (!file || !file.type.startsWith("video/")) return;

        const url = URL.createObjectURL(file);
        const reel = document.createElement("section");

        reel.className = "reel";

        reel.innerHTML = `
            <video class="reel-video" muted loop playsinline></video>
            <div class="reel-info">
                <h3>@you</h3>
                <p>My new video on iFeed!</p>
            </div>
            <div class="actions">
                <button class="likeBtn">♡ <span>0</span></button>
                <button class="commentBtn">💬</button>
                <button class="shareBtn">↗</button>
            </div>
        `;

        const newVideo = reel.querySelector("video");
        newVideo.src = url;

        feed.appendChild(reel);

        newVideo.addEventListener("loadeddata", () => {
            feed.scrollTo({
                top: reel.offsetTop,
                behavior: "smooth"
            });
            newVideo.play().catch(() => {});
        }, { once: true });

        observer.observe(newVideo);

        // Add functionality to new buttons
        reel.querySelector(".likeBtn").onclick = function() {
            const count = this.querySelector("span");
            const liked = this.classList.toggle("liked");
            count.textContent = Number(count.textContent) + (liked ? 1 : -1);
            this.firstChild.textContent = liked ? "♥ " : "♡ ";
        };

        reel.querySelector(".commentBtn").onclick = () => {
            const comment = prompt("Write your comment:");
            if (comment) alert("Comment added locally: " + comment);
        };

        reel.querySelector(".shareBtn").onclick = async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: "iFeed",
                        url: window.location.href
                    });
                } catch (error) {}
            }
        };
    });

    console.log("iFeed V2 ready!");
});
