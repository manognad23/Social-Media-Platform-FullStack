

# Social Media Platform with AI Content Moderation

## 📌 Project Overview

This project is a **full-stack social media platform prototype** that enables users to share text posts, images, and comments while leveraging **AI-powered content moderation** to automatically detect and flag inappropriate content such as hate speech, spam, and sensitive material.

The system integrates modern web technologies with AI moderation tools to ensure a safer and more responsible user experience.

---

## 🛠️ Technologies Used

### Frontend

* **React.js** – User interface and client-side logic

### Backend

* **Node.js**
* **Express.js** – RESTful API development
* **MongoDB** – Database for users, posts, comments, and moderation logs

### AI & Media Services

* **OpenAI Moderation API** – Automated content analysis and moderation
* **Cloudinary** – Image upload and media storage

---

## 🚀 Features

### User Features

* User authentication and profile management
* Create, view, and delete text and image posts
* Comment on posts
* Image upload support via Cloudinary
* Real-time AI moderation for posts and comments

### AI Content Moderation

* Automatic detection of:

  * Hate speech
  * Spam
  * Sensitive or unsafe content
* Flagging of suspicious content for review
* Moderation logs stored for transparency and analysis

### Admin Dashboard

* View all flagged posts and comments
* Review AI moderation results
* Take action on reported or flagged content

---

## 🧠 AI Moderation Pipeline

1. User submits a post or comment
2. Content is sent to the **OpenAI Moderation API**
3. AI analyzes the content for policy violations
4. Results are stored in the database
5. Flagged content appears in the admin dashboard

---

## 📂 Project Structure (Simplified)

```
Social-Media-Platform-Full-Stack/
│
├── frontend/        # React.js frontend
│
├── backend/         # Node.js + Express backend
│   ├── models/      # MongoDB schemas
│   ├── routes/      # API routes
│   ├── controllers/# Business logic
│   ├── utils/       # AI moderation & helpers
│   └── index.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js
* MongoDB
* Cloudinary account
* OpenAI API key

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the backend directory with:

```
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

## 📦 Deliverables

* ✅ Functional social media feed
* ✅ AI-powered moderation logs
* ✅ Admin dashboard for flagged content
* ✅ Media upload support
* ✅ Deployed application (Vercel / Render)

---

## ⏱️ Project Duration

**4 Days**

---

## 🌟 Future Enhancements

* Real-time notifications for flagged content
* Improved AI feedback explanations
* Role-based admin permissions
* User reporting system
* Analytics dashboard for moderation trends

---

## 👤 Author

**Manogna**
Full-Stack Developer | AI Enthusiast

