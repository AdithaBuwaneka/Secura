"""
Analytics & Infrastructure API Routes - Pramudi's Module
Handles data visualization, executive dashboards, and enterprise integration
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.models.user import User
from app.services.analytics.analytics_service import AnalyticsService
from app.services.notifications.notification_service import NotificationService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Infrastructure"])

class DashboardMetrics(BaseModel):
    total_incidents: int
    open_incidents: int
    resolved_incidents: int
    avg_resolution_time: float
    severity_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]
    trends: Dict[str, Any]

class ExecutiveReport(BaseModel):
    report_id: str
    generated_at: datetime
    period: str
    kpi_metrics: Dict[str, Any]
    compliance_status: Dict[str, Any]
    recommendations: List[str]

@router.get("/dashboard/basic", response_model=DashboardMetrics)
async def get_basic_dashboard(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get basic analytics dashboard data
    Available to Security Team and Admin
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analytics access requires security team or admin privileges"
        )
    
    try:
        metrics = await analytics_service.get_basic_metrics(days)
        return metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard metrics: {str(e)}"
        )

@router.get("/dashboard/executive")
async def get_executive_dashboard(
    days: int = 90,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get comprehensive executive dashboard with KPIs
    Admin only
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Executive dashboard requires admin access"
        )
    
    try:
        dashboard_data = await analytics_service.get_executive_dashboard(days)
        return dashboard_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve executive dashboard: {str(e)}"
        )

@router.get("/visualization/trends")
async def get_trend_data(
    metric: str,  # "incidents", "resolution_time", "severity_distribution"
    period: str = "month",  # "week", "month", "quarter"
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get trend data for Chart.js visualization
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trend analytics requires security team or admin access"
        )
    
    try:
        trend_data = await analytics_service.get_trend_analysis(metric, period)
        return {
            "metric": metric,
            "period": period,
            "data": trend_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve trend data: {str(e)}"
        )

@router.get("/visualization/drill-down")
async def get_drill_down_data(
    category: str,
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get detailed drill-down data for specific categories
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Drill-down analytics requires security team or admin access"
        )
    
    try:
        drill_data = await analytics_service.get_drill_down_analysis(
            category, start_date, end_date
        )
        return drill_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve drill-down data: {str(e)}"
        )

@router.post("/reports/generate")
async def generate_compliance_report(
    report_type: str,  # "gdpr", "hipaa", "sox", "custom"
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(),
    period_days: int = 30
):
    """
    Generate compliance reports (GDPR, HIPAA, SOX)
    Admin only
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Report generation requires admin access"
        )
    
    try:
        # Generate report in background
        background_tasks.add_task(
            analytics_service.generate_compliance_report,
            report_type,
            period_days,
            current_user.uid,
            current_user.email
        )
        
        return {
            "message": "Report generation started",
            "report_type": report_type,
            "period_days": period_days,
            "notification": "You will receive an email when the report is ready"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start report generation: {str(e)}"
        )

@router.get("/reports/export")
async def export_incident_data(
    format: str = "csv",  # "csv", "pdf", "excel"
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Export incident data in various formats
    Security Team and Admin only
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data export requires security team or admin access"
        )
    
    try:
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        export_data = await analytics_service.export_incident_data(
            format, start_date, end_date
        )
        
        return {
            "export_url": export_data.get("url"),
            "format": format,
            "record_count": export_data.get("count"),
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data export failed: {str(e)}"
        )

@router.post("/notifications/email")
async def send_email_notification(
    recipient_email: str,
    subject: str,
    template: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends()
):
    """
    Send email notification via SendGrid
    Security Team and Admin only
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email notifications require security team or admin access"
        )
    
    try:
        result = await notification_service.send_email(
            recipient_email, subject, template, data
        )
        
        return {
            "message": "Email sent successfully",
            "message_id": result.get("message_id")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email notification failed: {str(e)}"
        )

@router.post("/notifications/push")
async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: Dict[str, Any] = {},
    notification_service: NotificationService = Depends()
):
    """
    Send push notification via Firebase Cloud Messaging
    """
    try:
        result = await notification_service.send_push_notification(
            user_id, title, body, data
        )
        
        return {
            "message": "Push notification sent successfully",
            "message_id": result.get("message_id")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Push notification failed: {str(e)}"
        )

@router.get("/integration/siem")
async def get_siem_integration_status(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get SIEM integration status and configuration
    Admin only
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SIEM integration requires admin access"
        )
    
    try:
        status = await analytics_service.get_siem_integration_status()
        return status
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve SIEM status: {str(e)}"
        )

@router.post("/monitoring/system-health")
async def get_system_health(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """
    Get comprehensive system health monitoring
    Admin only
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System monitoring requires admin access"
        )
    
    try:
        health_data = await analytics_service.get_system_health()
        return health_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve system health: {str(e)}"
        )