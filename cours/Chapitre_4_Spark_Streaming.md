# Chapitre 4 : Spark Structured Streaming (Traitement temps réel)
**Copyright par Pascale Nancy Alia AKPO**

Dans ce chapitre, nous allons voir comment utiliser Spark pour traiter des flux de données en continu (streaming) provenant directement de Kafka. C'est la passerelle entre Kafka et l'analyse Machine Learning.

---

## 1. Qu'est-ce que Spark Structured Streaming ?

Spark Structured Streaming est un moteur de traitement de flux basé sur les DataFrames Spark.
- **Principe :** Il traite les flux en continu comme une table infinie qui s'agrandit sans cesse. Chaque nouvelle donnée reçue est considérée comme une nouvelle ligne ajoutée à cette table.
- **Micro-batching :** Par défaut, Spark regroupe les données entrantes en petits lots (par exemple toutes les 5 secondes) pour les traiter rapidement.

---

## 2. Concepts essentiels du Streaming

- **Le Trigger (Déclencheur) :** Définit l'intervalle de temps entre deux traitements.
  - *Exemple :* `trigger(processingTime='5 seconds')` signifie que Spark traite les données accumulées toutes les 5 secondes.
- **La Fenêtre Glissante (Sliding Window) :** Permet de faire des calculs sur un intervalle de temps glissant.
  - *Exemple :* Calculer le nombre de connexions suspectes sur les 10 dernières minutes, recalculé toutes les 2 minutes.
- **Le Watermarking :** Permet à Spark de gérer les données qui arrivent en retard (à cause d'un bug réseau) en définissant une limite de temps après laquelle les données en retard sont ignorées.

---

## 3. Code type : De Kafka à la Console en temps réel

Voici comment lire un flux Kafka avec PySpark, extraire le texte et l'afficher dans la console.

```python
# Import de SparkSession
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

# Initialisation de la session Spark avec le package Kafka requis
spark = SparkSession.builder \
    .appName("Kafka_Spark_Streaming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1") \
    .getOrCreate()

# Lecture du flux depuis le topic Kafka 'transactions'
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "transactions") \
    .load()

# Les données Kafka arrivent sous forme binaire. On doit convertir la colonne 'value' en texte (string)
transactions_df = df.selectExpr("CAST(value AS STRING) as transaction_json")

# Écriture du flux dans la console pour déboguer
query = transactions_df.writeStream \
    .outputMode("append") \
    .format("console") \
    .trigger(processingTime="2 seconds") \
    .start()

# Attente de l'arrêt du flux
query.awaitTermination()
```

---

## 4. Mini Exercice (Avec Solution)

### Énoncé
Dans ton projet de détection de fraude, tu reçois des transactions dans Kafka. Tu souhaites compter le nombre de transactions reçues toutes les 10 secondes et afficher ce total. Écris le code Spark Streaming nécessaire.

### Solution
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

spark = SparkSession.builder \
    .appName("Exercice_Streaming_Count") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1") \
    .getOrCreate()

# Ingestion depuis Kafka
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "transactions") \
    .load()

# Conversion de la valeur binaire en chaîne de caractères
raw_messages = df.selectExpr("CAST(value AS STRING)")

# Comptage simple par micro-batch (calculé grâce au trigger de Spark)
query = raw_messages.writeStream \
    .format("console") \
    .outputMode("complete") \
    .trigger(processingTime="10 seconds") \
    .start()

query.awaitTermination()
```

---

## 5. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Spark Structured Streaming with Kafka Tutorial" (Chaîne : *Data Science with Harshit*).
- 🎥 **YouTube :** "Spark Streaming Windows & Watermarking Explained" (Chaîne : *Soumil Shah*).
