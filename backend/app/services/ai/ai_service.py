"""
AI Service - Rithara's Module
Handles incident categorization, severity assessment, and threat intelligence
"""

from typing import List, Dict, Any, Optional
import re
from datetime import datetime, timedelta
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    import pandas as pd
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from app.models.common import IncidentType, IncidentSeverity

class AIService:
    def __init__(self):
        self.category_keywords = {
            IncidentType.PHISHING: [
                'phishing', 'email', 'suspicious link', 'fake email', 
                'scam', 'impersonation', 'credential theft'
            ],
            IncidentType.MALWARE: [
                'malware', 'virus', 'trojan', 'ransomware', 'infected',
                'suspicious file', 'antivirus', 'quarantine'
            ],
            IncidentType.UNAUTHORIZED_ACCESS: [
                'unauthorized', 'breach', 'hacked', 'compromised account',
                'login attempt', 'access denied', 'privilege escalation'
            ],
            IncidentType.DATA_BREACH: [
                'data breach', 'data leak', 'exposed data', 'confidential',
                'personal information', 'database', 'exfiltration'
            ],
            IncidentType.SOCIAL_ENGINEERING: [
                'social engineering', 'manipulation', 'pretexting',
                'phone scam', 'impersonation', 'psychological'
            ],
            IncidentType.PHYSICAL_SECURITY: [
                'physical security', 'unauthorized entry', 'tailgating',
                'badge theft', 'facility breach', 'access control'
            ]
        }
        
        self.severity_indicators = {
            'critical': ['system down', 'complete breach', 'ransomware', 'data stolen'],
            'high': ['multiple users', 'sensitive data', 'financial', 'executive'],
            'medium': ['single user', 'suspicious activity', 'potential threat'],
            'low': ['false positive', 'minor', 'informational', 'awareness']
        }

    async def analyze_incident(
        self, 
        title: str, 
        description: str, 
        context: Dict[str, Any] = {},
        user_department: str = None
    ) -> Dict[str, Any]:
        """
        Comprehensive AI analysis of incident
        """
        try:
            # Get category suggestions
            categories = await self.categorize_incident(title, description)
            
            # Assess severity
            severity = await self.assess_severity(
                title, description, categories[0]['category'] if categories else None
            )
            
            # Generate mitigation strategies
            mitigation_strategies = await self.generate_mitigation_strategies(
                categories[0]['category'] if categories else IncidentType.MALWARE,
                severity['severity'],
                context
            )
            
            # Calculate overall confidence
            confidence_score = self._calculate_confidence(categories, severity)
            
            return {
                'categories': categories,
                'severity': severity,
                'mitigation_strategies': mitigation_strategies,
                'confidence_score': confidence_score
            }
            
        except Exception as e:
            raise Exception(f"AI analysis failed: {str(e)}")

    async def categorize_incident(self, title: str, description: str) -> List[Dict[str, Any]]:
        """
        Categorize incident using keyword matching and NLP
        """
        text = f"{title} {description}".lower()
        suggestions = []
        
        for category, keywords in self.category_keywords.items():
            score = 0
            matched_keywords = []
            
            for keyword in keywords:
                if keyword in text:
                    score += 1
                    matched_keywords.append(keyword)
            
            if score > 0:
                confidence = min(score / len(keywords), 0.95)
                suggestions.append({
                    'category': category,
                    'confidence': confidence,
                    'reasoning': f"Keywords found: {', '.join(matched_keywords[:3])}"
                })
        
        # Sort by confidence
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return top 3 suggestions
        return suggestions[:3] if suggestions else [{
            'category': IncidentType.MALWARE,  # Default fallback
            'confidence': 0.3,
            'reasoning': "No specific keywords found"
        }]

    async def assess_severity(
        self, 
        title: str, 
        description: str, 
        category: Optional[IncidentType] = None
    ) -> Dict[str, Any]:
        """
        Assess incident severity level
        """
        text = f"{title} {description}".lower()
        severity_scores = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        # Keyword-based scoring
        for level, indicators in self.severity_indicators.items():
            for indicator in indicators:
                if indicator in text:
                    severity_scores[level] += 1
        
        # Category-based adjustments
        if category == IncidentType.DATA_BREACH:
            severity_scores['critical'] += 2
        elif category == IncidentType.MALWARE:
            severity_scores['high'] += 1
        elif category == IncidentType.PHISHING:
            severity_scores['medium'] += 1
        
        # Determine final severity
        max_score = max(severity_scores.values())
        if max_score == 0:
            severity_level = IncidentSeverity.LOW
            confidence = 0.4
        else:
            severity_level = IncidentSeverity(
                max(severity_scores, key=severity_scores.get).upper()
            )
            confidence = min(max_score / 3, 0.9)
        
        factors = [f"{k}: {v}" for k, v in severity_scores.items() if v > 0]
        
        return {
            'severity': severity_level,
            'confidence': confidence,
            'factors': factors
        }

    async def generate_mitigation_strategies(
        self, 
        category: IncidentType, 
        severity: IncidentSeverity, 
        context: Dict[str, Any] = {}
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered mitigation strategies
        """
        strategies = []
        
        # Base strategies by category
        category_strategies = {
            IncidentType.PHISHING: [
                {
                    'strategy': 'Block suspicious sender and URLs',
                    'priority': 1,
                    'estimated_time': '15 minutes',
                    'resources_required': ['Email admin', 'Security team']
                },
                {
                    'strategy': 'Send awareness alert to all users',
                    'priority': 2,
                    'estimated_time': '30 minutes',
                    'resources_required': ['Communications team']
                }
            ],
            IncidentType.MALWARE: [
                {
                    'strategy': 'Isolate affected systems immediately',
                    'priority': 1,
                    'estimated_time': '10 minutes',
                    'resources_required': ['IT team', 'Network admin']
                },
                {
                    'strategy': 'Run full antivirus scan',
                    'priority': 2,
                    'estimated_time': '2 hours',
                    'resources_required': ['Security tools', 'IT support']
                }
            ],
            IncidentType.UNAUTHORIZED_ACCESS: [
                {
                    'strategy': 'Immediately reset compromised credentials',
                    'priority': 1,
                    'estimated_time': '5 minutes',
                    'resources_required': ['Identity management system']
                },
                {
                    'strategy': 'Review access logs for breach extent',
                    'priority': 2,
                    'estimated_time': '1 hour',
                    'resources_required': ['Security analyst', 'Log analysis tools']
                }
            ]
        }
        
        # Get base strategies
        base_strategies = category_strategies.get(category, [
            {
                'strategy': 'Document incident details thoroughly',
                'priority': 1,
                'estimated_time': '30 minutes',
                'resources_required': ['Security analyst']
            }
        ])
        
        # Adjust priorities based on severity
        if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            for strategy in base_strategies:
                strategy['priority'] = max(1, strategy['priority'] - 1)
                if severity == IncidentSeverity.CRITICAL:
                    strategy['estimated_time'] = self._reduce_time(strategy['estimated_time'])
        
        return base_strategies

    async def get_threat_intelligence(
        self, 
        category: Optional[IncidentType] = None, 
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get threat intelligence and pattern analysis
        """
        # This would integrate with external threat intelligence APIs
        # For now, return simulated data
        return {
            'trending_threats': [
                {
                    'threat_type': 'Phishing campaigns',
                    'increase_percentage': 25,
                    'risk_level': 'High'
                },
                {
                    'threat_type': 'Ransomware variants',
                    'increase_percentage': 15,
                    'risk_level': 'Critical'
                }
            ],
            'industry_alerts': [
                {
                    'alert': 'New malware targeting financial sector',
                    'severity': 'High',
                    'date': datetime.now().isoformat()
                }
            ],
            'recommendations': [
                'Increase email security training',
                'Update endpoint protection policies',
                'Review backup and recovery procedures'
            ]
        }

    async def get_predictive_analytics(
        self, 
        organization_id: Optional[str] = None, 
        timeframe_days: int = 90
    ) -> Dict[str, Any]:
        """
        Get predictive analytics for security threats
        """
        return {
            'predicted_incident_volume': {
                'next_week': 12,
                'next_month': 45,
                'confidence': 0.78
            },
            'risk_factors': [
                {
                    'factor': 'Increased phishing activity',
                    'impact_score': 0.85,
                    'likelihood': 0.72
                },
                {
                    'factor': 'Holiday season social engineering',
                    'impact_score': 0.65,
                    'likelihood': 0.89
                }
            ],
            'recommended_actions': [
                'Increase security awareness training',
                'Implement additional email filters',
                'Schedule vulnerability assessments'
            ]
        }

    async def detect_anomalies(self, incident_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Detect anomalies in incident patterns
        """
        anomalies = []
        
        # Simulate anomaly detection logic
        if incident_data.get('incidents_per_hour', 0) > 10:
            anomalies.append({
                'type': 'High incident volume',
                'description': 'Unusual spike in incident reports',
                'severity': 'Medium',
                'recommendation': 'Investigate potential coordinated attack'
            })
        
        return anomalies

    def _calculate_confidence(self, categories: List[Dict], severity: Dict) -> float:
        """Calculate overall confidence score"""
        category_confidence = categories[0]['confidence'] if categories else 0.3
        severity_confidence = severity['confidence']
        
        return (category_confidence + severity_confidence) / 2

    def _reduce_time(self, time_str: str) -> str:
        """Reduce estimated time for critical incidents"""
        if 'hour' in time_str:
            hours = int(re.findall(r'\d+', time_str)[0])
            return f"{max(1, hours // 2)} hours"
        elif 'minute' in time_str:
            minutes = int(re.findall(r'\d+', time_str)[0])
            return f"{max(5, minutes // 2)} minutes"
        return time_str