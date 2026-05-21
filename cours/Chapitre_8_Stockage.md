# Chapitre 8 : Indexer et stocker les données (HDFS vs Elasticsearch vs PostgreSQL)
**Copyright par Pascale Nancy Alia AKPO**

Dans ce chapitre, nous allons étudier la couche stockage du Big Data. C'est ici que l'on conserve les résultats de nos calculs et nos données brutes.

---

## 1. Data Lake vs Base de Données

- **Data Lake (Lac de données) :** Un espace de stockage brut où l'on dépose les fichiers sans structure fixe (CSV, JSON, Images, Logs).
  - *Outil :* **Hadoop HDFS** ou **Amazon S3**.
- **Base de données indexée (Moteur de recherche) :** Conçue pour indexer du texte et faire des recherches complexes en une fraction de seconde.
  - *Outil :* **Elasticsearch**.
- **Base de données relationnelle (SQL) :** Idéale pour stocker des données structurées et faire des requêtes précises (transactions financières, statistiques de trafic).
  - *Outil :* **PostgreSQL**.

---

## 2. Hadoop HDFS (Le stockage brut distribué)

Le **Hadoop Distributed File System (HDFS)** découpe les fichiers en blocs (généralement 128 Mo) et les distribue sur plusieurs serveurs.
- **NameNode (Le Cerveau) :** Stocke les métadonnées (quel fichier est découpé dans quels blocs et sur quels serveurs).
- **DataNodes (Les Bras) :** Stockent les blocs de données réels. HDFS duplique chaque bloc 3 fois par sécurité (tolérance aux pannes).

---

## 3. Elasticsearch (Le moteur de recherche textuel)

Elasticsearch stocke des données sous forme de documents JSON. C'est l'outil indispensable pour l'analyse de sentiments (tweets) ou l'analyse de logs système (AIOps).
- Il n'utilise pas de tables SQL, mais des **Index**.
- Il utilise un index inversé (comme l'index à la fin d'un livre) pour savoir instantanément dans quels documents se trouve un mot précis.

---

## 4. Exemple d'écriture vers PostgreSQL (Exemple Python)

Dans le cas du projet de trafic routier (Exercice 5), on stocke les résultats analysés dans PostgreSQL pour les afficher ensuite sur Grafana.

```python
# Import de la bibliothèque de connexion PostgreSQL
import psycopg2

try:
    # Connexion à la base de données PostgreSQL
    connection = psycopg2.connect(
        user="admin",
        password="securepassword",
        host="localhost",
        port="5432",
        database="traffic_db"
    )
    cursor = connection.cursor()
    
    # Requête d'insertion d'une mesure de trafic
    insert_query = """
        INSERT INTO congestion_metrics (station_id, volume, alert_level, timestamp) 
        VALUES (%s, %s, %s, NOW())
    """
    record_to_insert = (104, 1250, 'HIGH')
    
    # Exécution et validation
    cursor.execute(insert_query, record_to_insert)
    connection.commit()
    print("Données insérées avec succès dans PostgreSQL !")
    
except Exception as error:
    print(f"Erreur de connexion : {error}")
finally:
    if connection:
        cursor.close()
        connection.close()
```

---

## 5. Mini Exercice (Avec Solution)

### Énoncé
Dans ton projet AIOps (Exercice 3), Spark a analysé un log système et a trouvé une anomalie critique. Tu dois insérer ce log suspect sous format JSON dans Elasticsearch pour que l'équipe technique puisse le chercher facilement. Écris le script Python correspondant.

### Solution
```python
# Import de la bibliothèque officielle Elasticsearch
from elasticsearch import Elasticsearch
from datetime import datetime

# Connexion à l'instance locale Elasticsearch
es = Elasticsearch("http://localhost:9200")

# Définition du log anormal sous forme de dictionnaire (JSON)
log_anormal = {
    "host": "server-web-01",
    "status": "CRITICAL",
    "message": "Connection timeout database server, maximum retries reached",
    "timestamp": datetime.now()
}

# Indexation du document dans l'index 'system-alerts'
response = es.index(
    index="system-alerts",
    document=log_anormal
)

print(f"Log indexé ! ID du document dans Elasticsearch : {response['_id']}")
```

---

## 6. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Hadoop HDFS Architecture Explained" (Chaîne : *Javatpoint*).
- 🎥 **YouTube :** "Elasticsearch Tutorial for Beginners" (Chaîne : *TechWorld with Nana*).
