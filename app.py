# -*- coding: utf-8 -*-
import sys, io, os, re, base64, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import requests
from config import Config
from models.chat_history import ChatHistory
from services.system_prompts import SYSTEM_PROMPTS
from utils.file_handler import save_uploaded_file

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
chat_history = ChatHistory()

# ===== ROUTES =====
@app.route('/')
def home(): return render_template('index.html')
@app.route('/playground')
def playground(): return render_template('playground.html')
@app.route('/about')
def about(): return render_template('about.html')
@app.route('/university')
def university(): return render_template('university.html')

# ===== SESSION API =====
@app.route('/api/sessions/create', methods=['POST'])
def create_session():
    data = request.json or {}
    stype = data.get('service_type')
    if not stype:
        return jsonify({'error': 'service_type required'}), 400
    sid = chat_history.create_session(stype)
    return jsonify({'success': True, 'session': chat_history.get_session(sid)})

@app.route('/api/sessions/list')
def list_sessions():
    stype = request.args.get('service_type')
    sessions = list(chat_history.get_all_sessions(stype).values())
    sessions.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({'success': True, 'sessions': sessions})

@app.route('/api/sessions/<sid>')
def get_session(sid):
    s = chat_history.get_session(sid)
    if not s: return jsonify({'error': 'Not found'}), 404
    return jsonify({'success': True, 'session': s})

@app.route('/api/sessions/<sid>', methods=['DELETE'])
def delete_session(sid):
    ok = chat_history.delete_session(sid)
    return jsonify({'success': ok}) if ok else (jsonify({'error': 'Not found'}), 404)

@app.route('/api/sessions/clear', methods=['POST'])
def clear_sessions():
    chat_history.clear_all_history()
    return jsonify({'success': True})

# ===== IMAGE GENERATION =====
def generate_image(prompt):
    try:
        url = 'http://de3.bot-hosting.net:21007/kilwa-img?text=' + requests.utils.quote(prompt.strip())
        print('[ImageGen] Calling:', url)
        r = requests.get(url, timeout=180)
        r.encoding = 'utf-8'
        print('[ImageGen] Status:', r.status_code)
        if r.status_code == 200:
            d = r.json()
            print('[ImageGen] Response keys:', list(d.keys()))
            img_url = d.get('image_url', '')
            print('[ImageGen] Full URL:', img_url)
            if d.get('status') == 'success' and img_url:
                return {'success': True, 'url': img_url}
            return {'success': False, 'error': d.get('error', 'No image URL in response')}
        return {'success': False, 'error': 'HTTP ' + str(r.status_code)}
    except Exception as e:
        print('[ImageGen] Exception:', e)
        return {'success': False, 'error': str(e)}

def is_image_request(msg):
    kws = ['create image','generate image','make image','draw image','create picture',
           'generate picture','make picture','draw picture','show me image','i want image',
           'give me image','generate photo','create photo','make photo','create artwork',
           'generate art','make art','image of','picture of','photo of','draw me','draw a ']
    return any(k in msg.lower() for k in kws)

def extract_prompt(msg):
    p = re.sub(r'(?:create|generate|make|draw|show me|i want|give me)\s+(?:an?\s+)?(?:image|picture|photo|artwork|art)\s+(?:of\s+)?', '', msg, flags=re.IGNORECASE)
    p = re.sub(r'^(?:create|generate|make|draw)\s+(?:an?\s+)?', '', p, flags=re.IGNORECASE)
    return p.strip() or msg.strip()

# ===== NUMGO =====
def numgo_lookup(number):
    try:
        num = re.sub(r'[^\d]', '', number)[-10:]
        r = requests.get('https://darkie.x10.mx/numapi.php?action=api&key=Ajay&number=' + num, timeout=30)
        r.encoding = 'utf-8'
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print('[NumGo] Error:', e)
    return None

# ===== ENCODE IMAGE =====
def encode_image(path):
    try:
        real_path = path.replace('/static/', 'static/')
        with open(real_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        print('[Vision] Error:', e)
        return None

# ===== CHAT SEND =====
@app.route('/api/chat/send', methods=['POST'])
def send_message():
    sid = request.form.get('session_id', '').strip()
    msg = request.form.get('message', '').strip()
    if not sid or not msg:
        return jsonify({'error': 'session_id and message required'}), 400
    session = chat_history.get_session(sid)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Handle image upload
    img_url = None
    if 'image' in request.files:
        f = request.files['image']
        if f and f.filename:
            img_url = save_uploaded_file(f)

    chat_history.add_message(sid, 'user', msg, img_url)

    stype = session['service_type']
    system_prompt = SYSTEM_PROMPTS.get(stype, SYSTEM_PROMPTS['default'])
    model = Config.MODELS.get(stype, Config.MODELS['default'])

    # Build messages list
    messages = [{'role': 'system', 'content': system_prompt}]
    for m in session['messages']:
        content = m['content']
        if m.get('image_url') and m['role'] == 'user' and stype in ('study-mate', 'college-mate'):
            model = Config.VISION_MODEL
            b64 = encode_image(m['image_url'])
            if b64:
                messages.append({'role': 'user', 'content': [
                    {'type': 'text', 'text': content},
                    {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + b64}}
                ]})
                continue
        messages.append({'role': m['role'], 'content': content})

    # --- Image generation (study-mate) ---
    if stype == 'study-mate' and is_image_request(msg):
        prompt = extract_prompt(msg)
        print('[App] Image gen request:', prompt)
        result = generate_image(prompt)
        if result['success']:
            # Use HTML img tag instead of markdown to avoid URL encoding issues with & params
            img_html = '<img src="' + result['url'] + '" alt="Generated image" style="max-width:100%;border-radius:10px;margin:8px 0;">'
            inject = (
                'IMAGE_GENERATED_SUCCESS\n'
                'The user asked for an image. It was generated. '
                'Tell the user the image is shown above in a brief friendly message (1-2 sentences max). '
                'Do NOT describe it in detail. Do NOT use markdown image syntax. '
                'The frontend will handle displaying the image.\n'
                'IMAGE_URL:' + result['url']
            )
        else:
            inject = 'IMAGE_FAILED: ' + result.get('error', 'unknown') + '. Tell the user image generation failed and suggest trying again with a simpler description.'
        messages.append({'role': 'system', 'content': inject})

    # --- Phone lookup (study-mate) ---
    elif stype == 'study-mate':
        nums = re.findall(r'[6-9]\d{9}', msg)
        if nums and any(k in msg.lower() for k in ('number', 'find', 'lookup', 'mobile', 'phone', 'search')):
            data = numgo_lookup(nums[0])
            if isinstance(data, list) and data:
                lines = ['Phone info for ' + nums[0] + ':']
                for i, rec in enumerate(data, 1):
                    addr = str(rec.get('address', 'N/A')).replace('!!', ', ').replace('!', ', ')
                    lines.append('Record ' + str(i) + ': Name=' + str(rec.get('name', 'N/A')) +
                                 ', Mobile=' + str(rec.get('mobile', 'N/A')) +
                                 ', Address=' + addr)
                messages.append({'role': 'system', 'content': '\n'.join(lines) + '\nPresent this info clearly.'})
            else:
                messages.append({'role': 'system', 'content': 'No info found for ' + nums[0] + '. Inform user politely.'})

    # Check if image was generated — send image URL separately to frontend
    img_gen_url = None
    for m in messages:
        if isinstance(m.get('content'), str) and m['content'].startswith('IMAGE_GENERATED_SUCCESS'):
            # extract url
            match = re.search(r'IMAGE_URL:(.+)', m['content'])
            if match:
                img_gen_url = match.group(1).strip()

    return Response(
        stream_with_context(stream_response(sid, messages, model, img_gen_url)),
        mimetype='text/event-stream; charset=utf-8',
        headers={
            'Cache-Control': 'no-cache, no-store',
            'X-Accel-Buffering': 'no',
            'Transfer-Encoding': 'chunked'
        }
    )


def stream_response(sid, messages, model, img_gen_url=None):
    # If we have a generated image, send it first as a special event
    if img_gen_url:
        yield 'data: ' + json.dumps({'image_url': img_gen_url}, ensure_ascii=False) + '\n\n'

    headers = {
        'Authorization': 'Bearer ' + Config.OPENROUTER_API_KEY,
        'Content-Type': 'application/json; charset=utf-8',
        'HTTP-Referer': 'https://helpinghub.local',
        'X-Title': 'HelpingHub'
    }
    payload = {
        'model': model,
        'messages': messages,
        'temperature': 0.8,
        'stream': True
    }
    full = ''
    try:
        with requests.post(Config.OPENROUTER_URL, headers=headers, json=payload,
                           stream=True, timeout=90) as r:
            r.encoding = 'utf-8'
            if r.status_code != 200:
                err = 'API error ' + str(r.status_code)
                print('[Stream] Error:', err, r.text[:300])
                yield 'data: ' + json.dumps({'error': err}) + '\n\n'
                return

            for raw_line in r.iter_lines():
                if raw_line is None:
                    continue
                # Decode bytes explicitly as utf-8
                if isinstance(raw_line, bytes):
                    line = raw_line.decode('utf-8', errors='replace').strip()
                else:
                    line = raw_line.strip()

                if not line or not line.startswith('data: '):
                    continue
                raw = line[6:]
                if raw == '[DONE]':
                    chat_history.add_message(sid, 'assistant', full)
                    yield 'data: ' + json.dumps({'done': True}) + '\n\n'
                    return
                try:
                    obj = json.loads(raw)
                    delta = obj.get('choices', [{}])[0].get('delta', {}).get('content')
                    if delta:
                        full += delta
                        # Send as JSON — json.dumps handles unicode correctly
                        yield 'data: ' + json.dumps({'content': delta}, ensure_ascii=False) + '\n\n'
                except (json.JSONDecodeError, IndexError, KeyError):
                    pass

        if full:
            chat_history.add_message(sid, 'assistant', full)
            yield 'data: ' + json.dumps({'done': True}) + '\n\n'

    except Exception as e:
        print('[Stream] Exception:', type(e).__name__, str(e))
        yield 'data: ' + json.dumps({'error': str(e)}) + '\n\n'


# ===== TOOLS =====
@app.route('/api/tools/downloader', methods=['POST'])
def downloader():
    url = (request.json or {}).get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL required'}), 400
    try:
        r = requests.get('https://apis.prexzyvilla.site/download/aio?url=' + url, timeout=30)
        r.encoding = 'utf-8'
        return jsonify(r.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
