# E-Course AI - Full Stack Platform (HA the Legacy) 🚀

A production-grade, AI-powered learning platform that transforms static PDFs and DOCX files into interactive, structured e-courses. Built as part of the Full Stack AI Internship assessment.

## 🔗 Live Demo Links
- **Frontend (Vercel):** [https://your-frontend-url.vercel.app](https://your-frontend-url.vercel.app)
- **Backend (Render):** [https://your-backend-url.onrender.com](https://your-backend-url.onrender.com)
- **GitHub Repository:** [Insert your GitHub URL here]

---

## 🏆 Core Features (100% Completed)
1. **User Authentication:** Email/password login via Supabase with secure session handling.
2. **PDF/DOCX Upload:** Robust document parsing handling large files effortlessly.
3. **AI Course Generation:** Dynamic JSON creation using Groq's fast LLMs.
4. **Learning Progress:** Persistent tracking, visual progress bars, and DB synchronization.
5. **Contextual AI Tutor:** A floating, responsive chatbot that reads the current lesson with you.
6. **Quiz Generation:** AI-generated interactive MCQs with dynamic grading.
7. **Course Dashboard:** A searchable, visually stunning library of generated courses.
8. **Learning History:** Persistent chat logs and progress states via PostgreSQL.
9. **Responsive UI:** Touch-optimized mobile layout with a sliding sidebar.

## 🌟 Bonus Features Implemented
To elevate the application to enterprise standards, the following highly-requested features were added:
- **Audio Narration (TTS):** Web Speech API integration for "Read Aloud" functionality.
- **Interactive Flashcards:** AI-generated flippable study cards.
- **Course Certificates:** Downloadable certificates unlocked upon 100% completion.
- **Multi-Language Support:** Instant 1-click translation (Spanish, French, Urdu, Arabic, etc.).
- **PDF Summarization:** Quick executive summaries generated directly from the upload dashboard.
- **Markdown Export:** Download any lesson locally as a `.md` file.
- **AI Mind Maps:** Dynamic ASCII-art diagrams generated to explain complex topics.
- **Premium UI/UX:** Built with Tailwind, Glassmorphism, Dark/Light mode toggles, and Framer Motion sliding animations.
- **Advanced Security:** 1-hour strict session expiry with browser local-storage logic.
- **Smart Duplicate Checks:** Prevents users from wasting AI tokens on duplicate uploads.

---

## 🏗️ Architecture & Tech Stack
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Shadcn principles.
- **Backend:** FastAPI (Python), PyMuPDF (fitz), python-docx.
- **Database:** Supabase (PostgreSQL) enforcing Row Level Security (RLS) policies.
- **AI Integration:** Groq Cloud API (`llama-3.1-8b-instant`).
- **Deployments:** Vercel (Edge network), Render (Web Service).

---

## 🛠️ Local Setup Instructions

### 1. Database Setup (Supabase)
1. Create a free project at [Supabase](https://supabase.com).
2. Execute the provided SQL script in your Supabase SQL Editor to generate the following tables:
   - `profiles`, `courses`, `chapters`, `lessons`, `progress`, `chat_history`.
3. Ensure **Row Level Security (RLS)** is enabled for data privacy.

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
# SUPABASE_URL=your_url
# SUPABASE_KEY=your_key
# GROQ_API_KEY=your_groq_key

# Run server
uvicorn main:app --reload
```

### 3. Frontend Setup (Next.js)
```bash
cd frontend
npm install

# Create .env.local file with:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Run frontend
npm run dev
```

---

## 🛡️ Fault Tolerance & Error Handling
- **JSON Repair Engine:** The backend utilizes Regex and auto-repair logic to recover gracefully if the AI generates malformed JSON.
- **Token Budgeting:** Text extraction is forcefully sliced at 40,000 characters to prevent memory crashes on massive textbooks.
- **Optimistic UI:** Database writes happen in the background while UI states update instantly for a seamless user experience.

*Designed and engineered by Husnain Ajmal.*
