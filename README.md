APM - Détection d'Anomalies de Performance Applicative par Pascale Nancy Alia AKPO

Ce projet implémente un pipeline complet de surveillance des performances applicatives (APM) avec détection d'anomalies en temps réel grâce à l'apprentissage automatique (Machine Learning).

Architecture du Pipeline
Le flux de données est orchestré comme suit : Logs Applicatifs (HDFS) -> Producteur (Python) -> Kafka -> Spark Streaming -> Machine Learning (Isolation Forest) -> Prometheus -> Grafana

Prérequis
Docker Desktop installé et démarré.
Grafana (Dashboard préconfiguré) : http://localhost:3000 
Prometheus : http://localhost:9090

Le rapport explicatif détaillé se trouve dans le fichier rapport_analyse.md.

Source des données: https://github.com/logpai/loghub/tree/master/HDFS
