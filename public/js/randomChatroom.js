
const joinButtons = document.querySelectorAll(".join-btn");
const overlay = document.getElementById("overlay");
const closeOverlay = document.getElementById("closeOverlay");

// Show overlay
document.querySelector(".btn-get_started").addEventListener("click", () => overlay.classList.add("active"));
closeOverlay.addEventListener("click", () => overlay.classList.remove("active"));

// Join room directly (no username input)
joinButtons.forEach((btn, index) => {
  btn.addEventListener("click", async () => {
    if (!btn.disabled) {
      // Call backend to set session room
      await fetch(`/room/${index+1}`); // hit the backend to store session
      window.location.href = `/room`;
    }
  });
});



 const learnMoreBtn = document.getElementById("learnMoreBtn");
  const learnMoreOverlay = document.getElementById("learnMoreOverlay");
  const learnMoreClose = document.getElementById("learnMoreClose");

  learnMoreBtn.addEventListener("click", () => {
    learnMoreOverlay.classList.add("active");
  });

  learnMoreClose.addEventListener("click", () => {
    learnMoreOverlay.classList.remove("active");
  });

  // Close if clicked outside content
  learnMoreOverlay.addEventListener("click", (e) => {
    if (e.target === learnMoreOverlay) {
      learnMoreOverlay.classList.remove("active");
    }
  });

  const socket = io();

  socket.on('roomStatus', (roomStatus) => {
    for (let i = 1; i <= 3; i++) {
      const statusEl = document.querySelector(`.room-card:nth-child(${i}) .status`);
      const btn = document.querySelector(`.room-card:nth-child(${i}) .join-btn`);

      if (!statusEl || !btn) continue;

      if (roomStatus[i] >= 10) {
        statusEl.textContent = 'Occupied';
        statusEl.classList.remove('Vacant');
        statusEl.classList.add('Occupied');
        btn.disabled = true;
      } else {
        statusEl.textContent = 'Vacant';
        statusEl.classList.remove('Occupied');
        statusEl.classList.add('Vacant');
        btn.disabled = false;
      }
    }
  });
