

# PingPal 💬  
_A fun and simple chat platform for random conversations and private messaging._

---

## 📌 Overview
PingPal is a real-time chat application that connects people through **random chat rooms** and **private messaging**.  
It’s designed to help users **meet new people**, **share ideas**, and even **make friends**.  

### 🔹 Features
- 🎲 **Random Chat Rooms**
  - Up to **10 users per room**
  - Auto-suggested topics to spark conversations
  - Dynamic avatars (random boy/girl assignment)
  - Display picture (DP), username, and live messaging
  - Message pop-ups & chat hold support
  - Earn points while using app! See your rank among top PingPal users in real-time, and get badges for high scores.

- 🔒 **Private Messaging**
  - Secure one-to-one chat
  - Connect directly with friends made in rooms
  - Easy switching between random and private chats

- 👤 **User Experience**
  - Auto-generated or custom username
  - Random avatar (boy/girl theme)
  - Lightweight, simple UI
  - Seamless transition between chats

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla + minimal enhancements)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (for users, sessions, and messages)
- **Realtime Communication:** Socket.IO
- **Authentication:** OTP-based signup and login
- **Other:** Git, npm

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/satyamjha193/pingPal
cd pingpal-chat



2. Install Dependencies
npm install



3. Setup Environment Variables

Create a .env file in the root directory:

PORT=3000
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_password


4. Run Server
npm start


Visit: http://localhost:${PORT};

📂 Project Structure

pingpal-chat/
│── public/            # Static files (CSS, JS, images)
│── views/             # EJS templates
│── models/            # MongoDB schemas
│── routes/            # Express routes
│── utils/             # Helpers (OTP, mailer, etc.)
│── app.js             # Entry point
│── package.json
│── README.md




🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your idea.

📜 License

This project is licensed under the MIT License.

✨ Future Improvements

🧩 Add profile customization (bio, interests)

📱 Mobile-friendly design

🛡️ Enhanced moderation tools

🌍 Global language filter/translation





💡 Inspiration

PingPal was built to make meeting strangers fun again — like bumping into someone at a coffee shop, but online. 🌐☕



---

Do you also want me to draft a **project report (Word/PDF)** matching this README, so you can edit and attach it for submission?
