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
    if not (file.filename.lower().endswith('.pdf') or file.filename.lower().endswith('.docx') or file.filename.lower().endswith('.doc')):
        raise HTTPException(status_code=400, detail='Only PDF, DOCX, or DOC files are allowed.')
    
    try:
        file_bytes = await file.read()
        # Determine file type and extract text
        if file.filename.lower().endswith('.pdf'):
            doc = fitz.open(stream=file_bytes, filetype='pdf')
            extracted_text = ''
            for page in doc:
                extracted_text += page.get_text()
                if len(extracted_text) > 80000:
                    break
        elif file.filename.lower().endswith('.docx'):
            import io
            from docx import Document
            document = Document(io.BytesIO(file_bytes))
            extracted_text = '\n'.join([para.text for para in document.paragraphs])
            if len(extracted_text) > 80000:
                extracted_text = extracted_text[:80000]
        elif file.filename.lower().endswith('.doc'):
            # Use pypandoc to convert .doc to plain text via a temporary file
            try:
                import tempfile, os
                import pypandoc
                # Write the uploaded bytes to a temp .doc file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.doc') as tmp_file:
                    tmp_file.write(file_bytes)
                    tmp_path = tmp_file.name
                # Convert the file to plain text
                extracted_text = pypandoc.convert_file(tmp_path, 'plain')
                # Clean up the temporary file
                os.unlink(tmp_path)
                # Truncate if too long
                if len(extracted_text) > 80000:
                    extracted_text = extracted_text[:80000]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f'Doc conversion failed: {e}')
        else:
            raise HTTPException(status_code=400, detail='Unsupported file type.')        
        # 2. SPEED PROMPT: We use Llama 3.1 8B which is nearly instant
        prompt = f"""
        Create a detailed E-Course from this text. 
        Return ONLY valid JSON.
        Structure:
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
                  "content": "A 200-word detailed explanation in Markdown."
                }}
              ]
            }}
          ]
        }}
        
        Limit to 4 chapters, 3 lessons each for maximum speed.
        Text: {extracted_text}
        """
        
        # 3. Use the "Instant" model for speed
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # <--- Switching to the High Speed model
            temperature=0.2,
        )
        
        ai_response = response.choices[0].message.content
        
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:-3]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:-3]
            
        course_data = json.loads(cleaned_response)
        
        return {"message": "Success", "data": course_data}
    
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Generation failed.")


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
