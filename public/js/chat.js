// NEW (correct, uses injected value)
const socket = io({ query: { userId: window.currentUserId } });
// window.currentUserId = "<%= user._id %>";
// =======================
// DOM Elements
// =======================
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const openSearchBtn = document.getElementById("openSearch");
const closeSearchBtn = document.getElementById("closeSearch");
const searchOverlay = document.getElementById("searchOverlay");
const profileBtn = document.getElementById("profileBtn");
const profileSidebar = document.getElementById("profileSidebar");
const closeProfile = document.getElementById("closeProfile");
const searchInput = document.querySelector(".user-search");

let activeChatId = null; // Track current chat room




// =======================
// THEME TOGGLE
// =======================
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const body = document.body;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (savedTheme === "dark") {
        body.classList.add("dark");
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
    } else {
        body.classList.remove("dark");
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
    }
});

function toggleTheme() {
    const body = document.body;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        localStorage.setItem("theme", "light");
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        body.classList.add('dark');
        localStorage.setItem("theme", "dark");
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// =======================
// MOBILE SIDEBAR
// =======================
function showSidebar() {
    document.body.classList.remove('mobile-chat-view');
    const chatBox = document.querySelector(".chat-main");
    if (chatBox) chatBox.classList.add("active");
}



function setChatHeight() {
  const chatContainer = document.querySelector('.messages-area'); // ✅ correct
  const inputHeight = document.querySelector('.message-input-area').offsetHeight;
  if (chatContainer) {
    chatContainer.style.height = `${window.innerHeight - inputHeight}px`;
  }
}


window.addEventListener('resize', setChatHeight);
window.addEventListener('load', setChatHeight);


messageInput.addEventListener('focus', () => {
  setTimeout(() => {
    messageInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 300); // wait for keyboard animation
});







// =======================
// SEARCH OVERLAY
// =======================
if (openSearchBtn) openSearchBtn.addEventListener("click", openSearch);
if (closeSearchBtn) closeSearchBtn.addEventListener("click", closeSearch);

function openSearch() {
    searchOverlay.classList.add("active");
    history.pushState({ searchOpen: true }, "");
}

function closeSearch() {
    searchOverlay.classList.remove("active");
    if (history.state && history.state.searchOpen) history.back();
}

window.addEventListener("popstate", (event) => {
    if (event.state && event.state.searchOpen) searchOverlay.classList.remove("active");
});

// =======================
// CONNECT / REQUEST BUTTON
// =======================
document.querySelectorAll(".connect").forEach(btn => {
    btn.addEventListener("click", function () {
        if (!this.classList.contains("requested")) {
            this.textContent = "Requested";
            this.classList.add("requested");
            this.style.backgroundColor = "grey";
        } else {
            this.textContent = "Connect";
            this.classList.remove("requested");
            this.style.backgroundColor = "#4a154b";
        }
    });
});

// =======================
// SEARCH FILTER
// =======================
if (searchInput) {
    searchInput.addEventListener("input", function () {
        const term = this.value.toLowerCase();
        document.querySelectorAll(".user-card").forEach(card => {
            const name = card.querySelector(".user-name").textContent.toLowerCase();
            card.style.display = name.includes(term) ? "flex" : "none";
        });
    });
}



// APPEND MESSAGE
// =======================
function appendMessage(text, senderId, timestamp = new Date()) {
  const messagesArea = document.getElementById("messages");
  if (!messagesArea) return;

  const currentUserId = String(window.currentUserId); // ✅ actual user ID
  const type = (String(senderId) === currentUserId) ? "sent" : "received";

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${type}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  const timeDiv = document.createElement("div");
  timeDiv.className = "message-time";
  timeDiv.textContent = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  msgDiv.appendChild(bubble);
  msgDiv.appendChild(timeDiv);
  messagesArea.appendChild(msgDiv);

  msgDiv.scrollIntoView({ behavior: "smooth", block: "end" });
}




// search users 
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("userSearch");

    if (searchInput) {
      searchInput.addEventListener("keyup", () => {
        const filter = searchInput.value.toLowerCase().trim();

        // Target only recent chat users
        const chatItems = document.querySelectorAll(".recent-chats .chat-item");

        chatItems.forEach(item => {
          const nameElement = item.querySelector(".chat-name");
          const username = nameElement ? nameElement.textContent.toLowerCase() : "";

          if (username.includes(filter)) {
            item.style.display = "flex"; // show
          } else {
            item.style.display = "none"; // hide
          }
        });
      });
    }
  });





// =======================

// CHAT FORM HANDLING
if (messageInput && chatForm) {
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = messageInput.value.trim();
        if (msg !== "" && activeChatId) {
            socket.emit("chat message", { 
                chatId: activeChatId, 
                msg, 
                senderId: window.currentUserId   // pass logged-in user ID
            });
            messageInput.value = "";
        }
    });

    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            chatForm.dispatchEvent(new Event("submit"));
        }
    });

    messageInput.addEventListener('input', () => {
        if (activeChatId) socket.emit('typing', activeChatId);
    });
}

// SOCKET LISTENERS
socket.on("chat message", (data) => {
  if (data && data.msg && activeChatId === data.chatId) {
    appendMessage(
      data.msg,
      data.sender,       // ✅ pass real senderId
      data.createdAt
    );
  }
});







// Typing indicator
socket.on('typing', () => {
    typingIndicator.style.display = 'block';
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 1000);
});



// =======================
// PROFILE SIDEBAR
// =======================
// Open sidebar when clicking the whole profile container
profileToggle.addEventListener("click", () => {
  profileSidebar.classList.add("active");
});

// Close button
closeProfile.addEventListener("click", () => {
  profileSidebar.classList.remove("active");
});
// =======================
// SELECT CHAT
// =======================
document.addEventListener('DOMContentLoaded', () => {
  window.selectChat = async function (userId) {
      // console.log("Clicked chat:", userId);

      // Add class to body (or chat-container) for mobile view
      document.querySelector(".chat-container").classList.add("mobile-chat-view");

    try {
      const res = await fetch(`/chat/messages/${userId}`, { credentials: 'same-origin' });
      const data = await res.json();

      activeChatId = data.chat ? data.chat._id : null;

      // ✅ Save the other userId for block/unblock
      window.blockedUserId = userId;  

      // ✅ Save the other userId for viewing profile
      window.selectedChatUserId = userId;

      const messagesArea = document.getElementById("messages");
      if (!messagesArea) return;

      // Clear current messages
      messagesArea.innerHTML = "";

      // Get chatId and join the socket room
      activeChatId = data.chat ? data.chat._id : null;
      if (activeChatId) {
          socket.emit("joinRoom", activeChatId);
      }

      // Populate messages
      if (!data.chat || data.messages.length === 0) {
          messagesArea.innerHTML = `<p class="no-messages">No messages yet</p>`;
      } else {
          data.messages.forEach(msg => {
  appendMessage(
    msg.text,
    msg.sender,        // ✅ pass real senderId
    msg.createdAt
  );
});

      }

      // Update chat header
      const chatHeaderName = document.querySelector('.chat-header h2');
      const chatAvatar = document.querySelector('.chat-avatar');
      const onlineStatus = document.querySelector('.online-status');

      if (chatHeaderName) chatHeaderName.textContent = data.chat ? data.chat.username : "New Chat";
      if (chatAvatar) chatAvatar.textContent = data.chat ? data.chat.username.charAt(0).toUpperCase() : "N";
      if (onlineStatus && data.chat) {
        onlineStatus.textContent = data.chat.isOnline ? "● Online" : "● Offline";
        onlineStatus.classList.toggle("offline", !data.chat.isOnline);
      }


      // Enable input box and send button
      const chatIdInput = document.getElementById("chatIdInput");
      const sendBtn = document.getElementById("sendBtn");

      if (chatIdInput) chatIdInput.value = activeChatId || "";
      if (messageInput) messageInput.disabled = false;
      if (sendBtn) sendBtn.disabled = false;

      // Activate chat box
      const chatBox = document.getElementById("chatBox");
      if (chatBox) chatBox.classList.add("active");

      // Hide sidebar on mobile
      if (window.innerWidth <= 768) {
          const sidebar = document.getElementById("sidebar");
          if (sidebar) sidebar.style.display = "none";
          // Add state for mobile chat
          history.pushState({ chatOpen: true, userId: userId }, "");
      }
    } catch (err) {
        console.error("Error fetching messages:", err);
    }
  };
});





const moreBtn = document.getElementById("moreBtn");
const chatOptionsPanel = document.getElementById("chatOptionsPanel");
const closeOptions = document.getElementById("closeOptions");

// Open sidebox
moreBtn.addEventListener("click", () => {
  chatOptionsPanel.classList.add("active");
});

// Close sidebox
closeOptions.addEventListener("click", () => {
  chatOptionsPanel.classList.remove("active");
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (!chatOptionsPanel.contains(e.target) && !moreBtn.contains(e.target)) {
    chatOptionsPanel.classList.remove("active");
  }
});



window.addEventListener("popstate", (event) => {
    if (event.state && event.state.chatOpen) {
        // User navigated back from chat view
        const chatContainer = document.querySelector(".chat-container");
        if (chatContainer) chatContainer.classList.remove("mobile-chat-view");

        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.style.display = "block";

        const chatBox = document.getElementById("chatBox");
        if (chatBox) chatBox.classList.remove("active");

        const messageInput = document.getElementById("messageInput");
        const sendBtn = document.getElementById("sendBtn");
        if (messageInput) messageInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        const messagesArea = document.getElementById("messages");
        if (messagesArea) messagesArea.innerHTML = "";
    }
});
// Back button handler
function goBackToSidebar() {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) chatContainer.classList.remove("mobile-chat-view");

    // Show sidebar again
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.style.display = "block";

    // Optional: hide chat box on mobile
    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.classList.remove("active");

    // Disable input box and send button
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    if (messageInput) messageInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Clear messages area (optional)
    const messagesArea = document.getElementById("messages");
    if (messagesArea) messagesArea.innerHTML = "";
}

//Close chat programmatically
function closeChat() {
    if (history.state && history.state.chatOpen) history.back();
}






// =======================
// TAB SWITCHER
// =======================
function switchTab(tabId, event) {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
    document.getElementById(tabId).style.display = "block";
    event.target.classList.add("active");
}

// =======================
// OPEN CHAT
// =======================
function openChat(name, isOnline = true) {
    document.getElementById("chatName").textContent = name;
    const status = document.getElementById("chatStatus");
    status.innerHTML = `<div class="status-dot"></div> ${isOnline ? "Online" : "Last seen 5m ago"}`;
    status.classList.toggle("offline", !isOnline);

    document.getElementById("chatBox").classList.add("active");
    if (window.innerWidth <= 768) document.getElementById("sidebar").style.display = "none";
}





const editProfileBtn = document.getElementById("editProfileButton");
const editOverlay = document.getElementById("editProfileOverlay");
const closeEditBtn = document.getElementById("closeEditProfile");
const avatarUpload = document.getElementById("avatarUpload");
const avatarPreview = document.getElementById("editAvatarPreview");

// Open Edit Profile
editProfileBtn.addEventListener("click", () => {
  editOverlay.style.display = "flex";
});

// Close Edit Profile
closeEditBtn.addEventListener("click", () => {
  editOverlay.style.display = "none";
});

// Avatar Preview
avatarUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      avatarPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});


const logoutBtn = document.getElementById("logoutButton");
const logoutForm = logoutBtn.closest("form");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");

// Intercept logout button click
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault(); // stop immediate form submit
  logoutModal.style.display = "flex"; // show modal
});

// Cancel
cancelLogout.addEventListener("click", () => {
  logoutModal.style.display = "none";
});

// Confirm
confirmLogout.addEventListener("click", () => {
  logoutForm.submit(); // submit original form
});




const blockBtn = document.getElementById("blockUnblockBtn");
const blockModal = document.getElementById("blockModal");
const cancelBlock = document.getElementById("cancelBlock");
const confirmBlock = document.getElementById("confirmBlock");
const blockModalTitle = document.getElementById("blockModalTitle");
const blockModalText = document.getElementById("blockModalText");

// --------------------
// Set the blocked user ID (optional for logs)
// --------------------
function setBlockedUserId(userId) {
  window.blockedUserId = userId;
  console.log("Blocked user ID:", window.blockedUserId);
}

// --------------------
// Open modal
// --------------------
blockBtn.addEventListener("click", () => {
  if (!window.blockedUserId) {
    console.warn("No user selected!");
    blockModalTitle.textContent = "No user selected!";
    blockModalText.textContent = "Please select a user first.";
  } else {
    blockModalTitle.textContent = "Feature Not Implemented";
    blockModalText.textContent =
      "⚠️ Sorry! Block/Unblock feature is not implemented yet.\nBe safe while chatting with unknown users.";
  }
  blockModal.classList.add("active");
});

// --------------------
// Cancel
// --------------------
cancelBlock.addEventListener("click", () => {
  blockModal.classList.remove("active");
});

// --------------------
// Confirm
// --------------------
confirmBlock.addEventListener("click", () => {
  blockModal.classList.remove("active");
});




// Elements
const viewProfileOverlay = document.getElementById("viewProfileOverlay");
const closeViewProfile = document.getElementById("closeViewProfile");

const viewAvatar = document.getElementById("viewProfileAvatar");
const viewUsername = document.getElementById("viewProfileUsername");
const viewEmail = document.getElementById("viewProfileEmail");
const viewBio = document.getElementById("viewProfileBio");
const viewJoined = document.getElementById("viewProfileJoined");
const viewConnections = document.getElementById("viewProfileConnections");
const viewScore = document.getElementById("viewProfileScore");
const viewStatus = document.getElementById("viewProfileStatus");
// Close overlay
closeViewProfile.addEventListener("click", () => {
  viewProfileOverlay.style.display = "none";
});





// Open overlay with user data
function openUserProfile(user) {
  viewAvatar.src =
    user.avatar ||
    "https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1095249842.jpg";

  viewUsername.textContent = user.username;
  viewEmail.textContent = user.email;
  viewBio.textContent = user.bio || "PingPal User";
  viewJoined.textContent = user.joined || "-";

  // ✅ Random fallback values
  const randomConnections = Math.floor(Math.random() * 100000) + 1; // 1–100k
  const randomScore = Math.floor(Math.random() * 1000000) + 1; // 1–10 lakh (1,000,000)

  viewConnections.textContent =
    user.connections != null ? user.connections : randomConnections;

  viewScore.textContent =
    user.score != null ? user.score : randomScore;

  if (user.isOnline) {
    viewStatus.textContent = "Online";
    viewStatus.className = "status online";
  } else {
    viewStatus.textContent = "Offline";
    viewStatus.className = "status offline";
  }

  viewProfileOverlay.style.display = "flex";
}


// Attach click event to all user avatars / placeholders
document.querySelectorAll(".open-user-profile").forEach(el => {
  el.addEventListener("click", (e) => {
    const userData = JSON.parse(el.dataset.user);
    openUserProfile(userData);
  });
});




// Attach click to "View Profile" button in chat options
document.querySelectorAll(".chat-options-panel .option-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    if (btn.textContent.includes("View Profile")) {
      // Get the currently selected chat user ID (from your chat selection logic)
      const userId = window.selectedChatUserId; // set this whenever user selects chat

      if (!userId) return console.error("No user selected to view profile");

      try {
        const res = await fetch(`/auth/get-user/${userId}`);
        const data = await res.json();

        if (data.success) {
          openUserProfile(data.user);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (err) {
        console.error(err);
      }
    }
  });
});











// ==========================
// Live Score & Leaderboard
// ==========================

// DOM elements
const userScoreEl = document.getElementById('userScore');
const highScoreEl = document.getElementById('highScore');
const highScoreUserEl = document.getElementById('highScoreUser');
const highScoreBadge = document.getElementById('highScoreBadge');
const leaderboardEl = document.getElementById('leaderboard');

let userScore = 0;

// Function to increment score and update UI
async function incrementScore() {
  try {
    const res = await fetch('/increment-score', {
      method: 'POST',
      credentials: 'include', // 👈 send session cookies
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.success) {
      userScore = data.yourScore;
      if (userScoreEl) userScoreEl.textContent = userScore;

      if (highScoreEl) highScoreEl.textContent = data.highScore;
      if (highScoreUserEl) highScoreUserEl.textContent = data.highScoreUser;

      if (highScoreBadge)
        highScoreBadge.style.display = data.isHighScore ? 'block' : 'none';
    }
  } catch (err) {
    console.error('Score increment failed:', err);
  }
}

// ==========================
// Leaderboard Update
// ==========================
async function updateLeaderboard() {
  if (!leaderboardEl) return; // prevent errors if element missing

  try {
    const res = await fetch('/leaderboard', {
      method: 'GET',
      credentials: 'include', // 👈 send session cookies
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.success) {
      leaderboardEl.innerHTML = '';
      data.leaderboard.forEach((user, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${user.username}  ~ ${user.score}`;
        leaderboardEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
  }
}

// ==========================
// Initialize Score System
// ==========================
async function initScoreSystem() {
  // Increment immediately on page load
  await incrementScore();
  await updateLeaderboard();

  // Increment score every minute (+5)
  setInterval(async () => {
    await incrementScore();
    await updateLeaderboard();
  }, 60000); // 60,000ms = 1 minute
}

// Start the system
initScoreSystem();





// for search pingpal users overlay

let lastScrollTop = 0;
const header = document.querySelector('.search-header');

document.querySelector('.search-overlay').addEventListener('scroll', function() {
  const scrollTop = this.scrollTop;

  if (scrollTop > lastScrollTop && scrollTop > 50) {
    // scrolling down → hide header
    header.classList.add('hide');
  } else {
    // scrolling up → show header
    header.classList.remove('hide');
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // avoid negative scroll
});
