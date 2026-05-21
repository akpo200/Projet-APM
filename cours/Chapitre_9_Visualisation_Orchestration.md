# Chapitre 9 : Visualisation (Grafana) et Orchestration (Airflow)
**Copyright par Pascale Nancy Alia AKPO**

Ce dernier chapitre présente la partie visible de nos applications : les tableaux de bord interactifs pour les utilisateurs et l'automatisation des pipelines de données (orchestration).

---

## 1. Grafana : La Visualisation Temps Réel

Grafana est une plateforme de visualisation de données open source. Elle permet d'unifier des sources de données différentes (Prometheus, Elasticsearch, PostgreSQL) sur un seul écran.
- **Les Data Sources :** Les connecteurs vers tes bases de données.
- **Les Panels (Panneaux) :** Les composants graphiques individuels (courbes, diagrammes, jauges, alertes textuelles).

---

## 2. Apache Airflow : L'Orchestrateur de Pipelines

Dans le Big Data, un projet contient souvent plusieurs étapes. Par exemple dans le projet de prévision de la demande (Exercice 4) :
1.  Étape 1 : Récupérer les ventes d'hier.
2.  Étape 2 : Lancer le calcul Spark pour prédire la demande de demain.
3.  Étape 3 : Envoyer un email de rapport à l'équipe logistique.

**Apache Airflow** permet de planifier et d'ordonner ces étapes sous forme de **DAG (Directed Acyclic Graph)** (Graphe Orienté Acyclique). Il s'assure que l'étape 2 ne démarre que si l'étape 1 a réussi.

---

## 3. Exemple de code : Un DAG Airflow simple

Voici comment écrire un DAG en Python pour exécuter des tâches planifiées.

```python
# Import d'Airflow
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Définition des fonctions de tâches
def recuperer_donnees():
    print("Étape 1 : Téléchargement des nouvelles ventes...")

def lancer_prediction():
    print("Étape 2 : Lancement du modèle Machine Learning Spark...")

# Configuration par défaut du DAG
default_args = {
    'owner': 'Pascale Nancy Alia AKPO',
    'start_date': datetime(2026, 5, 20),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

# Déclaration du DAG (Planifié tous les jours à minuit)
with DAG(
    'pipeline_retail_forecasting',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False
) as dag:
    
    # Déclaration des tâches
    task_download = PythonOperator(
        task_id='recuperer_donnees',
        python_callable=recuperer_donnees
    )
    
    task_ml = PythonOperator(
        task_id='lancer_prediction',
        python_callable=lancer_prediction
    )
    
    # Ordonnancement des tâches (task_download doit s'exécuter AVANT task_ml)
    task_download >> task_ml
```

---

## 4. Mini Exercice (Avec Solution)

### Énoncé
Dans le cadre de l'exercice 4 (Retail), tu veux programmer un pipeline de données. Il doit :
1.  Vérifier si les fichiers CSV de ventes sont arrivés.
2.  Si oui, lancer le script Spark de prévision.
3.  Si le script réussit, copier les résultats sur HDFS.
Écris l'ordonnancement de ces 3 tâches dans la syntaxe Airflow (en supposant que les objets tâches s'appellent `t_check`, `t_spark` et `t_hdfs`).

### Solution
```python
# La syntaxe d'ordonnancement dans Airflow utilise l'opérateur '>>'
# pour indiquer la dépendance et l'ordre d'exécution :

t_check >> t_spark >> t_hdfs

# Ce code signifie :
# 1. t_check s'exécute en premier.
# 2. t_spark attend que t_check réussisse avant de démarrer.
# 3. t_hdfs attend que t_spark réussisse avant de démarrer.
```

---

## 5. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Grafana Complete Tutorial" (Chaîne : *Edureka*).
- 🎥 **YouTube :** "Apache Airflow Tutorial for Beginners" (Chaîne : *Marc Lamberti*).
