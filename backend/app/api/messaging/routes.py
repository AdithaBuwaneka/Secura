"""
Messaging WebSocket Routes
Handles real-time messaging connections with authentication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from firebase_admin import auth
from typing import Optional, List
import json
import time
from collections import defaultdict

from app.services.messaging.connection_manager import ConnectionManager
from app.services.incidents.messaging_service import MessagingService
from app.models.message import Message
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Messaging"])

# WebSocket connection manager
manager = ConnectionManager()

# Rate limiting for connections (user_id -> last_connection_time)
connection_attempts = defaultdict(list)

@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    messaging_service: MessagingService = Depends()
):
    """Get all conversations for the current user"""
    try:
        # For now, return empty list since we don't have a general conversations feature
        # This endpoint is called by the frontend but not used in the current implementation
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve conversations: {str(e)}"
        )

@router.get("/ws/test")
async def test_websocket_connection():
    """Test endpoint to check WebSocket service status"""
    return {
        "status": "WebSocket service is running",
        "active_connections": len(manager.active_connections),
        "room_connections": len(manager.room_connections),
        "connection_details": {
            "active_users": list(manager.active_connections.keys()),
            "rooms": list(manager.room_connections.keys())
        },
        "recent_connection_attempts": {
            user_id: {
                "count": len(attempts),
                "last_attempt": attempts[-1] if attempts else None
            }
            for user_id, attempts in connection_attempts.items() 
            if attempts and time.time() - attempts[-1] < 300  # Last 5 minutes
        },
        "endpoints": {
            "general": "/api/messaging/ws/general?token=<firebase_token>&user_id=<user_id>",
            "incident": "/api/messaging/ws/<incident_id>?token=<firebase_token>"
        }
    }

@router.post("/ws/disconnect/{user_id}")
async def force_disconnect_user(user_id: str):
    """Force disconnect a user (for debugging)"""
    if user_id in manager.active_connections:
        try:
            await manager.active_connections[user_id].close(code=status.WS_1000_NORMAL_CLOSURE, reason="Admin disconnect")
            manager.disconnect(manager.active_connections[user_id], user_id)
            return {"message": f"User {user_id} disconnected successfully"}
        except Exception as e:
            return {"error": f"Failed to disconnect user {user_id}: {str(e)}"}
    else:
        return {"message": f"User {user_id} is not connected"}

async def authenticate_websocket(websocket: WebSocket, token: str) -> Optional[dict]:
    """Authenticate WebSocket connection using Firebase ID token"""
    try:
        print(f"DEBUG: Attempting WebSocket authentication with token: {token[:20]}...")
        
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(token)
        
        # Check token expiration
        current_time = time.time()
        token_exp = decoded_token.get('exp', 0)
        time_until_exp = token_exp - current_time
        
        print(f"DEBUG: WebSocket authentication successful for user: {decoded_token.get('email')}")
        print(f"DEBUG: Token expires in {time_until_exp:.0f} seconds")
        
        if time_until_exp < 300:  # Less than 5 minutes
            print(f"WARNING: Token expires soon ({time_until_exp:.0f}s), user should refresh")
        
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'user_id': decoded_token['uid'],
            'expires_in': time_until_exp
        }
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        print(f"DEBUG: WebSocket authentication failed ({error_type}): {error_msg}")
        print(f"DEBUG: Token that failed: {token[:50]}...")
        
        # Specific handling for token expiration
        if "expired" in error_msg.lower() or "token" in error_msg.lower():
            print(f"DEBUG: Token appears to be expired or invalid")
        
        return None

@router.websocket("/ws/general")
async def websocket_general_endpoint(websocket: WebSocket, token: str = Query(...), user_id: str = Query(...)):
    """
    WebSocket endpoint for general messaging
    """
    current_time = time.time()
    print(f"DEBUG: WebSocket connection attempt for user_id: {user_id} at {current_time}")
    
    # Rate limiting: Allow max 5 connections per minute per user
    connection_attempts[user_id] = [t for t in connection_attempts[user_id] if current_time - t < 60]
    if len(connection_attempts[user_id]) >= 5:
        print(f"DEBUG: Rate limit exceeded for user {user_id} - {len(connection_attempts[user_id])} attempts in last minute")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Too many connection attempts - please wait before retrying")
        return
    
    connection_attempts[user_id].append(current_time)
    
    # Check if user already has an active connection
    if user_id in manager.active_connections:
        print(f"DEBUG: User {user_id} already has an active connection, closing old connection")
        try:
            old_websocket = manager.active_connections[user_id]
            await old_websocket.close(code=status.WS_1000_NORMAL_CLOSURE, reason="New connection established")
        except:
            pass
        manager.disconnect(old_websocket, user_id)
    
    # Authenticate the connection
    user_data = await authenticate_websocket(websocket, token)
    if not user_data:
        print(f"DEBUG: WebSocket authentication failed for user_id: {user_id}")
        
        # Check if this might be a token expiration issue
        attempt_count = len(connection_attempts[user_id])
        if attempt_count > 2:
            print(f"DEBUG: Multiple failed attempts ({attempt_count}) detected - likely token expiration")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed - token may be expired, please refresh your session")
        else:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return
    
    # Verify user_id matches token
    if user_data['uid'] != user_id:
        print(f"DEBUG: User ID mismatch. Token UID: {user_data['uid']}, Provided UID: {user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User ID mismatch")
        return
    
    # Check if token is expiring soon
    if user_data.get('expires_in', 0) < 300:  # Less than 5 minutes
        print(f"WARNING: User {user_id} connecting with token that expires in {user_data.get('expires_in', 0):.0f} seconds")
    
    await manager.connect(websocket, user_id)
    
    # Send a welcome message to confirm connection
    try:
        welcome_message = {
            'type': 'connection_established',
            'message': 'WebSocket connection successful',
            'user_id': user_id,
            'token_expires_in': user_data.get('expires_in', 0)
        }
        await websocket.send_text(json.dumps(welcome_message))
        print(f"DEBUG: Sent welcome message to {user_id}")
    except Exception as e:
        print(f"Failed to send welcome message: {str(e)}")
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            print(f"DEBUG: Received WebSocket message from {user_id}: {data[:100]}")
            try:
                message_data = json.loads(data)
                
                # Handle ping/pong for connection health
                if message_data.get('type') == 'ping':
                    await websocket.send_text(json.dumps({
                        'type': 'pong',
                        'timestamp': message_data.get('timestamp'),
                        'token_expires_in': user_data.get('expires_in', 0)
                    }))
                    continue
                
                # Handle token refresh requests
                if message_data.get('type') == 'token_refresh':
                    await websocket.send_text(json.dumps({
                        'type': 'token_refresh_required',
                        'message': 'Please refresh your authentication token and reconnect'
                    }))
                    continue
                
                # Broadcast message to all connected users
                await manager.broadcast(json.dumps({
                    'type': 'message',
                    'user_id': user_id,
                    'message': message_data,
                    'timestamp': message_data.get('timestamp')
                }))
            except json.JSONDecodeError:
                # Handle invalid JSON
                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'message': 'Invalid message format'
                }))
            
    except WebSocketDisconnect:
        print(f"DEBUG: WebSocket disconnect for user {user_id}")
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"DEBUG: WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(websocket, user_id)

@router.websocket("/ws/{incident_id}")
async def websocket_incident_endpoint(websocket: WebSocket, incident_id: str, token: str = Query(...)):
    """
    WebSocket endpoint for incident-specific messaging
    """
    # Authenticate the connection
    user_data = await authenticate_websocket(websocket, token)
    if not user_data:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return
    
    user_id = user_data['uid']
    room_id = f"incident_{incident_id}"
    
    await manager.connect(websocket, user_id, room_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                # Broadcast message to users in this incident room
                await manager.broadcast_to_room(room_id, json.dumps({
                    'type': 'incident_message',
                    'incident_id': incident_id,
                    'user_id': user_id,
                    'message': message_data,
                    'timestamp': message_data.get('timestamp')
                }))
            except json.JSONDecodeError:
                # Handle invalid JSON
                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'message': 'Invalid message format'
                }))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, room_id)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, user_id, room_id)