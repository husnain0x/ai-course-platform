# API Documentation - E-Course AI Platform

This FastAPI backend serves as the core AI engine for the platform. It handles document parsing (PDF/DOCX), interacts with Groq's Large Language Models (LLMs), and manages robust error handling and JSON repair.

**Base URL:** `https://your-backend-url.onrender.com` (Update with your live Render URL)

---

## ⚙️ 1. Core Generation Endpoints

### POST `/api/generate-course`
Reads a PDF or DOCX file, extracts text (safely limited to ~40k characters to prevent memory overflow), and utilizes `llama-3.1-8b-instant` to generate a highly structured e-course in strictly validated JSON.
- **Headers:** `multipart/form-data`
- **Body:** `file` (Supports `.pdf`, `.docx`)
- **Response:** 
  ```json
  {
    "message": "Success",
    "data": {
      "course_title": "String",
      "description": "String",
      "estimated_time": "String",
      "difficulty_level": "String",
      "chapters": [
        { 
          "chapter_title": "String", 
          "lessons": [
            { "lesson_title": "String", "content": "Markdown String" }
          ] 
        }
      ]
    }
  }
  ```

### POST `/api/summarize`
Generates a fast executive summary without creating a full course structure.
- **Headers:** `multipart/form-data`
- **Body:** `file` (Supports `.pdf`, `.docx`)
- **Response:** `{"summary": "2-sentence overview + 5 key bullet points in Markdown"}`

---

## 🤖 2. Interactive Learning Endpoints

### POST `/api/chat`
A context-aware AI tutor endpoint. It receives the conversation history and the current lesson's content as context to answer user questions accurately.
- **Body:**
  ```json
  {
    "messages": [{"role": "user", "content": "Explain this concept further."}],
    "context": "The text content of the current lesson..."
  }
  ```
- **Response:** `{"reply": "Markdown formatted AI response"}`

### POST `/api/generate-quiz`
Dynamically generates a knowledge-check quiz containing Multiple Choice and True/False questions.
- **Body:** `{"context": "Lesson text"}`
- **Response:**
  ```json
  {
    "questions": [
      { 
        "question": "Text", 
        "options": ["A", "B", "C", "D"], 
        "correct_answer": "Text", 
        "explanation": "Logic behind the answer" 
      }
    ]
  }
  ```

### POST `/api/generate-flashcards`
Extracts key terms from a lesson and generates interactive flashcards.
- **Body:** `{"context": "Lesson text"}`
- **Response:** `{"flashcards": [{"front": "Keyword", "back": "Definition"}]}`

---

## ✨ 3. Bonus Tool Endpoints

### POST `/api/translate`
Translates lesson content while preserving Markdown formatting.
- **Body:** `{"text": "Markdown content...", "language": "Spanish"}`
- **Response:** `{"translated_text": "Contenido traducido..."}`

### POST `/api/diagram`
Generates an ASCII-art flow chart or mind map summarizing complex lesson topics.
- **Body:** `{"context": "Lesson text"}`
- **Response:** `{"diagram": "ASCII Art Block"}`
