# Copyright par Pascale Nancy Alia AKPO

import os
import time
import urllib.request
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = 'kafka:29092'
TOPIC = 'apm-metrics'
DATA_URL = 'https://raw.githubusercontent.com/logpai/loghub/master/HDFS/HDFS_2k.log'
DATA_FILE = 'HDFS_2k.log'

def download_data():
    """Télécharge le fichier de logs si nécessaire."""
    if not os.path.exists(DATA_FILE):
        print("Téléchargement du fichier de logs...")
        urllib.request.urlretrieve(DATA_URL, DATA_FILE)
        print("Téléchargement terminé.")

def stream_logs():
    """Lit le fichier et envoie chaque ligne à Kafka pour simuler un flux."""
    # Attend que Kafka soit prêt
    time.sleep(20)
    
    producer = KafkaProducer(bootstrap_servers=[KAFKA_BROKER])
    
    print("Début du streaming vers Kafka...")
    while True:
        with open(DATA_FILE, 'r') as file:
            for line in file:
                # Envoie la ligne de log encodée en utf-8
                producer.send(TOPIC, value=line.encode('utf-8'))
                # Simule un petit délai entre les logs
                time.sleep(0.1)
        print("Fin du fichier, on recommence pour simuler un flux continu.")

if __name__ == "__main__":
    download_data()
    stream_logs()
