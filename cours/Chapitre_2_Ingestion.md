# Chapitre 2 : L'ingestion de sources diverses (Fichiers, APIs, Agents)
**Copyright par Pascale Nancy Alia AKPO**

Ce chapitre explique comment capter les données depuis différentes sources pour les envoyer dans notre pipeline de streaming.

---

## 1. Les trois grandes méthodes d'ingestion

Dans les 8 projets de ton cours, les données proviennent de 3 sources principales :
1.  **Les fichiers plats (Logs HDFS, CSV, JSON) :** Lecture d'un fichier ligne par ligne pour simuler un flux (comme notre projet APM).
2.  **Les APIs Web (ex: Twitter API, API météo) :** Connexion à une URL pour récupérer des flux JSON en direct.
3.  **Les agents système (ex: Filebeat, Fluentd) :** Logiciels légers installés sur des serveurs qui lisent automatiquement les logs système et les envoient directement à Kafka.

---

## 2. Ingestion depuis un fichier plat (Exemple Python)

Voici comment lire un fichier local et l'envoyer à Kafka.

```python
# Import des bibliothèques nécessaires
from kafka import KafkaProducer
import time

# Connexion à Kafka
producer = KafkaProducer(bootstrap_servers=['localhost:9092'])

# Chemin du fichier de logs à lire
log_file_path = "app_logs.txt"

# Lecture du fichier ligne par ligne
with open(log_file_path, "r") as file:
    for line in file:
        # Envoi de la ligne
        producer.send("system-logs", value=line.encode('utf-8'))
        # Attente pour simuler le temps réel
        time.sleep(0.5)
```

---

## 3. Ingestion depuis une API (Exemple Twitter/X ou météo)

Les APIs envoient des données sous format JSON. Voici comment les récupérer et les envoyer dans Kafka.

```python
# Import des bibliothèques
import requests
from kafka import KafkaProducer
import json
import time

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    # Convertit automatiquement les dictionnaires Python en JSON pour Kafka
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Exemple d'URL d'une API publique (données météo en direct)
API_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current_weather=true"

while True:
    response = requests.get(API_URL)
    if response.status_code == 200:
        data = response.json()
        # On extrait la météo actuelle
        weather = data["current_weather"]
        producer.send("weather-topic", value=weather)
        print(f"Envoyé à Kafka : {weather}")
    time.sleep(10) # Requête toutes les 10 secondes
```

---

## 4. Ingestion par agent système (Filebeat)

Dans le cas d'un projet AIOps, on installe un agent comme **Filebeat** directement sur le serveur. Il surveille le fichier `/var/log/syslog` et envoie automatiquement chaque nouvelle ligne à Kafka sans aucun code Python.

Exemple de configuration `filebeat.yml` :
```yaml
# Source des données (les fichiers de logs à surveiller)
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log

# Destination (Kafka)
output.kafka:
  hosts: ["localhost:9092"]
  topic: "system-logs"
```

---

## 5. Mini Exercice (Avec Solution)

### Énoncé
Tu dois concevoir un pipeline de détection de fraude. La banque t'envoie un fichier CSV nommé `transactions.csv`. Écris un script Python qui lit ce fichier CSV et envoie chaque transaction sous format JSON dans un topic Kafka appelé `bank-transactions`.

### Solution
```python
import csv
import json
import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

with open('transactions.csv', mode='r') as file:
    # Lecture du CSV sous forme de dictionnaire (clé: valeur)
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        # Envoi de la transaction dans le topic
        producer.send('bank-transactions', value=row)
        print(f"Transaction envoyée : {row}")
        time.sleep(0.1) # Délai pour simuler le temps réel
```

---

## 6. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Kafka Producers and Consumers in Python" (Chaîne : *Coding Forever*).
- 🎥 **YouTube :** "Filebeat tutorial - Log ingestion to Kafka" (Chaîne : *DevOps Journey*).
