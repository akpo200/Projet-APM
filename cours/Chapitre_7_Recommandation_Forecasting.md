# Chapitre 7 : Les Moteurs de Recommandation et la Prévision de la Demande
**Copyright par Pascale Nancy Alia AKPO**

Ce chapitre couvre deux applications majeures du Big Data en entreprise : la recommandation de contenu (Netflix/Amazon - Exercice 6) et la prévision des ventes futures (Retail - Exercice 4).

---

## 1. Les Moteurs de Recommandation (Algorithme ALS)

Il existe deux manières principales de recommander un produit :
- **Le filtrage basé sur le contenu (Content-Based) :** Recommander des films similaires à ceux que l'utilisateur a aimés (ex: proposer un autre film d'action).
- **Le filtrage collaboratif (Collaborative Filtering) :** Recommander des films aimés par des utilisateurs qui ont des goûts similaires aux tiens. C'est l'approche la plus efficace dans le Big Data.

Dans **Spark MLlib**, l'algorithme standard pour le filtrage collaboratif est le **ALS (Alternating Least Squares)**. Il prend en entrée des notes (ratings) données par des utilisateurs à des produits et prédit les notes pour les produits non encore vus.

---

## 2. Exemple de code : ALS avec Spark MLlib

Voici comment configurer un moteur de recommandation simple en PySpark.

```python
from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS

# Initialisation Spark
spark = SparkSession.builder.appName("Moteur_Recommandation").getOrCreate()

# Données d'entraînement : [ID Utilisateur, ID Produit, Note (1 à 5)]
ratings_data = [
    (0, 101, 5.0),
    (0, 102, 1.0),
    (1, 101, 1.0),
    (1, 103, 5.0),
    (2, 102, 4.0),
    (2, 103, 4.0)
]

# Création du DataFrame
ratings = spark.createDataFrame(ratings_data, ["user", "item", "rating"])

# Configuration du modèle ALS
als = ALS(
    maxIter=5, 
    regParam=0.01, 
    userCol="user", 
    itemCol="item", 
    ratingCol="rating",
    coldStartStrategy="drop" # Ignore les nouveaux utilisateurs sans historique
)

# Entraînement du modèle
model = als.fit(ratings)

# Générer les 3 meilleures recommandations pour chaque utilisateur
user_recs = model.recommendForAllUsers(3)
user_recs.show(truncate=False)

spark.stop()
```

---

## 3. La Prévision de la Demande (Demand Forecasting)

La prévision des ventes utilise des **Séries Temporelles** (données ordonnées dans le temps).
- **Objectif :** Prédire la quantité d'articles vendus demain/la semaine prochaine pour éviter les ruptures de stock.
- Dans Spark, on extrait des variables temporelles (jour de la semaine, mois, effet de saisonnalité) et on applique un modèle de régression (ex: Régression Linéaire ou Forêt Aléatoire).

---

## 4. Mini Exercice (Avec Solution)

### Énoncé
Dans le cadre de l'exercice 4 (Prévision de la demande), tu as un historique de ventes journalières. Pour faire un modèle simple, tu veux calculer la moyenne mobile des ventes sur les 3 derniers jours pour prédire la demande du jour suivant. Écris le code PySpark en utilisant les fonctions de fenêtrage (Windows).

### Solution
```python
from pyspark.sql import SparkSession
from pyspark.sql.window import Window
from pyspark.sql.functions import col, avg

spark = SparkSession.builder.appName("Exercice_Forecasting").getOrCreate()

# Données simulées : [Date, Ventes]
ventes_data = [
    ("2026-05-01", 100),
    ("2026-05-02", 120),
    ("2026-05-03", 110),
    ("2026-05-04", 130),
    ("2026-05-05", 140)
]

df = spark.createDataFrame(ventes_data, ["date", "ventes"])

# Définition de la fenêtre : ordonnée par date, couvrant les 3 lignes précédentes
window_spec = Window.orderBy("date").rowsBetween(-3, -1)

# Calcul de la moyenne mobile (notre prévision simple pour le jour J)
df_prevision = df.withColumn("prevision_ventes", avg(col("ventes")).over(window_spec))

df_prevision.show()
spark.stop()
```

---

## 5. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Recommendation Systems - Collaborative Filtering" (Chaîne : *Luis Serrano*).
- 🎥 **YouTube :** "Time Series Forecasting in 10 minutes" (Chaîne : *Data Science Dojo*).
