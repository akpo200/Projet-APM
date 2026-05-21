# Copyright par Pascale Nancy Alia AKPO

import os
import time
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, split, length
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway
from sklearn.ensemble import IsolationForest

# Configuration
KAFKA_BROKER = "kafka:29092"
TOPIC = "apm-metrics"
PUSHGATEWAY_URL = "pushgateway:9091"

# Registre Prometheus
registry = CollectorRegistry()
g_log_count = Gauge('apm_log_count', 'Total de logs dans le batch', registry=registry)
g_anomaly_score = Gauge('apm_anomaly_score', 'Score d anomalie détecté par ML', registry=registry)
g_is_anomaly = Gauge('apm_is_anomaly', '1 si une anomalie est détectée, 0 sinon', registry=registry)

# Buffer global pour stocker un peu d'historique et entrainer l'Isolation Forest
history_buffer = []

def process_batch(df, epoch_id):
    """Fonction appelée pour chaque micro-batch de streaming."""
    # Convertit le batch en DataFrame Pandas pour l'analyse ML
    pdf = df.toPandas()
    
    if pdf.empty:
        return
    
    # Extraction de features simples :
    # 1. Nombre de logs dans ce batch
    log_count = len(pdf)
    # 2. Longueur moyenne des logs (comme feature arbitraire)
    avg_length = pdf['value'].str.len().mean() if 'value' in pdf.columns else 0
    
    features = [log_count, avg_length]
    history_buffer.append(features)
    
    # On garde les 50 derniers batchs en mémoire pour entrainer le modèle
    if len(history_buffer) > 50:
        history_buffer.pop(0)
    
    # On met à jour les métriques de base
    g_log_count.set(log_count)
    
    # Analyse ML : Isolation Forest
    # On a besoin d'un peu de données pour entrainer le modèle
    is_anomaly = 0
    anomaly_score = 0.0
    
    if len(history_buffer) >= 5:
        # Entrainement sur l'historique récent
        model = IsolationForest(contamination=0.1, random_state=42)
        X = pd.DataFrame(history_buffer, columns=['log_count', 'avg_length'])
        model.fit(X)
        
        # Prédiction sur le batch actuel
        current_X = pd.DataFrame([features], columns=['log_count', 'avg_length'])
        prediction = model.predict(current_X)[0] # 1 pour normal, -1 pour anomalie
        anomaly_score = model.decision_function(current_X)[0]
        
        if prediction == -1:
            is_anomaly = 1
            print(f"Anomalie détectée ! Score : {anomaly_score}")
        else:
            print(f"Comportement normal. Score : {anomaly_score}")
            
    g_anomaly_score.set(anomaly_score)
    g_is_anomaly.set(is_anomaly)
    
    # Envoi des métriques vers Prometheus Pushgateway
    try:
        push_to_gateway(PUSHGATEWAY_URL, job='spark_ml_job', registry=registry)
        print(f"Batch {epoch_id} traité. Logs: {log_count}. Métriques envoyées.")
    except Exception as e:
        print(f"Erreur lors de l'envoi vers Pushgateway : {e}")

def main():
    # Attente pour s'assurer que Kafka est prêt
    time.sleep(30)
    
    # Initialisation de la session Spark avec le package Kafka
    spark = SparkSession.builder \
        .appName("APM_Anomaly_Detection") \
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1") \
        .getOrCreate()
    
    # Réduction des logs Spark pour plus de clarté
    spark.sparkContext.setLogLevel("WARN")
    
    print("Connexion à Kafka...")
    
    # Lecture du flux depuis Kafka
    df = spark \
        .readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BROKER) \
        .option("subscribe", TOPIC) \
        .option("startingOffsets", "latest") \
        .load()
    
    # Cast de la valeur binaire en chaine de caractères
    logs_df = df.selectExpr("CAST(value AS STRING)")
    
    # Traitement des batchs
    query = logs_df.writeStream \
        .foreachBatch(process_batch) \
        .trigger(processingTime='5 seconds') \
        .start()
    
    query.awaitTermination()

if __name__ == "__main__":
    main()
