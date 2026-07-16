# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import fitz  # PyMuPDF for reading PDFs
import json
import re
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI E-Course Platform API")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ai-course-platform-jsxhej1g2-70177810-1749s-projects.vercel.app", "https://ai-course-platform-70177810-1749s-projects.vercel.app", "https://ai-course-platform-olive.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI Backend is running perfectly!"}

@app.post("/api/generate-course")
async def generate_course(file: UploadFile = File(...)):
    # 1. Validate extension (PDF or DOCX only)
    extension = file.filename.split('.')[-1].lower()
    if extension not in ["pdf", "docx"]:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    try:
        extracted_text = ""
        file_bytes = await file.read()

        if extension == "pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
                # 🛑 SAFETY RAIL 1: Limit to ~15k characters for speed
                if len(extracted_text) > 15000:
                    break
        elif extension == "docx":
            import io
            from docx import Document
            document = Document(io.BytesIO(file_bytes))
            for para in document.paragraphs:
                extracted_text += para.text + "\n"
                if len(extracted_text) > 15000:
                    break

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="File is empty or unreadable.")

        # 🛑 SAFETY RAIL 2: Rigid prompt to stay within timeout
        prompt = f"""
        ACT AS A DATA GENERATOR. CONVERT TEXT TO JSON.
        RULES:
        - NO INTRO. NO OUTRO. ONLY JSON.
        - GENERATE BETWEEN 3 TO 4 CHAPTERS.
        - MAX 3 LESSONS PER CHAPTER.
        - LESSON CONTENT: MUST BE HIGHLY DETAILED AND COMPREHENSIVE (AT LEAST 7-8 LINES). YOU MUST USE STRICT MARKDOWN. FORMAT EVERY LIST WITH DASHES (-) SO IT RENDERS AS A BULLET POINT. BOLD KEY TERMS WITH **ASTERISKS**.
        
        STRUCTURE:
        {{
          "course_title": "...",
          "description": "...",
          "estimated_time": "...",
          "difficulty_level": "...",
          "chapters": [
            {{ "chapter_title": "...", "lessons": [ {{ "lesson_title": "...", "content": "..." }} ] }}
          ]
        }}
        TEXT: {extracted_text[:25000]}
        """

        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content

        # 🧠 REPAIR ENGINE: Regex to extract JSON block
        try:
            json_match = re.search(r"\{.*\}", raw_content, re.DOTALL)
            if json_match:
                cleaned_json = json_match.group(0)
                course_data = json.loads(cleaned_json)
            else:
                raise ValueError("No JSON found in response")
        except Exception as e:
            print(f"JSON Error: {raw_content}")
            raise HTTPException(status_code=500, detail="AI returned bad formatting. Try again.")

        return {"message": "Success", "data": course_data}
    except Exception as e:
        # Forward actual error to frontend for debugging
        error_msg = str(e)
        print(f"General Error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


class ChatRequest(BaseModel):
    messages: list
    context: str = ""

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        system_prompt = f"""
        You are a friendly, helpful AI study assistant.
        The student is currently viewing a lesson. Use the following lesson content as context to answer their question.
        If the question is unrelated to the lesson or course, answer it politely but try to bring their focus back to the topic.
        
        Current Lesson Content:
        {request.context}
        """
        
        messages = [{"role": "system", "content": system_prompt}] + request.messages
        
        response = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.7,
        )
        
        ai_response = response.choices[0].message.content
        return {"reply": ai_response}
    except Exception as e:
        print(f"Chat API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating AI chat response: {str(e)}")

class QuizRequest(BaseModel):
    context: str

@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    try:
        prompt = f"""
        You are an expert educator. Generate a 3-question quiz based on the following text. 
        Include a mix of Multiple Choice and True/False questions.
        You MUST return ONLY a valid JSON object. Do not include markdown formatting like ```json.
        
        Use this EXACT JSON structure:
        {{
          "questions": [
            {{
              "question": "The question text",
              "type": "multiple_choice",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correct_answer": "The exact text of the correct option",
              "explanation": "Short explanation of why this is correct"
            }}
          ]
        }}
        
        Text to process:
        {request.context}
        """

        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )

        quiz_data = json.loads(response.choices[0].message.content)
        return quiz_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

class FlashcardRequest(BaseModel):
    context: str

@app.post("/api/generate-flashcards")
async def generate_flashcards(request: FlashcardRequest):
    try:
        prompt = f"""
        You are an expert educator. Create 5 highly effective flashcards based on the following text.
        Extract key terms, concepts, or dates for the 'front', and provide a clear, concise definition or explanation for the 'back'.
        You MUST return ONLY a valid JSON object. Do not include markdown formatting like ```json.
        
        Use this EXACT JSON structure:
        {{
          "flashcards": [
            {{
              "front": "Key term or question",
              "back": "Clear definition or answer"
            }}
          ]
        }}
        
        Text to process:
        {request.context}
        """

        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Fast model for flashcards
            temperature=0.3,
        )
        
        cleaned_response = response.choices[0].message.content.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:-3]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:-3]

        flashcard_data = json.loads(cleaned_response)
        return flashcard_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation error: {str(e)}")
