# Copyright par Pascale Nancy Alia AKPO

# APM - Détection d'Anomalies de Performance Applicative

Ce projet implémente un pipeline complet de surveillance des performances applicatives (APM) avec détection d'anomalies en temps réel grâce à l'apprentissage automatique (Machine Learning).

## Architecture du Pipeline
Le flux de données est orchestré comme suit :
`Logs Applicatifs (HDFS) -> Producteur (Python) -> Kafka -> Spark Streaming -> Machine Learning (Isolation Forest) -> Prometheus -> Grafana`

## Prérequis
- Docker Desktop installé et démarré.

## Démarrage rapide
Pour lancer l'ensemble des services, exécutez la commande suivante à la racine du projet :
```bash
# Commande recommandée pour éviter les conflits d'accents sur Windows
$env:DOCKER_BUILDKIT=0
docker-compose up -d --build
```

Une fois lancé, attendez environ une minute, puis connectez-vous aux interfaces suivantes :
- **Grafana (Dashboard préconfiguré) :** [http://localhost:3000](http://localhost:3000) (Identifiants : `admin` / `admin`)
- **Prometheus :** [http://localhost:9090](http://localhost:9090)

Le rapport explicatif détaillé se trouve dans le fichier `rapport_analyse.md`.
