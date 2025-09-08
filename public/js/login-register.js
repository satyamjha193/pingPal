const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signUpForm = document.getElementById('signUpForm');
const loader = document.getElementById('loader');

// 🔁 Toggle to register form
registerBtn.addEventListener('click', () => {
  container.classList.add("active");
  container.classList.remove("show-otp");
});

// 🔁 Toggle to login form
loginBtn.addEventListener('click', () => {
  container.classList.remove("active");
  container.classList.remove("show-otp");
});

// ✅ Check URL for form query param (e.g., ?form=signup)
const urlParams = new URLSearchParams(window.location.search);
const formType = urlParams.get('form');

if (formType === 'signup') {
  container.classList.add('active'); // show sign up form
} else {
  container.classList.remove('active'); // default to login
}

// 🔐 Sign-up form submit handler
signUpForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  loader.style.display = 'flex';

  const email = signUpForm.querySelector('input[placeholder="Email"]').value.trim();
  const username = signUpForm.querySelector('input[placeholder="Username"]').value.trim();
  const password = signUpForm.querySelector('input[placeholder="Password"]').value.trim();

  if (!email || !username || !password) {
    alert("Please fill in all fields.");
    loader.style.display = 'none';
    return;
  }

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });

    const data = await res.json();
    loader.style.display = 'none';

    if (res.ok) {
      console.log("✅ Registration successful, userId:", data.userId);
      localStorage.setItem('pendingUserId', data.userId); // For OTP submission
      container.classList.add("show-otp");
    } else {
      console.warn("❌ Registration failed:", data.message);
      alert(data.message || 'Registration failed.');
    }
  } catch (err) {
    console.error('Registration Error:', err);
    loader.style.display = 'none';
    alert("Server error. Please try again later.");
  }
});

// 🔢 Auto-focus next OTP input
document.querySelectorAll('.otp-box').forEach((box, index, boxes) => {
  box.addEventListener('input', () => {
    if (box.value.length === 1 && index < boxes.length - 1) {
      boxes[index + 1].focus();
    }
  });
});

// 🔐 OTP form handling
const otpForm = document.getElementById("otpForm");
const resendOtp = document.getElementById("resendOtp");

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 OTP form submitted!");

    const userId = localStorage.getItem("pendingUserId");
    const otp = Array.from(document.querySelectorAll(".otp-box"))
      .map((box) => box.value)
      .join("");

    console.log("🔎 UserId:", userId, "OTP entered:", otp);

    try {
      const res = await fetch("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp })
      });

      if (res.redirected) {
        console.log("✅ Redirecting to:", res.url);
        window.location.href = res.url;
        return;
      }

      const data = await res.json();
      if (res.ok) {
        console.log("✅ OTP verified:", data);
        // Example: redirect after verification
        //  window.location.href = "/chat";
      } else {
        console.warn("❌ OTP verification failed:", data.message);
        alert(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("❌ OTP verification error:", err);
    }
  });
}

if (resendOtp) {
  resendOtp.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("🔄 Resend OTP clicked!");

    const userId = localStorage.getItem("pendingUserId");
    if (!userId) {
      console.warn("⚠️ No pending user found to resend OTP");
      return;
    }

    try {
      const res = await fetch("/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ OTP resent successfully:", data);
        alert("A new OTP has been sent to your email.");
      } else {
        console.warn("❌ Failed to resend OTP:", data.message);
        alert(data.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("❌ Resend OTP error:", err);
    }
  });
}





const overlay = document.getElementById('socialOverlay');
const closeBtn = document.getElementById('overlayClose');

// Select all social icon containers
document.querySelectorAll('.social-trigger').forEach(container => {
    container.querySelectorAll('a').forEach(icon => {
        icon.addEventListener('click', e => {
            e.preventDefault();
            overlay.style.display = 'flex';
        });
    });
});

// Close overlay
closeBtn.addEventListener('click', () => overlay.style.display = 'none');
overlay.addEventListener('click', e => {
    if(e.target === overlay) overlay.style.display = 'none';
});
