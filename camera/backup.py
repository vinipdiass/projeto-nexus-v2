from collections import Counter
from ultralytics import YOLO
import cv2

# Carrega o modelo
model = YOLO("yolov8n.pt")

# Define o mapeamento de classe personalizada
class_mapping = {
    0: 'voluntario',
    16: 'cachorro',
    24: 'mochila',
    28: 'maleta',
    39: 'agua',
    46: 'banana',
    47: 'maca',
    48: 'sanduiche',
    49: 'tomate',
    51: 'salame',
    55: 'bolo',
    59: 'colchao',
    60: 'mesa',
    79: 'escova de dentes'
}

# Lista de cores para desenhar os retângulos
colors = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255),
    (255, 255, 0), (255, 0, 255), (0, 255, 255),
    (128, 0, 0), (0, 128, 0), (0, 0, 128),
    (128, 128, 0), (128, 0, 128), (0, 128, 128)
]

# Inicia a captura de vídeo da webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Erro ao acessar a webcam")
    exit()

# Abre o arquivo para gravação
file = open("detections.txt", "w", encoding='utf-8')

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
            counts_str = ', '.join([f"{count} {name}" for name, count in counts.items()])

            # Registrar os resultados no arquivo
            info = f"Detecções: {len(result.boxes)} classes detectadas, {counts_str}, Tempo de inferência: {result.speed['inference']}ms\n"

            # Volta para o início do arquivo e escreve a nova informação
            file.seek(0)
            file.write(info)
            file.truncate()  # Remove o conteúdo restante se o novo conteúdo for menor
            file.flush()

            # Exibe o frame com os resultados
            cv2.imshow('frame', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

# Libera os recursos
cap.release()
cv2.destroyAllWindows()
file.close()