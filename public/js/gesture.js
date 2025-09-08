// ====== GESTURE / HOLD-C DELETE ======
let cHoldTimer = null;

// Function to handle the explosion + deletion
async function explodeAndDeleteMessages() {
  if (!activeChatId) {
    alert('No chat selected!');
    return;
  }

  const confirmDelete = confirm('Delete ALL messages in this chat?');
  if (!confirmDelete) return;

  const messagesContainer = document.getElementById('messages');
  const messages = Array.from(messagesContainer.querySelectorAll('.message'));

  // ===== EXPLOSION EFFECT =====
  messages.forEach((msg) => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = 200 + Math.random() * 200;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rotate = (Math.random() * 720 - 360).toFixed(0);

    msg.style.transition = 'transform 0.7s ease-out, opacity 0.7s ease-out';
    msg.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(0)`;
    msg.style.opacity = '0';
  });

  // ===== FLASH EFFECT =====
  const chatMain = document.querySelector('.chat-main');
  if (chatMain) {
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.inset = 0;
    flash.style.background = 'rgba(239, 68, 68, 0.2)';
    flash.style.zIndex = 10;
    chatMain.appendChild(flash);
    setTimeout(() => chatMain.removeChild(flash), 200);
  }

  // ===== DELETE FROM BACKEND =====
  try {
    const res = await fetch(`/chat/${activeChatId}/all-messages`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete messages');
  } catch (err) {
    console.error(err);
    alert('Error deleting messages.');
  }

  // ===== REMOVE FROM DOM AFTER ANIMATION =====
  setTimeout(() => {
    messagesContainer.innerHTML = '<p class="no-messages">No messages yet</p>';
  }, 800);
}

// ===== DESKTOP: Hold C for 2 seconds =====
document.addEventListener('keydown', (e) => {
  if ((e.key === 'c' || e.key === 'C') && !cHoldTimer) {
    cHoldTimer = setTimeout(explodeAndDeleteMessages, 2000);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    clearTimeout(cHoldTimer);
    cHoldTimer = null;
  }
});

// ===== MOBILE: Touch-friendly button =====
const deleteAllBtn = document.getElementById('deleteAllBtn'); // Add this button in HTML
if (deleteAllBtn) {
  deleteAllBtn.addEventListener('touchstart', explodeAndDeleteMessages);
  deleteAllBtn.addEventListener('click', explodeAndDeleteMessages); // for desktop clicks too
}
