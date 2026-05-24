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

## Mises à jour récentes
- Amélioration de l'interface Grafana et des requêtes Prometheus.
- Intégration d'un tableau de bord web (`dashboard_web`).
- Mise à jour des scripts de Machine Learning et du producteur de logs.
- Ajout du support pour la présentation de soutenance (`presentation_soutenance_apm.html`).
