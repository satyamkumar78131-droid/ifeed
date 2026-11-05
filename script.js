const feed = document.getElementById('feed');
const videoFiles = ['videos/video1.mp4', 'videos/video2.mp4']; // Apne file names yahan daalein

videoFiles.forEach(src => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `<video src="${src}" loop muted playsinline></video>`;
    feed.appendChild(card);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelector('video').play();
        } else {
            entry.target.querySelector('video').pause();
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.video-card').forEach(card => observer.observe(card));
