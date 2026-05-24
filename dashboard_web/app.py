# Copyright par Pascale Nancy Alia AKPO
# Serveur Flask pour le dashboard web interactif APM

import os
import time
import threading
from collections import deque
import requests
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='static')

# Désactive le cache du navigateur pour assurer la synchronisation en temps réel
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# Configuration
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://prometheus:9090")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:29092")
TOPIC = "apm-metrics"

# Stockage en mémoire
PRODUCER_CONFIG = {
    "delay": 0.1,    # délai en secondes entre chaque log
    "paused": False   # pause/reprise de la simulation
}

ANOMALY_TYPE = "Aucune"

# Garde les 50 derniers logs reçus
recent_logs = deque(maxlen=50)

def kafka_consumer_thread():
    """Consomme les logs depuis Kafka en arrière-plan pour l'affichage temps réel."""
    from kafka import KafkaConsumer
    
    print("Démarrage du consommateur Kafka en arrière-plan...")
    consumer = None
    
    # Tentatives de connexion à Kafka
    while consumer is None:
        try:
            consumer = KafkaConsumer(
                TOPIC,
                bootstrap_servers=[KAFKA_BROKER],
                auto_offset_reset='latest',
                value_deserializer=lambda x: x.decode('utf-8', errors='ignore')
            )
            print("Consommateur Kafka connecté avec succès !")
        except Exception as e:
            print(f"Attente de Kafka ({KAFKA_BROKER})... Erreur: {e}")
            time.sleep(5)
            
    try:
        for message in consumer:
            recent_logs.append({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "log": message.value.strip()
            })
    except Exception as e:
        print(f"Erreur dans la boucle de consommation Kafka: {e}")

# Lance le thread de consommation Kafka
threading.Thread(target=kafka_consumer_thread, daemon=True).start()

# --- ENDPOINTS API ---

@app.route('/')
def index():
    """Sert l'interface utilisateur principale."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def send_static(path):
    """Sert les fichiers statiques (CSS, JS)."""
    return send_from_directory(app.static_folder, path)

@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    """Gère la configuration de la vitesse de la simulation."""
    global PRODUCER_CONFIG
    if request.method == 'POST':
        data = request.json or {}
        if 'delay' in data:
            try:
                PRODUCER_CONFIG['delay'] = float(data['delay'])
            except ValueError:
                pass
        if 'paused' in data:
            PRODUCER_CONFIG['paused'] = bool(data['paused'])
        return jsonify({"status": "success", "config": PRODUCER_CONFIG})
    return jsonify(PRODUCER_CONFIG)

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Renvoie les derniers logs capturés."""
    return jsonify(list(recent_logs))

@app.route('/api/metrics/realtime', methods=['GET'])
def get_realtime_metrics():
    """Récupère les dernières valeurs de métriques depuis Prometheus."""
    metrics = {
        "log_count": 0,
        "anomaly_score": 0.0,
        "is_anomaly": 0
    }
    
    queries = {
        "log_count": "apm_log_count",
        "anomaly_score": "apm_anomaly_score",
        "is_anomaly": "apm_is_anomaly"
    }
    
    for key, query in queries.items():
        try:
            response = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={"query": query}, timeout=2)
            if response.status_code == 200:
                res_data = response.json()
                results = res_data.get("data", {}).get("result", [])
                if results:
                    metrics[key] = float(results[0]["value"][1])
        except Exception as e:
            # En cas d'erreur de Prometheus, on renvoie les valeurs par défaut
            pass
            
    metrics["anomaly_type"] = ANOMALY_TYPE
    return jsonify(metrics)

@app.route('/api/metrics/history', methods=['GET'])
def get_history_metrics():
    """Récupère l'historique des métriques sur une durée choisie (en secondes)."""
    end_time = time.time()
    
    # Récupère le paramètre de durée (par défaut 300 secondes = 5 minutes)
    try:
        duration = int(request.args.get("duration", 300))
    except ValueError:
        duration = 300
        
    start_time = end_time - duration
    
    # Calcul dynamique du pas (step) pour avoir environ 60 points sur le graphique
    step_val = max(5, duration // 60)
    step = f"{step_val}s"
    
    queries = {
        "log_count": "apm_log_count",
        "anomaly_score": "apm_anomaly_score",
        "is_anomaly": "apm_is_anomaly"
    }
    
    history_data = {
        "timestamps": [],
        "log_count": [],
        "anomaly_score": [],
        "is_anomaly": []
    }
    
    # Récupère l'historique pour dessiner des graphiques continus
    for key, query in queries.items():
        try:
            response = requests.get(f"{PROMETHEUS_URL}/api/v1/query_range", params={
                "query": query,
                "start": start_time,
                "end": end_time,
                "step": step
            }, timeout=3)
            
            if response.status_code == 200:
                res_data = response.json()
                results = res_data.get("data", {}).get("result", [])
                if results:
                    values = results[0].get("values", [])
                    # Remplir les timestamps une seule fois
                    if not history_data["timestamps"]:
                        history_data["timestamps"] = [v[0] for v in values]
                    
                    history_data[key] = [float(v[1]) for v in values]
        except Exception as e:
            pass
            
    # S'assurer que les listes ont la même taille
    length = len(history_data["timestamps"])
    for k in ["log_count", "anomaly_score", "is_anomaly"]:
        if len(history_data[k]) < length:
            history_data[k] = [0.0] * length
            
    return jsonify(history_data)

@app.route('/api/anomaly-type', methods=['GET', 'POST'])
def handle_anomaly_type():
    """Gère le type d'anomalie spécifique détecté par Spark."""
    global ANOMALY_TYPE
    if request.method == 'POST':
        data = request.json or {}
        ANOMALY_TYPE = data.get("type", "Aucune")
        return jsonify({"status": "success", "anomaly_type": ANOMALY_TYPE})
    return jsonify({"anomaly_type": ANOMALY_TYPE})

if __name__ == '__main__':
    # Écoute sur le port 8080
    app.run(host='0.0.0.0', port=8080, debug=False)
