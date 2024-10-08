from collections import Counter
from ultralytics import YOLO
import cv2
import os
from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Carrega o modelo
model = YOLO("yolov8n.pt")

# Define o mapeamento de classe personalizada
class_mapping = {
    0: 'pessoa',                # person
    1: 'bicicleta',             # bicycle
    2: 'carro',                 # car
    3: 'motocicleta',           # motorcycle
    4: 'aviao',                 # airplane
    5: 'onibus',                # bus
    6: 'trem',                  # train
    7: 'caminhao',              # truck
    8: 'barco',                 # boat
    9: 'semaforo',              # traffic light
    10: 'hidrante',             # fire hydrant
    11: 'placa de pare',        # stop sign
    12: 'parquimetro',          # parking meter
    13: 'banco',                # bench
    14: 'passaro',              # bird
    15: 'gato',                 # cat
    16: 'cachorro',             # dog
    17: 'cavalo',               # horse
    18: 'ovelha',               # sheep
    19: 'vaca',                 # cow
    20: 'elefante',             # elephant
    21: 'urso',                 # bear
    22: 'zebra',                # zebra
    23: 'girafa',               # giraffe
    24: 'mochila',              # backpack
    25: 'guarda-chuva',         # umbrella
    26: 'bolsa',                # handbag
    27: 'gravata',              # tie
    28: 'maleta',               # suitcase
    29: 'frisbee',              # frisbee
    30: 'esquis',               # skis
    31: 'snowboard',            # snowboard
    32: 'bola de esporte',      # sports ball
    33: 'pipa',                 # kite
    34: 'bastao de beisebol',   # baseball bat
    35: 'luva de beisebol',     # baseball glove
    36: 'skateboard',           # skateboard
    37: 'prancha de surf',      # surfboard
    38: 'raquete de tenis',     # tennis racket
    39: 'agua',                 # bottle
    40: 'taca de vinho',        # wine glass
    41: 'copo',                 # cup
    42: 'garfo',                # fork
    43: 'faca',                 # knife
    44: 'colher',               # spoon
    45: 'tigela',               # bowl
    46: 'banana',               # banana
    47: 'maca',                 # apple
    48: 'sanduiche',            # sandwich
    49: 'tomate',               # orange
    50: 'brocolis',             # broccoli
    51: 'salame',               # carrot
    52: 'cachorro-quente',      # hot dog
    53: 'pizza',                # pizza
    54: 'rosquinha',            # donut
    55: 'bolo',                 # cake
    56: 'cadeira',              # chair
    57: 'sofa',                 # couch
    58: 'planta em vaso',       # potted plant
    59: 'colchao',              # bed
    60: 'mesa',                 # dining table
    61: 'banheiro',             # toilet
    62: 'tv',                   # tv
    63: 'laptop',               # laptop
    64: 'mouse',                # mouse
    65: 'controle remoto',      # remote
    66: 'teclado',              # keyboard
    67: 'celular',              # cell phone
    68: 'micro-ondas',          # microwave
    69: 'forno',                # oven
    70: 'torradeira',           # toaster
    71: 'pia',                  # sink
    72: 'geladeira',            # refrigerator
    73: 'livro',                # book
    74: 'relogio',              # clock
    75: 'vaso',                 # vase
    76: 'tesoura',              # scissors
    77: 'ursinho de pelucia',   # teddy bear
    78: 'secador de cabelo',    # hair drier
    79: 'escova de dentes'      # toothbrush
}

# Lista de cores para desenhar os retângulos
colors = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255),
    (255, 255, 0), (255, 0, 255), (0, 255, 255),
    (128, 0, 0), (0, 128, 0), (0, 0, 128),
    (128, 128, 0), (128, 0, 128), (0, 128, 128)
]

# Variável global para armazenar as últimas detecções
latest_detections = ""

def gen_frames():
    global latest_detections
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Erro ao acessar a webcam")
        exit()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Falha ao capturar frame da webcam")
                break

            # Detectar os objetos
            results = model.track(frame, persist=True)
            mapped_names = []
            for result in results:
                if hasattr(result, 'boxes'):
                    for box in result.boxes:
                        class_id = int(box.cls.item())
                        class_name = class_mapping.get(class_id, f'classe_{class_id}')
                        mapped_names.append(class_name)

                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        confidence = box.conf.item()
                        label = f"{class_name} ({confidence:.2f})"

                        color = colors[class_id % len(colors)]
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

            # Contar as ocorrências de cada classe detectada
            counts = Counter(mapped_names)
            counts_str = ', '.join([f"{count} {name}" for name, count in counts.items()])

            # Atualiza as últimas detecções
            latest_detections = counts_str

            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    except Exception as e:
        print(f"Erro durante a execução do script: {e}")
    finally:
        cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detections')
def detections():
    return jsonify({"detections": latest_detections})

@app.route('/')
def index():
    return render_template('cameras.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
