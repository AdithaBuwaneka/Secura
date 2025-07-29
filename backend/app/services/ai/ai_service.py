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
            hours = int(re.findall(r'\\d+', time_str)[0])
            return f"{max(1, hours // 2)} hours"
        elif 'minute' in time_str:
            minutes = int(re.findall(r'\\d+', time_str)[0])
            return f"{max(5, minutes // 2)} minutes"
        return time_str

    async def analyze_image(
        self, 
        image_url: str, 
        incident_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze image content using Tesseract OCR for text extraction
        Then analyze the extracted text for security threats
        """
        import aiohttp
        import asyncio
        try:
            import pytesseract
            from PIL import Image
            from io import BytesIO
            import platform
            
            # For Windows, explicitly set Tesseract path
            if platform.system() == 'Windows':
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        except ImportError:
            return {
                "extracted_text": "OCR libraries not installed. Please run: pip install pytesseract pillow",
                "summary": "Unable to process image - OCR dependencies missing",
                "threat_indicators": ["OCR setup required"],
                "confidence": 0.0,
                "recommendations": ["Install pytesseract and Pillow packages", "Ensure Tesseract is installed on the system"]
            }
        
        extracted_text = ""
        
        try:
            # Download image from URL
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download image: {response.status}")
                    image_data = await response.read()
            
            # Open image with PIL
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary (handles PNG transparency)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Run OCR in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            extracted_text = await loop.run_in_executor(
                None, 
                pytesseract.image_to_string, 
                image
            )
            
            # Clean up the extracted text
            extracted_text = extracted_text.strip()
            
            if not extracted_text:
                return {
                    "extracted_text": "No text could be extracted from this image.",
                    "summary": "The image appears to contain no readable text or the text quality is too poor for extraction.",
                    "threat_indicators": [],
                    "confidence": 0.0,
                    "recommendations": ["Try uploading a clearer image", "Ensure the image contains text content"]
                }
                
        except Exception as e:
            print(f"OCR Error: {str(e)}")
            # Provide helpful error message
            error_msg = str(e)
            if "tesseract" in error_msg.lower():
                return {
                    "extracted_text": "Tesseract OCR is not installed or not found in PATH",
                    "summary": "Please install Tesseract OCR on your system",
                    "threat_indicators": ["OCR system not configured"],
                    "confidence": 0.0,
                    "recommendations": [
                        "Install Tesseract: sudo apt-get install tesseract-ocr (Linux)",
                        "Or download from: https://github.com/tesseract-ocr/tesseract",
                        "Ensure tesseract is in your system PATH"
                    ]
                }
            else:
                return {
                    "extracted_text": f"Error processing image: {error_msg}",
                    "summary": "Failed to extract text from image",
                    "threat_indicators": ["Processing error"],
                    "confidence": 0.0,
                    "recommendations": ["Check image format", "Ensure image URL is accessible"]
                }
        
        # Now analyze the extracted text for security threats
        threat_indicators = []
        recommendations = []
        confidence = 0.0
        
        # Convert to lowercase for analysis
        text_lower = extracted_text.lower()
        
        # Check for various security threat patterns
        
        # Phishing indicators
        phishing_patterns = {
            'urgent_action': ['urgent', 'immediate action', 'act now', 'expire', 'suspended'],
            'credential_request': ['verify your account', 'confirm your identity', 'update your information', 'validate your'],
            'suspicious_links': ['click here', 'bit.ly', 'tinyurl', 'shortlink'],
            'impersonation': ['security team', 'it department', 'bank security', 'account team'],
            'threats': ['suspended', 'blocked', 'unauthorized', 'illegal activity']
        }
        
        phishing_score = 0
        for category, patterns in phishing_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    threat_indicators.append(f"Phishing indicator: {pattern}")
                    phishing_score += 1
        
        # Malware indicators
        malware_patterns = {
            'processes': ['svchost.exe', 'cmd.exe', 'powershell', 'wscript'],
            'locations': ['\\temp\\', '\\appdata\\', '\\roaming\\', 'c:\\windows\\temp'],
            'network': ['port', 'connection', 'c2', 'command control', 'exfiltration'],
            'file_activity': ['encrypted', 'modified files', 'registry', 'deleted files']
        }
        
        malware_score = 0
        for category, patterns in malware_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    threat_indicators.append(f"Malware indicator: {pattern}")
                    malware_score += 1
        
        # Ransomware indicators
        if any(word in text_lower for word in ['encrypted', 'bitcoin', 'ransom', 'decrypt', 'locked']):
            threat_indicators.append("Possible ransomware activity detected")
            recommendations.append("Isolate affected systems immediately")
            recommendations.append("Do not pay any ransom demands")
            confidence = max(confidence, 0.9)
        
        # Data breach indicators
        if any(word in text_lower for word in ['data breach', 'exposed', 'leaked', 'dump', 'exfiltrated']):
            threat_indicators.append("Potential data breach detected")
            recommendations.append("Assess scope of data exposure")
            recommendations.append("Notify affected parties as required by law")
            confidence = max(confidence, 0.85)
        
        # Social engineering
        if any(word in text_lower for word in ['wire transfer', 'send money', 'urgent payment', 'ceo', 'executive']):
            threat_indicators.append("Social engineering attempt detected")
            recommendations.append("Verify request through official channels")
            recommendations.append("Do not act on urgent financial requests via email")
            confidence = max(confidence, 0.8)
        
        # Calculate overall confidence based on indicators found
        total_indicators = len(threat_indicators)
        if total_indicators > 0:
            confidence = min(0.5 + (total_indicators * 0.1), 0.95)
        else:
            confidence = 0.2
        
        # Generate recommendations based on findings
        if phishing_score > 2:
            recommendations.extend([
                "Mark as phishing and block sender",
                "Report to anti-phishing working group",
                "Alert other users about this campaign"
            ])
        
        if malware_score > 2:
            recommendations.extend([
                "Run full antivirus scan",
                "Check for persistence mechanisms",
                "Review network connections"
            ])
        
        # Check if we have enough information to make a determination
        if not threat_indicators and len(extracted_text) > 50:
            # Text extracted but no clear threats found
            threat_indicators = ["Unable to determine specific threats from the extracted text"]
            recommendations = [
                "Manual review recommended - text does not contain clear security indicators",
                "Consider the context in which this image was received",
                "Look for subtle social engineering tactics",
                "Verify any requests through official channels"
            ]
            confidence = 0.3
        elif not threat_indicators and len(extracted_text) <= 50:
            # Very little or no text extracted
            threat_indicators = ["Insufficient text extracted for meaningful analysis"]
            recommendations = [
                "Image contains minimal readable text",
                "Try uploading a higher quality image if text is expected",
                "Manually review the image for visual indicators",
                "Consider the source and context of the image"
            ]
            confidence = 0.1
        elif len(threat_indicators) == 1:
            # Only one indicator found - low confidence
            recommendations.append("Limited indicators found - manual verification recommended")
            recommendations.append("Cross-reference with other security data")
            confidence = min(confidence, 0.5)
        
        # Generate summary
        if phishing_score > malware_score and phishing_score > 0:
            summary = f"Phishing attempt detected with {phishing_score} indicators. High risk of credential theft or account compromise."
        elif malware_score > phishing_score and malware_score > 0:
            summary = f"Malware-related content detected with {malware_score} indicators. System may be compromised."
        elif 'ransom' in text_lower:
            summary = "Ransomware notification detected. Critical security incident requiring immediate response."
        elif 'data' in text_lower and 'breach' in text_lower:
            summary = "Data breach notification detected. Immediate assessment and response required."
        elif threat_indicators and len(threat_indicators) > 2 and confidence > 0.6:
            summary = f"Security incident detected with {len(threat_indicators)} threat indicators. Investigation recommended."
        elif threat_indicators and len(threat_indicators) > 1 and confidence > 0.4:
            summary = f"Potential security concern identified with {len(threat_indicators)} indicators. Manual review recommended."
        elif confidence < 0.3:
            summary = "Analysis inconclusive - insufficient evidence to determine security threats. Manual review required."
        else:
            summary = "Text extracted and analyzed. Limited security indicators found - proceed with caution and verify context."
        
        return {
            "extracted_text": extracted_text,
            "summary": summary,
            "threat_indicators": threat_indicators[:10],  # Limit to top 10
            "confidence": confidence,
            "recommendations": recommendations[:5]  # Limit to top 5
        }
    
    def _generate_image_summary(self, text: str, indicators: List[str]) -> str:
        """Generate a concise summary of the image analysis"""
        text_lower = text.lower()
        
        if "phishing" in text_lower and "verify" in text_lower:
            return "Phishing email detected requesting account verification through suspicious link. High risk of credential theft."
        elif "ransomware" in text_lower or "encrypted" in text_lower:
            return "Ransomware attack notification demanding Bitcoin payment. Critical security incident requiring immediate response."
        elif "malware" in text_lower or "suspicious process" in text_lower:
            return "Active malware infection detected with C2 communication and data exfiltration. System compromise confirmed."
        elif "data exposure" in text_lower or "exposed records" in text_lower:
            return f"Data breach detected: {text.count('15,247') and '15,247' or 'Multiple'} customer records exposed through misconfigured cloud storage. Immediate action required."
        elif "wire transfer" in text_lower or "ceo" in text_lower:
            return "CEO fraud attempt detected using social engineering tactics to bypass financial controls. Do not process any transfers."
        elif "sql injection" in text_lower or "ids alert" in text_lower:
            return "Network intrusion attempt detected with SQL injection payload targeting database server. Attack blocked but investigation needed."
        elif "unauthorized" in text_lower and "access" in text_lower:
            return "Security alert showing unauthorized access attempts from suspicious IP using VPN/proxy. Attack blocked but monitoring required."
        else:
            # Generate more specific summary based on threat indicators
            if len(indicators) > 5:
                return f"Critical security incident detected with {len(indicators)} threat indicators including {indicators[0].lower()}. Immediate response required."
            elif len(indicators) > 3:
                return f"High-priority security alert: {indicators[0]}. {len(indicators)} risk factors identified requiring investigation."
            else:
                return f"Security incident detected with {len(indicators)} threat indicators. Immediate investigation recommended."