# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import fitz  # PyMuPDF for reading PDFs
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI E-Course Platform API")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI Backend is running perfectly!"}

@app.post("/api/generate-course")
async def generate_course(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        # 1. Read the PDF File
        file_bytes = await file.read()
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        # 2. Extract massive context (Up to ~150,000 characters / 50 pages)
        extracted_text = ""
        for page in doc:
            extracted_text += page.get_text()
            if len(extracted_text) > 150000: 
                break
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")

        # 3. The "Master Professor" Prompt
        prompt = f"""
        You are a world-class university professor. Your task is to extract all the core knowledge from the provided text and turn it into a HIGHLY DETAILED, COMPREHENSIVE e-course.
        Do not skip important concepts. The course must be thorough, highly educational, and well-structured.
        
        CRITICAL INSTRUCTIONS:
        - Create between 4 to 8 Chapters based on the text.
        - Create 3 to 5 Lessons per chapter.
        - The 'content' of each lesson MUST be detailed and comprehensive. 
        - Use rich Markdown in the content: Use headings (###), bullet points, bold text for key terms, and create real-world examples to explain complex topics.
        - You MUST return ONLY a valid JSON object. No markdown blocks like ```json.
        
        Use this EXACT JSON structure:
        {{
          "course_title": "...",
          "description": "...",
          "estimated_time": "...",
          "difficulty_level": "...",
          "chapters": [
            {{
              "chapter_title": "...",
              "lessons": [
                {{
                  "lesson_title": "...",
                  "content": "Detailed, rich markdown content goes here..."
                }}
              ]
            }}
          ]
        }}
        
        Source Text:
        {extracted_text}
        """

        # 4. Call Groq AI (Using their Flagship 70B Model!)
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile", # Groq's most intelligent model
            temperature=0.4, # slightly higher for more creative/rich explanations
        )

        ai_response = response.choices[0].message.content
        
        # 5. Safely clean and parse the JSON
        try:
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:-3]
            elif cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:-3]
                
            course_data = json.loads(cleaned_response)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="The AI generated too much detail and got cut off. Please try a slightly smaller PDF.")
        
        return {
            "message": "Course generated successfully!",
            "data": course_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course: {str(e)}")

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
