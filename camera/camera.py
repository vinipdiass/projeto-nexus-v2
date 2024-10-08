from collections import Counter
from ultralytics import YOLO
import cv2
import os
from flask import Flask, render_template, Response
from flask_cors import CORS  # Importa o CORS

app = Flask(__name__)
CORS(app)  # Habilita o CORS

# Carrega o modelo
model = YOLO("yolov8n.pt")

# Define o mapeamento de classe personalizada
class_mapping = {
    # ... (seu mapeamento de classes aqui)
    0: 'abrigado',
    1: 'bicicleta',
    # Continue com o restante das classes...
    79: 'escova de dentes'
}

# Lista de cores para desenhar os retângulos
colors = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255),
    (255, 255, 0), (255, 0, 255), (0, 255, 255),
    (128, 0, 0), (0, 128, 0), (0, 0, 128),
    (128, 128, 0), (128, 0, 128), (0, 128, 128)
]

# Define o caminho do arquivo de saída
script_dir = os.path.dirname(os.path.realpath(__file__))
output_path = os.path.join(script_dir, 'detections.txt')

def gen_frames():
    # Inicia a captura de vídeo da webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Erro ao acessar a webcam")
        exit()

    try:
        # Abre o arquivo para gravação
        with open(output_path, "w", encoding='utf-8') as file:
            # Processa cada frame da webcam
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Falha ao capturar frame da webcam")
                    break

                # Detectar os objetos
                results = model.track(frame, persist=True)

                # Substituir os rótulos de classe conforme necessário
                for result in results:
                    if hasattr(result, 'boxes'):
                        mapped_names = []
                        for box in result.boxes:
                            class_id = int(box.cls.item())  # Converte o tensor para inteiro
                            class_name = class_mapping.get(class_id, f'classe_{class_id}')
                            mapped_names.append(class_name)

                            # Desenhar o rótulo mapeado no frame com grau de certeza
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            confidence = box.conf.item()  # Grau de certeza
                            label = f"{class_name} ({confidence:.2f})"

                            # Seleciona uma cor para a classe detectada
                            color = colors[class_id % len(colors)]
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

                        # Contar as ocorrências de cada classe detectada
                        counts = Counter(mapped_names)
                        counts_str = '\n'.join([f"{count} {name}" for name, count in counts.items()])

                        # Registrar os resultados no arquivo
                        info = f"{counts_str}\n"

                        # Volta para o início do arquivo e escreve a nova informação
                        file.seek(0)
                        file.write(info)
                        file.truncate()  # Remove o conteúdo restante se o novo conteúdo for menor
                        file.flush()

                # Codifica o frame em JPEG
                ret, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()

                # Usa o yield para criar um fluxo de bytes
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    except Exception as e:
        print(f"Erro durante a execução do script: {e}")
    finally:
        # Libera os recursos
        cap.release()

@app.route('/video_feed')
def video_feed():
    # Rota para o streaming de vídeo
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    # Página principal que exibe o vídeo
    return render_template('cameras.html')

if __name__ == '__main__':
    # Inicia o servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
