from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import sys

# Add the parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import test  # Import test router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Secura API",
    description="AI-Powered Cyber Incident Reporting Platform",
    version="1.0.0"
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test.router)

@app.get("/")
async def root():
    return {"message": "Secura API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Secura Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)