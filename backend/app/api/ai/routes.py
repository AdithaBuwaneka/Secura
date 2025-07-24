"""
AI Engine API Routes - Rithara's Module
Handles incident categorization, severity assessment, and mitigation strategies
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel

from app.models.common import IncidentType, IncidentSeverity
from app.services.ai.ai_service import AIService
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["AI Engine"])

class IncidentAnalysisRequest(BaseModel):
    title: str
    description: str
    context: Dict[str, Any] = {}

class CategorySuggestion(BaseModel):
    category: IncidentType
    confidence: float
    reasoning: str

class SeverityAssessment(BaseModel):
    severity: IncidentSeverity
    confidence: float
    factors: List[str]

class MitigationStrategy(BaseModel):
    strategy: str
    priority: int
    estimated_time: str
    resources_required: List[str]

class AIAnalysisResponse(BaseModel):
    categories: List[CategorySuggestion]
    severity: SeverityAssessment
    mitigation_strategies: List[MitigationStrategy]
    confidence_score: float

@router.post("/analyze-incident", response_model=AIAnalysisResponse)
async def analyze_incident(
    request: IncidentAnalysisRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Analyze incident using AI for categorization, severity, and mitigation suggestions
    Available to Security Team and Admin users
    """
    # Check user permissions
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI analysis requires security team or admin access"
        )
    
    try:
        # Perform AI analysis
        analysis_result = await ai_service.analyze_incident(
            title=request.title,
            description=request.description,
            context=request.context,
            user_department=current_user.department
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

@router.post("/categorize")
async def categorize_incident(
    title: str,
    description: str,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Get category suggestions for an incident
    """
    try:
        categories = await ai_service.categorize_incident(title, description)
        return {"categories": categories}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Categorization failed: {str(e)}"
        )

@router.post("/assess-severity")
async def assess_severity(
    title: str,
    description: str,
    category: IncidentType,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Assess incident severity level
    """
    try:
        severity = await ai_service.assess_severity(title, description, category)
        return {"severity": severity}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Severity assessment failed: {str(e)}"
        )

@router.post("/mitigation-strategies")
async def get_mitigation_strategies(
    category: IncidentType,
    severity: IncidentSeverity,
    context: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Get AI-generated mitigation strategies
    """
    try:
        strategies = await ai_service.generate_mitigation_strategies(
            category, severity, context
        )
        return {"strategies": strategies}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mitigation strategy generation failed: {str(e)}"
        )

@router.get("/threat-intelligence")
async def get_threat_intelligence(
    category: IncidentType = None,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Get threat intelligence and pattern analysis
    Admin and Security Team only
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Threat intelligence requires security team or admin access"
        )
    
    try:
        intelligence = await ai_service.get_threat_intelligence(category, days)
        return intelligence
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Threat intelligence retrieval failed: {str(e)}"
        )

@router.get("/predictive-analytics")
async def get_predictive_analytics(
    organization_id: str = None,
    timeframe_days: int = 90,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Get predictive analytics for security threats
    Admin only
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Predictive analytics requires admin access"
        )
    
    try:
        analytics = await ai_service.get_predictive_analytics(
            organization_id, timeframe_days
        )
        return analytics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Predictive analytics failed: {str(e)}"
        )

@router.post("/anomaly-detection")
async def detect_anomalies(
    incident_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """
    Detect anomalies in incident patterns
    Security Team and Admin only
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anomaly detection requires security team or admin access"
        )
    
    try:
        anomalies = await ai_service.detect_anomalies(incident_data)
        return {"anomalies": anomalies}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly detection failed: {str(e)}"
        )