from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from app.core.firebase_config import FirebaseConfig
from app.models.common import IncidentType, IncidentSeverity, IncidentStatus


class AnalyticsService:
    """Service for handling analytics operations - Pramudi's Module"""
    
    def __init__(self):
        self.db = FirebaseConfig.get_firestore()
        self.incidents_collection = self.db.collection('incidents')
        self.users_collection = self.db.collection('users')
    
    async def get_incident_statistics(self, period_days: int = 30) -> Dict[str, Any]:
        """Get comprehensive incident statistics"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=period_days)
        
        # Query incidents in the period
        incidents_query = self.incidents_collection.where(
            'created_at', '>=', start_date
        ).where('created_at', '<=', end_date)
        
        incidents = list(incidents_query.stream())
        
        # Calculate statistics
        total_incidents = len(incidents)
        status_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        type_counts = defaultdict(int)
        
        for incident_doc in incidents:
            incident_data = incident_doc.to_dict()
            status_counts[incident_data.get('status', 'unknown')] += 1
            severity_counts[incident_data.get('severity', 'unknown')] += 1
            type_counts[incident_data.get('incident_type', 'unknown')] += 1
        
        # Calculate response times
        avg_response_time = await self._calculate_average_response_time(incidents)
        
        return {
            "total_incidents": total_incidents,
            "status_breakdown": dict(status_counts),
            "severity_breakdown": dict(severity_counts),
            "type_breakdown": dict(type_counts),
            "average_response_time_hours": avg_response_time,
            "period_days": period_days,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_security_dashboard_data(self) -> Dict[str, Any]:
        """Get real-time security dashboard data"""
        # Get incidents from last 24 hours
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_incidents = list(
            self.incidents_collection.where('created_at', '>=', last_24h).stream()
        )
        
        # Get total active incidents
        active_incidents = list(
            self.incidents_collection.where('status', 'in', ['pending', 'investigating']).stream()
        )
        
        # Get critical incidents
        critical_incidents = list(
            self.incidents_collection.where('severity', '==', 'critical').where('status', '!=', 'closed').stream()
        )
        
        return {
            "incidents_last_24h": len(recent_incidents),
            "active_incidents": len(active_incidents),
            "critical_incidents": len(critical_incidents),
            "system_health": "operational",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    async def generate_compliance_report(
        self, 
        report_type: str, 
        period_days: int = 30,
        user_role: str = "admin"
    ) -> Dict[str, Any]:
        """Generate compliance reports (GDPR, HIPAA, SOX)"""
        if user_role != "admin":
            raise Exception("Only admins can generate compliance reports")
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=period_days)
        
        # Get incidents for the period
        incidents_query = self.incidents_collection.where(
            'created_at', '>=', start_date
        ).where('created_at', '<=', end_date)
        
        incidents = list(incidents_query.stream())
        
        # Generate report based on type
        report_data = {
            "report_type": report_type,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "total_incidents": len(incidents),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": user_role
        }
        
        if report_type.lower() == "gdpr":
            # GDPR-specific metrics
            data_breach_incidents = [
                inc for inc in incidents 
                if inc.to_dict().get('incident_type') == 'data_breach'
            ]
            report_data.update({
                "data_breach_incidents": len(data_breach_incidents),
                "avg_breach_response_time": await self._calculate_average_response_time(data_breach_incidents),
                "compliance_score": self._calculate_gdpr_compliance_score(data_breach_incidents)
            })
        
        elif report_type.lower() == "hipaa":
            # HIPAA-specific metrics
            healthcare_incidents = [
                inc for inc in incidents 
                if 'health' in str(inc.to_dict().get('description', '')).lower()
            ]
            report_data.update({
                "healthcare_related_incidents": len(healthcare_incidents),
                "phi_incidents": len([i for i in healthcare_incidents if 'phi' in str(i.to_dict().get('description', '')).lower()])
            })
        
        elif report_type.lower() == "sox":
            # SOX-specific metrics
            financial_incidents = [
                inc for inc in incidents 
                if any(keyword in str(inc.to_dict().get('description', '')).lower() 
                      for keyword in ['financial', 'accounting', 'audit'])
            ]
            report_data.update({
                "financial_incidents": len(financial_incidents),
                "sox_compliance_score": self._calculate_sox_compliance_score(financial_incidents)
            })
        
        return report_data
    
    async def get_incident_trends(self, days: int = 90) -> Dict[str, Any]:
        """Get incident trends over time"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get incidents
        incidents_query = self.incidents_collection.where(
            'created_at', '>=', start_date
        ).where('created_at', '<=', end_date)
        
        incidents = list(incidents_query.stream())
        
        # Group by week
        weekly_counts = defaultdict(int)
        weekly_severity = defaultdict(lambda: defaultdict(int))
        
        for incident_doc in incidents:
            incident_data = incident_doc.to_dict()
            created_date = incident_data.get('created_at')
            
            if isinstance(created_date, datetime):
                week_start = created_date.replace(
                    hour=0, minute=0, second=0, microsecond=0
                ) - timedelta(days=created_date.weekday())
                week_key = week_start.isoformat()
                
                weekly_counts[week_key] += 1
                severity = incident_data.get('severity', 'medium')
                weekly_severity[week_key][severity] += 1
        
        return {
            "weekly_incident_counts": dict(weekly_counts),
            "weekly_severity_breakdown": dict(weekly_severity),
            "period_days": days,
            "trend_analysis": self._analyze_trends(weekly_counts)
        }
    
    async def export_incident_data(
        self, 
        format_type: str = "json", 
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Export incident data in various formats"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=period_days)
        
        incidents_query = self.incidents_collection.where(
            'created_at', '>=', start_date
        ).where('created_at', '<=', end_date)
        
        incidents = []
        for doc in incidents_query.stream():
            incident_data = doc.to_dict()
            incidents.append(incident_data)
        
        export_data = {
            "export_format": format_type,
            "total_records": len(incidents),
            "export_date": datetime.now(timezone.utc).isoformat(),
            "period_days": period_days,
            "data": incidents
        }
        
        return export_data
    
    async def get_user_activity_metrics(self) -> Dict[str, Any]:
        """Get user activity and security awareness metrics"""
        users = list(self.users_collection.stream())
        
        total_users = len(users)
        active_users = sum(
            1 for user_doc in users 
            if user_doc.to_dict().get('is_active', False)
        )
        
        role_distribution = defaultdict(int)
        for user_doc in users:
            role = user_doc.to_dict().get('role', 'unknown')
            role_distribution[role] += 1
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "role_distribution": dict(role_distribution),
            "user_engagement_score": (active_users / total_users * 100) if total_users > 0 else 0
        }
    
    async def _calculate_average_response_time(self, incidents: List) -> float:
        """Calculate average response time in hours"""
        if not incidents:
            return 0.0
        
        total_response_time = 0
        valid_incidents = 0
        
        for incident_doc in incidents:
            incident_data = incident_doc.to_dict()
            created_at = incident_data.get('created_at')
            updated_at = incident_data.get('updated_at')
            
            if created_at and updated_at and isinstance(created_at, datetime) and isinstance(updated_at, datetime):
                response_time = (updated_at - created_at).total_seconds() / 3600  # Convert to hours
                total_response_time += response_time
                valid_incidents += 1
        
        return total_response_time / valid_incidents if valid_incidents > 0 else 0.0
    
    def _calculate_gdpr_compliance_score(self, incidents: List) -> float:
        """Calculate GDPR compliance score based on response times"""
        if not incidents:
            return 100.0
        
        # GDPR requires 72-hour notification for data breaches
        compliant_incidents = 0
        
        for incident_doc in incidents:
            incident_data = incident_doc.to_dict()
            created_at = incident_data.get('created_at')
            updated_at = incident_data.get('updated_at')
            
            if created_at and updated_at:
                response_time_hours = (updated_at - created_at).total_seconds() / 3600
                if response_time_hours <= 72:
                    compliant_incidents += 1
        
        return (compliant_incidents / len(incidents)) * 100
    
    def _calculate_sox_compliance_score(self, incidents: List) -> float:
        """Calculate SOX compliance score"""
        if not incidents:
            return 100.0
        
        # Basic SOX compliance - incidents should be resolved within reasonable time
        resolved_incidents = sum(
            1 for inc_doc in incidents 
            if inc_doc.to_dict().get('status') in ['resolved', 'closed']
        )
        
        return (resolved_incidents / len(incidents)) * 100
    
    def _analyze_trends(self, weekly_counts: Dict) -> str:
        """Analyze incident trends"""
        if len(weekly_counts) < 2:
            return "Insufficient data for trend analysis"
        
        counts = list(weekly_counts.values())
        recent_avg = sum(counts[-4:]) / min(4, len(counts))  # Last 4 weeks
        older_avg = sum(counts[:-4]) / max(1, len(counts) - 4)  # Earlier weeks
        
        if recent_avg > older_avg * 1.2:
            return "Increasing trend - incidents are rising"
        elif recent_avg < older_avg * 0.8:
            return "Decreasing trend - incidents are declining"
        else:
            return "Stable trend - incident levels are consistent"