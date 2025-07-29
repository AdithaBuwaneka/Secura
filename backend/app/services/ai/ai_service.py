"""
AI Service - Rithara's Module
Handles incident categorization, severity assessment, and threat intelligence
"""

from typing import List, Dict, Any, Optional
import re
import os
from datetime import datetime, timedelta
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    import pandas as pd
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from app.models.common import IncidentType, IncidentSeverity
from app.services.ai.threat_prediction_model import ThreatPredictionModel

class AIService:
    def __init__(self):
        # Try to load the trained ML model
        self.ml_model = None
        model_dir = 'backend/app/models/ml_models'
        if os.path.exists(model_dir) and SKLEARN_AVAILABLE:
            try:
                self.ml_model = ThreatPredictionModel()
                self.ml_model.load_models(model_dir)
                print("ML model loaded successfully!")
            except Exception as e:
                print(f"Failed to load ML model: {e}")
                self.ml_model = None
        
        # Enhanced keyword patterns with weighted scoring (fallback)
        self.category_keywords = {
            IncidentType.PHISHING: {
                'high_confidence': ['phishing', 'spear phishing', 'credential harvesting', 'fake login page'],
                'medium_confidence': ['suspicious email', 'fake email', 'scam email', 'impersonation'],
                'indicators': ['click here', 'verify account', 'urgent action', 'suspended account', 'prize winner'],
                'domains': ['suspicious link', 'shortened url', 'fake website', 'lookalike domain']
            },
            IncidentType.MALWARE: {
                'high_confidence': ['malware', 'ransomware', 'trojan', 'virus detected'],
                'medium_confidence': ['suspicious file', 'infected system', 'antivirus alert'],
                'indicators': ['file encrypted', 'system slow', 'popup ads', 'unknown process'],
                'file_types': ['.exe', '.bat', '.scr', '.zip attachment']
            },
            IncidentType.UNAUTHORIZED_ACCESS: {
                'high_confidence': ['unauthorized access', 'account compromised', 'hacked account'],
                'medium_confidence': ['suspicious login', 'failed login attempts', 'access denied'],
                'indicators': ['unknown location', 'unusual activity', 'password changed', 'sessions active'],
                'systems': ['server breach', 'database access', 'admin panel', 'privileged account']
            },
            IncidentType.DATA_BREACH: {
                'high_confidence': ['data breach', 'data leak', 'sensitive data exposed'],
                'medium_confidence': ['confidential information', 'personal data', 'customer records'],
                'indicators': ['database dump', 'files stolen', 'data exfiltration', 'information disclosed'],
                'data_types': ['credit card', 'social security', 'medical records', 'financial data']
            },
            IncidentType.SOCIAL_ENGINEERING: {
                'high_confidence': ['social engineering', 'pretexting', 'baiting attack'],
                'medium_confidence': ['manipulation', 'impersonation', 'psychological pressure'],
                'indicators': ['urgent request', 'authority figure', 'fear tactics', 'trust exploitation'],
                'methods': ['phone scam', 'fake support', 'CEO fraud', 'invoice fraud']
            },
            IncidentType.PHYSICAL_SECURITY: {
                'high_confidence': ['unauthorized entry', 'facility breach', 'physical intrusion'],
                'medium_confidence': ['tailgating', 'badge theft', 'access control'],
                'indicators': ['door propped open', 'unknown person', 'security bypass', 'surveillance blind spot'],
                'areas': ['server room', 'restricted area', 'emergency exit', 'loading dock']
            }
        }
        
        # Enhanced severity assessment with weighted indicators
        self.severity_indicators = {
            'critical': {
                'system_impact': ['system down', 'complete outage', 'network offline', 'servers compromised'],
                'data_impact': ['data stolen', 'complete breach', 'database dump', 'mass exfiltration'],
                'ransomware': ['encrypted files', 'ransom demand', 'all files locked', 'payment demanded'],
                'infrastructure': ['critical system', 'production down', 'business stopped']
            },
            'high': {
                'scope': ['multiple users', 'department wide', 'company wide', 'all employees'],
                'data_type': ['sensitive data', 'financial records', 'customer data', 'confidential'],
                'targets': ['executive', 'admin account', 'privileged user', 'c-level'],
                'impact': ['significant loss', 'regulatory violation', 'reputation damage']
            },
            'medium': {
                'scope': ['single user', 'small group', 'one department', 'limited access'],
                'activity': ['suspicious activity', 'unusual behavior', 'potential threat', 'investigation needed'],
                'containment': ['isolated incident', 'contained threat', 'blocked attack']
            },
            'low': {
                'classification': ['false positive', 'false alarm', 'benign activity'],
                'severity': ['minor issue', 'informational', 'awareness only', 'no impact'],
                'status': ['resolved', 'no action needed', 'monitoring only']
            }
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
            # Combine title and description for ML model
            full_text = f"{title} {description}"
            
            # Use ML model if available
            if self.ml_model:
                try:
                    ml_prediction = self.ml_model.predict(full_text)
                    
                    # Convert ML model output to our format
                    # Map attack types to our incident types
                    attack_type_mapping = {
                        'phishing': IncidentType.PHISHING.value,
                        'malware': IncidentType.MALWARE.value,
                        'ransomware': IncidentType.MALWARE.value,
                        'data_breach': IncidentType.DATA_BREACH.value,
                        'unauthorized_access': IncidentType.UNAUTHORIZED_ACCESS.value,
                        'sql_injection': IncidentType.UNAUTHORIZED_ACCESS.value,
                        'DDoS': IncidentType.MALWARE.value,
                        'insider_threat': IncidentType.UNAUTHORIZED_ACCESS.value,
                        'zero_day': IncidentType.MALWARE.value,
                        'supply_chain': IncidentType.DATA_BREACH.value,
                        'other': IncidentType.MALWARE.value
                    }
                    
                    incident_type = attack_type_mapping.get(
                        ml_prediction['attack_type'], 
                        IncidentType.MALWARE.value
                    )
                    
                    categories = [{
                        'category': incident_type,
                        'confidence': ml_prediction['attack_type_confidence'],
                        'reasoning': f"ML Model: {ml_prediction['attack_type']} detected with {ml_prediction['attack_type_confidence']:.0%} confidence"
                    }]
                    
                    severity = {
                        'severity': ml_prediction['severity'],
                        'confidence': ml_prediction['severity_confidence'],
                        'factors': [f"ML Threat Score: {ml_prediction['threat_score']:.1f}/100"]
                    }
                    
                except Exception as e:
                    print(f"ML prediction failed, falling back to keyword-based: {e}")
                    # Fall back to keyword-based analysis
                    categories = await self.categorize_incident(title, description)
                    category_for_severity = IncidentType(categories[0]['category']) if categories and categories[0]['category'] else None
                    severity = await self.assess_severity(title, description, category_for_severity)
            else:
                # Use keyword-based analysis as fallback
                categories = await self.categorize_incident(title, description)
                category_for_severity = IncidentType(categories[0]['category']) if categories and categories[0]['category'] else None
                severity = await self.assess_severity(title, description, category_for_severity)
            
            # Generate mitigation strategies
            category_enum = IncidentType(categories[0]['category']) if categories else IncidentType.MALWARE
            severity_enum = IncidentSeverity(severity['severity'])
            
            mitigation_strategies = await self.generate_mitigation_strategies(
                category_enum,
                severity_enum,
                context
            )
            
            # Calculate overall confidence
            confidence_score = self._calculate_confidence(categories, severity)
            
            # Format response to match API schema
            formatted_categories = [{
                'category': cat['category'],
                'confidence': cat['confidence'],
                'reasoning': cat['reasoning']
            } for cat in categories]
            
            formatted_severity = {
                'severity': severity['severity'],
                'confidence': severity['confidence'],
                'factors': severity.get('factors', severity.get('matched_factors', {}).get(severity['severity'], [])[:3])
            }
            
            return {
                'categories': formatted_categories,
                'severity': formatted_severity,
                'mitigation_strategies': mitigation_strategies,
                'confidence_score': confidence_score
            }
            
        except Exception as e:
            raise Exception(f"AI analysis failed: {str(e)}")

    async def categorize_incident(self, title: str, description: str) -> List[Dict[str, Any]]:
        """
        Enhanced categorization using weighted keyword matching
        """
        # Handle cases where title or description might be empty
        title = title or ""
        description = description or ""
        text = f"{title} {description}".lower().strip()
        suggestions = []
        
        for category, keyword_groups in self.category_keywords.items():
            score = 0
            matched_keywords = []
            confidence_factors = []
            
            # High confidence keywords (weight: 3)
            for keyword in keyword_groups.get('high_confidence', []):
                if keyword.lower() in text:
                    score += 3
                    matched_keywords.append(keyword)
                    confidence_factors.append(f"High: {keyword}")
            
            # Medium confidence keywords (weight: 2)
            for keyword in keyword_groups.get('medium_confidence', []):
                if keyword.lower() in text:
                    score += 2
                    matched_keywords.append(keyword)
                    confidence_factors.append(f"Medium: {keyword}")
            
            # Indicator keywords (weight: 1)
            for keyword in keyword_groups.get('indicators', []):
                if keyword.lower() in text:
                    score += 1
                    matched_keywords.append(keyword)
                    confidence_factors.append(f"Indicator: {keyword}")
            
            # Domain/type specific keywords (weight: 1.5)
            for group_name in ['domains', 'file_types', 'systems', 'data_types', 'methods', 'areas']:
                for keyword in keyword_groups.get(group_name, []):
                    if keyword.lower() in text:
                        score += 1.5
                        matched_keywords.append(keyword)
                        confidence_factors.append(f"{group_name.title()}: {keyword}")
            
            if score > 0:
                # Normalize confidence score (max possible score varies by category)
                max_possible = (len(keyword_groups.get('high_confidence', [])) * 3 + 
                               len(keyword_groups.get('medium_confidence', [])) * 2 + 
                               len(keyword_groups.get('indicators', [])) * 1)
                
                # Add bonus for file types, domains, etc.
                for group_name in ['domains', 'file_types', 'systems', 'data_types', 'methods', 'areas']:
                    max_possible += len(keyword_groups.get(group_name, [])) * 1.5
                
                raw_confidence = score / max(max_possible, 1)
                # Apply scaling to get reasonable confidence values
                confidence = min(0.5 + (raw_confidence * 0.45), 0.95)
                
                suggestions.append({
                    'category': category.value,  # Convert enum to string
                    'confidence': confidence,
                    'reasoning': f"Matched: {', '.join(confidence_factors[:3])}",
                    'score': score,
                    'matched_keywords': matched_keywords[:5]
                })
        
        # Sort by confidence score
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return top 3 suggestions, or default if none found
        return suggestions[:3] if suggestions else [{
            'category': IncidentType.MALWARE.value,  # Default fallback - convert enum to string
            'confidence': 0.3,
            'reasoning': "No specific security keywords found - using general category",
            'score': 0,
            'matched_keywords': []
        }]

    async def assess_severity(
        self, 
        title: str, 
        description: str, 
        category: Optional[IncidentType] = None
    ) -> Dict[str, Any]:
        """
        Enhanced severity assessment with weighted indicators
        """
        # Handle cases where title or description might be empty
        title = title or ""
        description = description or ""
        text = f"{title} {description}".lower().strip()
        severity_scores = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        matched_factors = {'critical': [], 'high': [], 'medium': [], 'low': []}
        
        # Enhanced keyword-based scoring with weights
        for level, indicator_groups in self.severity_indicators.items():
            for group_name, indicators in indicator_groups.items():
                for indicator in indicators:
                    if indicator.lower() in text:
                        # Different weights for different groups
                        weight = {
                            'system_impact': 4, 'data_impact': 4, 'ransomware': 5, 'infrastructure': 4,
                            'scope': 3, 'data_type': 3, 'targets': 3, 'impact': 3,
                            'activity': 2, 'containment': 2,
                            'classification': 1, 'severity': 1, 'status': 1
                        }.get(group_name, 2)
                        
                        severity_scores[level] += weight
                        matched_factors[level].append(f"{group_name}: {indicator}")
        
        # Category-based adjustments (enhanced)
        category_adjustments = {
            IncidentType.DATA_BREACH: {'critical': 3, 'high': 2},
            IncidentType.MALWARE: {'critical': 2, 'high': 2},
            IncidentType.UNAUTHORIZED_ACCESS: {'high': 2, 'medium': 1},
            IncidentType.PHISHING: {'medium': 2, 'low': 1},
            IncidentType.SOCIAL_ENGINEERING: {'medium': 1, 'low': 1},
            IncidentType.PHYSICAL_SECURITY: {'high': 1, 'medium': 1}
        }
        
        if category and category in category_adjustments:
            for level, adjustment in category_adjustments[category].items():
                severity_scores[level] += adjustment
                matched_factors[level].append(f"Category: {category.value}")
        
        # Time-based urgency indicators
        urgency_keywords = ['urgent', 'immediate', 'asap', 'emergency', 'critical', 'now']
        for keyword in urgency_keywords:
            if keyword in text:
                severity_scores['high'] += 1
                matched_factors['high'].append(f"Urgency: {keyword}")
        
        # Business impact indicators
        business_keywords = ['production', 'revenue', 'customer', 'business critical', 'operations']
        for keyword in business_keywords:
            if keyword in text:
                severity_scores['high'] += 2
                matched_factors['high'].append(f"Business impact: {keyword}")
        
        # Determine final severity
        max_score = max(severity_scores.values())
        if max_score == 0:
            severity_level = IncidentSeverity.LOW
            confidence = 0.4
            reasoning = "No severity indicators found"
        else:
            severity_level = IncidentSeverity(
                max(severity_scores, key=severity_scores.get)  # Already lowercase
            )
            # Calculate confidence based on score distribution
            total_score = sum(severity_scores.values())
            confidence = min(max_score / max(total_score, 1), 0.95)
            
            # Get reasoning from matched factors
            winning_level = max(severity_scores, key=severity_scores.get)
            reasoning = f"Score: {max_score}, Factors: {', '.join(matched_factors[winning_level][:3])}"
        
        return {
            'severity': severity_level.value,  # Convert enum to string
            'confidence': confidence,
            'reasoning': reasoning,
            'score_breakdown': severity_scores,
            'matched_factors': {k: v[:3] for k, v in matched_factors.items() if v}
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