import json
import os
from datetime import datetime

class ChatHistory:
    def __init__(self):
        self.history_file = 'chat_history.json'
        self.sessions = self.load_history()

    def save_history(self):
        """Save chat history to file with UTF-8 encoding"""
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(self.sessions, f, indent=2, ensure_ascii=False)

    def load_history(self):
        """Load chat history from file with UTF-8 encoding"""
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def create_session(self, service_type):
        """Create new chat session"""
        session_id = f"{service_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.sessions[session_id] = {
            'id': session_id,
            'service_type': service_type,
            'created_at': datetime.now().isoformat(),
            'messages': [],
            'title': f"New {service_type.replace('-', ' ').title()} Chat"
        }
        self.save_history()
        return session_id
    
    def add_message(self, session_id, role, content, image_url=None):
        """Add message to session"""
        if session_id not in self.sessions:
            return False
        
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        }
        
        if image_url:
            message['image_url'] = image_url
        
        self.sessions[session_id]['messages'].append(message)
        
        # Update title based on first user message
        if role == 'user' and len(self.sessions[session_id]['messages']) == 1:
            title = content[:50] + ('...' if len(content) > 50 else '')
            self.sessions[session_id]['title'] = title
        
        self.save_history()
        return True
    
    def get_session(self, session_id):
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def get_all_sessions(self, service_type=None):
        """Get all sessions, optionally filtered by service type"""
        if service_type:
            return {k: v for k, v in self.sessions.items() 
                   if v['service_type'] == service_type}
        return self.sessions
    
    def delete_session(self, session_id):
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            self.save_history()
            return True
        return False
    
    def clear_all_history(self):
        """Clear all chat history"""
        self.sessions = {}
        self.save_history()
        return True
    
    def get_messages_for_api(self, session_id):
        """Get messages formatted for API"""
        session = self.get_session(session_id)
        if not session:
            return []
        
        return [{'role': msg['role'], 'content': msg['content']} 
                for msg in session['messages']]
