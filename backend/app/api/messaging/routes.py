"""
Messaging WebSocket Routes
Handles real-time messaging connections with authentication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query
from firebase_admin import auth
from typing import Optional
import json

from app.services.messaging.connection_manager import ConnectionManager

router = APIRouter(tags=["Messaging"])

# WebSocket connection manager
manager = ConnectionManager()

async def authenticate_websocket(websocket: WebSocket, token: str) -> Optional[dict]:
    """Authenticate WebSocket connection using Firebase ID token"""
    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(token)
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'user_id': decoded_token['uid']
        }
    except Exception as e:
        print(f"WebSocket authentication failed: {str(e)}")
        return None

@router.websocket("/ws/general")
async def websocket_general_endpoint(websocket: WebSocket, token: str = Query(...), user_id: str = Query(...)):
    """
    WebSocket endpoint for general messaging
    """
    # Authenticate the connection
    user_data = await authenticate_websocket(websocket, token)
    if not user_data:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return
    
    # Verify user_id matches token
    if user_data['uid'] != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User ID mismatch")
        return
    
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
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
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
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