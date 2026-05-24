# Copyright par Pascale Nancy Alia AKPO
# Producteur Kafka avec vitesse de streaming dynamique ajustable

import os
import time
import urllib.request
import requests
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = 'kafka:29092'
TOPIC = 'apm-metrics'
DATA_URL = 'https://raw.githubusercontent.com/logpai/loghub/master/HDFS/HDFS_2k.log'
DATA_FILE = 'HDFS_2k.log'
DASHBOARD_URL = 'http://dashboard-web:8080/api/config'

def download_data():
    """Télécharge le fichier de logs si nécessaire."""
    if not os.path.exists(DATA_FILE):
        print("Téléchargement du fichier de logs HDFS...")
        urllib.request.urlretrieve(DATA_URL, DATA_FILE)
        print("Téléchargement terminé.")

def stream_logs():
    """Lit le fichier et envoie chaque ligne à Kafka pour simuler un flux."""
    # Attend que Kafka soit prêt
    print("En attente du démarrage de Kafka...")
    time.sleep(20)
    
    producer = None
    while producer is None:
        try:
            producer = KafkaProducer(bootstrap_servers=[KAFKA_BROKER])
            print("Producteur Kafka connecté avec succès !")
        except Exception as e:
            print(f"Attente de Kafka... Erreur: {e}")
            time.sleep(5)
            
    print("Début du streaming vers Kafka...")
    
    # Variables de contrôle de vitesse
    last_config_check = 0.0
    config_check_interval = 2.0  # Vérifie la configuration toutes les 2 secondes
    current_delay = 0.1
    is_paused = False
    
    while True:
        with open(DATA_FILE, 'r') as file:
            for line in file:
                now = time.time()
                
                # Récupère périodiquement les configurations du dashboard
                if now - last_config_check > config_check_interval:
                    try:
                        response = requests.get(DASHBOARD_URL, timeout=1.5)
                        if response.status_code == 200:
                            config_data = response.json()
                            current_delay = float(config_data.get("delay", 0.1))
                            is_paused = bool(config_data.get("paused", False))
                        last_config_check = now
                    except Exception:
                        # En cas d'erreur de communication, on garde les valeurs par défaut
                        pass
                
                # Gestion de la pause de simulation
                while is_paused:
                    time.sleep(1.0)
                    try:
                        response = requests.get(DASHBOARD_URL, timeout=1.5)
                        if response.status_code == 200:
                            config_data = response.json()
                            is_paused = bool(config_data.get("paused", False))
                            current_delay = float(config_data.get("delay", 0.1))
                    except Exception:
                        pass
                    last_config_check = time.time()
                
                # Envoie la ligne de log encodée en utf-8
                producer.send(TOPIC, value=line.encode('utf-8'))
                
                # Simule un petit délai entre les logs (modifiable en direct par l'utilisateur)
                time.sleep(current_delay)
                
        print("Fin du fichier, on recommence pour simuler un flux continu.")

if __name__ == "__main__":
    download_data()
    stream_logs()
