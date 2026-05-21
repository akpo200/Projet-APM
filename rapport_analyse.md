# Rapport d'Analyse : Détection d'anomalies dans les performances applicatives (APM)
**Copyright par Pascale Nancy Alia AKPO**

## 1. Introduction
Ce projet répond à la problématique métier de la détection automatique des anomalies de performance applicative. L'objectif est de surveiller en temps réel un système en s'appuyant sur l'analyse de logs HDFS, en simulant un environnement de streaming.

## 2. Architecture du Pipeline
L'architecture est entièrement conteneurisée via Docker pour garantir la portabilité et la facilité de déploiement. Elle est composée des éléments suivants :

- **Producer (Python)** : Télécharge le dataset public HDFS_2k.log et simule un flux de données en temps réel en envoyant les logs ligne par ligne vers Kafka.
- **Message Broker (Kafka & Zookeeper)** : Centralise les messages entrants. Kafka est utilisé pour découpler la production de la consommation des logs.
- **Analyse Machine Learning (Spark Structured Streaming)** : Consomme les événements depuis Kafka en micro-batchs (5 secondes). Pour chaque batch, des features sont extraites (volume de log, longueur moyenne) et un modèle **Isolation Forest** de `scikit-learn` est entraîné sur une fenêtre glissante afin de calculer un score d'anomalie.
- **Metrics Push (Prometheus Pushgateway)** : Spark transmet les métriques métier et ML (volume, score d'anomalie, état d'anomalie) au Pushgateway.
- **Stockage & Visualisation (Prometheus & Grafana)** : Prometheus récupère les métriques depuis le Pushgateway, et Grafana offre une interface visuelle pour suivre les performances et alerter sur les anomalies détectées.

## 3. Choix Technologiques
- **Kafka** : Pour l'ingestion de flux de données massifs.
- **PySpark** :Pour démontrer la capacité à traiter de larges volumes de données en flux (Structured Streaming).
- **Isolation Forest** : Algorithme non supervisé efficace pour la détection d'anomalies multidimensionnelles, adapté aux métriques APM.
- **Prometheus/Grafana** : La stack pour le monitoring et l'alerting.

## 4. Instructions de lancement
Pour lancer le projet, exécutez la commande suivante à la racine du dossier (ouvrez préalablement docker) :
```bash
docker-compose up -d --build
```
- **Grafana** est accessible sur : `http://localhost:3000` 
- **Prometheus** est accessible sur : `http://localhost:9090`

##  Conclusion
Ce pipeline permet non seulement de visualiser l'état du système, mais aussi de détecter proactivement des comportements inhabituels grâce au Machine Learning en temps réel.
