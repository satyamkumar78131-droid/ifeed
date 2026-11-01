
// iFeed JavaScript

document.addEventListener("DOMContentLoaded", () => {

    const videoInput = document.getElementById("videoInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const navUpload = document.getElementById("navUpload");
    const video = document.querySelector(".reel video");

    // Upload video
    function openUpload() {
        videoInput.click();
    }

    uploadBtn.addEventListener("click", openUpload);
    navUpload.addEventListener("click", openUpload);

    // Preview selected video
    videoInput.addEventListener("change", () => {
        const file = videoInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("video/")) {
            alert("Please select a video!");
            return;
        }

        const videoURL = URL.createObjectURL(file);
        video.src = videoURL;
        video.load();
        video.play().catch(() => {});
    });

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
                        text: "Watch videos on iFeed!"
                    });
                } else {
                    await navigator.clipboard.writeText(
                        window.location.href
                    );
                    alert("Link copied!");
                }
            } catch (error) {
                console.log("Share cancelled");
            }
        });
    });

    // Search button
    document.getElementById("searchBtn").addEventListener("click", () => {
        const query = prompt("What do you want to search?");
        if (query) alert("Search feature coming soon: " + query);
    });

    // Explore button
    document.getElementById("exploreBtn").addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    console.log("iFeed is ready!");
});
