from flask import Flask, render_template, request, jsonify
import os
import base64
import io

from typing import Any, Dict, List

try:
    from PIL import Image
except ImportError:  # Pillow might not be installed in some environments
    Image = None  # type: ignore

_yolo_model = None  # lazy-loaded YOLO model

app = Flask(__name__)

ESP32_HOST = os.environ.get('ESP32_HOST', '192.168.0.100')
YOLO_MIN_CONF = float(os.environ.get('YOLO_MIN_CONF', '0.6'))

latest_result = {}

@app.route('/')
def index():
    # 쿼리 파라미터로 esp32url을 받으면 우선 사용, 없으면 환경변수/기본값 사용
    esp32_host = request.args.get('esp32url') or ESP32_HOST
    return render_template('index.html', esp32_host=esp32_host)

@app.route('/update_analysis', methods=['POST'])
def update_analysis():
    global latest_result
    latest_result = request.get_json()
    return jsonify({'status': 'success'})

@app.route('/latest_analysis', methods=['GET'])
def latest_analysis():
    return jsonify(latest_result)

def _load_yolo_model() -> Any:
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    # Try ultralytics first (preferred)
    try:
        from ultralytics import YOLO  # type: ignore
        weights_path = os.path.join(os.path.dirname(__file__), 'yolov5s.pt')
        if not os.path.exists(weights_path):
            # fallback to an alternative file name if provided
            alt_path = os.path.join(os.path.dirname(__file__), 'yolov5su.pt')
            weights_path = alt_path if os.path.exists(alt_path) else weights_path
        _yolo_model = YOLO(weights_path)
        return _yolo_model
    except Exception:
        pass

    # Fallback: torch hub (requires internet on first run unless cached locally)
    try:
        import torch  # type: ignore
        weights_path = os.path.join(os.path.dirname(__file__), 'yolov5s.pt')
        repo = 'ultralytics/yolov5'
        _yolo_model = torch.hub.load(repo, 'custom', path=weights_path, trust_repo=True)
        # Optional warm-up to reduce first-inference latency
        try:
            _ = _yolo_model(torch.zeros(1, 3, 640, 640))
        except Exception:
            pass
        return _yolo_model
    except Exception as e:
        raise RuntimeError(f"Failed to load YOLO model: {e}")

def _run_yolo_detection(img: Image.Image) -> List[Dict[str, Any]]:
    model = _load_yolo_model()
    # Prefer faster inference with reasonable defaults where supported
    try:
        results = model(img, verbose=False, conf=YOLO_MIN_CONF, iou=0.45)
    except Exception:
        results = model(img)
    detections: List[Dict[str, Any]] = []
    try:
        # ultralytics YOLO (v8) returns list with .boxes
        if hasattr(results, 'boxes') or (isinstance(results, list) and hasattr(results[0], 'boxes')):
            res = results[0] if isinstance(results, list) else results
            for b in res.boxes:  # type: ignore[attr-defined]
                xyxy = b.xyxy[0].tolist()  # [x1,y1,x2,y2]
                conf = float(b.conf[0].item())
                cls_id = int(b.cls[0].item())
                name = getattr(res, 'names', {}).get(cls_id, str(cls_id))
                if conf >= YOLO_MIN_CONF:
                    detections.append({
                        'bbox': [float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])],
                        'label': name,
                        'confidence': conf,
                    })
            return detections
    except Exception:
        pass

    # yolov5 torch hub format
    try:
        # results.xyxy[0] is Nx6 tensor: x1,y1,x2,y2,conf,cls
        xyxy = results.xyxy[0].tolist()  # type: ignore[attr-defined]
        names = results.names if hasattr(results, 'names') else {}  # type: ignore[attr-defined]
        for x1, y1, x2, y2, conf, cls_id in xyxy:
            label = names.get(int(cls_id), str(int(cls_id))) if isinstance(names, dict) else str(int(cls_id))
            if float(conf) >= YOLO_MIN_CONF:
                detections.append({
                    'bbox': [float(x1), float(y1), float(x2), float(y2)],
                    'label': label,
                    'confidence': float(conf),
                })
        return detections
    except Exception:
        return detections

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if Image is None:
            return jsonify({'error': 'Pillow not installed on server'}), 500
        body = request.get_json(force=True, silent=False) or {}
        b64 = body.get('image')
        if not b64:
            return jsonify({'error': 'image is required (base64 JPEG without prefix)'}), 400
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        detections = _run_yolo_detection(img)
        return jsonify({'detections': detections})
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {e}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 