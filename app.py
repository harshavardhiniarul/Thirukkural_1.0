"""
Flask Backend for Thirukkural Tamil Commentary Application
A simple, clean REST API that serves Thirukkural data
"""
from flask import Flask, jsonify, send_file, send_from_directory
from flask_cors import CORS
import requests
import random
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Data URLs from official GitHub repository
KURAL_DATA_URL = "https://raw.githubusercontent.com/tk120404/thirukkural/master/thirukkural.json"
DETAIL_DATA_URL = "https://raw.githubusercontent.com/tk120404/thirukkural/master/detail.json"

# Global cache
kural_cache = None
detail_cache = None


def load_kural_data():
    """Load and cache kural data from GitHub"""
    global kural_cache
    if kural_cache is not None:
        return kural_cache
    
    try:
        print("Fetching kural data from GitHub...")
        response = requests.get(KURAL_DATA_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Handle different data formats
        if isinstance(data, dict) and 'kural' in data:
            kural_cache = data['kural']
        elif isinstance(data, list):
            kural_cache = data
        else:
            kural_cache = []
            
        print(f"Loaded {len(kural_cache)} kurals")
        return kural_cache
    except Exception as e:
        print(f"Error loading kural data: {e}")
        return None


def load_detail_data():
    """Load and cache detail data from GitHub"""
    global detail_cache
    if detail_cache is not None:
        return detail_cache
    
    try:
        print("Fetching detail data from GitHub...")
        response = requests.get(DETAIL_DATA_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Handle different data formats
        if isinstance(data, list):
            detail_cache = data
        elif isinstance(data, dict):
            detail_cache = data
        else:
            detail_cache = []
            
        print("Detail data loaded successfully")
        return detail_cache
    except Exception as e:
        print(f"Error loading detail data: {e}")
        return None


def get_chapter_info(kural_number, detail_data):
    """Extract chapter info for a specific kural number"""
    if not detail_data:
        return {"paal": "-", "iyal": "-", "adhikaram": "-"}
    
    try:
        # Handle the actual detail.json structure from GitHub
        # Structure: { "value": [{ "section": { "detail": [...] } }] }
        
        # Try to get the first element if it's wrapped in "value"
        data = detail_data
        if isinstance(detail_data, dict) and 'value' in detail_data:
            data = detail_data.get('value', [])
        
        if isinstance(data, list) and len(data) > 0:
            root = data[0]
            
            # Navigate to sections
            if isinstance(root, dict):
                section_data = root.get('section', {}).get('detail', [])
                
                # Loop through sections (paals)
                for section in section_data:
                    if isinstance(section, dict):
                        paal_name = section.get('name', '-') or section.get('tamil', '-')
                        
                        # Get chapter groups (iyals)
                        chapter_group = section.get('chapterGroup', {})
                        if isinstance(chapter_group, dict):
                            iyals = chapter_group.get('detail', [])
                            
                            # Loop through iyals
                            for iyal in iyals:
                                if isinstance(iyal, dict):
                                    iyal_name = iyal.get('name', '-') or iyal.get('tamil', '-')
                                    
                                    # Get chapters (adhikarams)
                                    chapters = iyal.get('chapters', {})
                                    if isinstance(chapters, dict):
                                        adhikarams = chapters.get('detail', [])
                                        
                                        # Find the adhikaram for this kural
                                        for adhikaram in adhikarams:
                                            if isinstance(adhikaram, dict):
                                                start = adhikaram.get('start')
                                                end = adhikaram.get('end')
                                                
                                                if start and end and start <= kural_number <= end:
                                                    adhikaram_name = adhikaram.get('name', '-') or adhikaram.get('tamil', '-')
                                                    return {
                                                        "paal": paal_name,
                                                        "iyal": iyal_name,
                                                        "adhikaram": adhikaram_name
                                                    }
    except Exception as e:
        print(f"Error extracting chapter info: {e}")
    
    return {"paal": "-", "iyal": "-", "adhikaram": "-"}


@app.route('/', methods=['GET'])
def serve_index():
    """Serve the index.html file"""
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/api/kural/<int:kural_number>', methods=['GET'])
def get_kural(kural_number):
    """
    Get a specific kural by number
    GET /api/kural/1
    """
    # Validate input
    if not (1 <= kural_number <= 1330):
        return jsonify({
            "success": False,
            "message": f"குறள் எண் 1 முதல் 1330 வரை இருக்க வேண்டும்"
        }), 400
    
    # Load kural data
    kural_data = load_kural_data()
    if not kural_data:
        return jsonify({
            "success": False,
            "message": "தரவை பெற முடியவில்லை"
        }), 500
    
    # Find the kural
    kural = None
    for k in kural_data:
        if k.get('Number') == kural_number:
            kural = k
            break
    
    if not kural:
        return jsonify({
            "success": False,
            "message": f"குறள் எண் {kural_number} கிடைக்கவில்லை"
        }), 404
    
    # Load detail data and enrich
    detail_data = load_detail_data()
    chapter_info = get_chapter_info(kural_number, detail_data)
    
    # Create response
    response_data = {
        "success": True,
        "data": {
            "Number": kural.get('Number'),
            "Line1": kural.get('Line1'),
            "Line2": kural.get('Line2'),
            "mv": kural.get('mv'),
            "sp": kural.get('sp'),
            "mk": kural.get('mk'),
            "paal": chapter_info.get('paal'),
            "iyal": chapter_info.get('iyal'),
            "adhikaram": chapter_info.get('adhikaram')
        }
    }
    
    return jsonify(response_data), 200


@app.route('/api/random-kural', methods=['GET'])
def get_random_kural():
    """Get a random kural"""
    # Load kural data
    kural_data = load_kural_data()
    if not kural_data:
        return jsonify({
            "success": False,
            "message": "தரவை பெற முடியவில்லை"
        }), 500
    
    # Pick random kural
    kural = random.choice(kural_data)
    kural_number = kural.get('Number')
    
    # Load detail data and enrich
    detail_data = load_detail_data()
    chapter_info = get_chapter_info(kural_number, detail_data)
    
    # Create response
    response_data = {
        "success": True,
        "data": {
            "Number": kural.get('Number'),
            "Line1": kural.get('Line1'),
            "Line2": kural.get('Line2'),
            "mv": kural.get('mv'),
            "sp": kural.get('sp'),
            "mk": kural.get('mk'),
            "paal": chapter_info.get('paal'),
            "iyal": chapter_info.get('iyal'),
            "adhikaram": chapter_info.get('adhikaram')
        }
    }
    
    return jsonify(response_data), 200


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Thirukkural Backend API is running"
    }), 200


@app.route('/<path:filename>', methods=['GET'])
def serve_files(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory(BASE_DIR, filename)


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "message": "API endpoint not found"
    }), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500


if __name__ == '__main__':
    print("=" * 50)
    print("Thirukkural Flask Backend")
    print("=" * 50)
    print("Starting server on http://127.0.0.1:5000")
    print("Press CTRL+C to quit")
    print("=" * 50)
    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
