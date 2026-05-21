# Chapitre 5 : La détection d'anomalies et de fraudes en Machine Learning
**Copyright par Pascale Nancy Alia AKPO**

Ce chapitre se concentre sur l'intelligence artificielle pour la détection de comportements anormaux (fraude financière, pannes d'infrastructure, anomalies de performance applicative).

---

## 1. Pourquoi utiliser le Machine Learning non-supervisé ?

- **Apprentissage supervisé :** On entraîne un modèle sur des données étiquetées (on sait à l'avance quelles transactions sont frauduleuses et lesquelles sont normales).
  - *Problème :* Les fraudeurs changent constamment de technique, et les fraudes sont très rares dans les données (déséquilibre des classes).
- **Apprentissage non-supervisé :** Le modèle n'a pas besoin d'étiquette. Il apprend la forme habituelle des données "normales" et considère tout ce qui s'en éloigne trop comme une anomalie.
  - *Solution idéale* pour la détection de fraudes inconnues ou les pannes réseau.

---

## 2. Deux algorithmes clés

### A. Isolation Forest (La Forêt d'Isolement)
- **Principe :** Cet algorithme isole chaque point de données en traçant des lignes au hasard.
- Les points normaux (regroupés et denses) nécessitent beaucoup de lignes pour être isolés.
- Les anomalies (isolées et excentrées) sont isolées très rapidement (peu de lignes nécessaires).
- C'est l'algorithme que nous avons utilisé pour ton projet de détection de performance applicative (APM).

### B. K-Means (Le Regroupement)
- **Principe :** Il sépare les données en $K$ groupes (clusters) distincts en calculant la distance entre les points.
- Si un point est trop éloigné de tous les centres de groupes (centroids), il est considéré comme une anomalie.

---

## 3. Exemple pratique : Isolation Forest avec Scikit-Learn

Voici comment utiliser `scikit-learn` en Python pour repérer des anomalies dans un lot de données.

```python
# Import de l'algorithme
from sklearn.ensemble import IsolationForest
import pandas as pd

# Données simulées : [Nombre de requêtes, Temps de réponse moyen en ms]
data = {
    'requetes': [100, 110, 105, 95, 102, 500, 98], # 500 est anormal
    'temps_reponse': [15, 18, 16, 14, 15, 300, 16] # 300 ms est anormal
}

# Conversion en tableau (DataFrame)
df = pd.DataFrame(data)

# Initialisation du modèle
# contamination=0.1 signifie qu'on s'attend à environ 10% d'anomalies
model = IsolationForest(contamination=0.1, random_state=42)

# Entraînement du modèle et prédiction
# fit_predict renvoie : 1 pour normal, -1 pour anomalie
df['status'] = model.fit_predict(df)

# Affichage des résultats
print(df)
```

---

## 4. Mini Exercice (Avec Solution)

### Énoncé
Dans le cadre de l'exercice 1 (Détection de fraude financière), tu analyses des transactions avec deux caractéristiques : le montant de la transaction et la distance par rapport au domicile du client. Écris le code Python pour identifier les transactions suspectes en utilisant un modèle Isolation Forest.

### Solution
```python
import pandas as pd
from sklearn.ensemble import IsolationForest

# Chargement des transactions simulées
transactions = pd.DataFrame({
    'montant': [10.5, 25.0, 5.0, 3000.0, 12.0, 15.0, 4500.0], # 3000 et 4500 sont suspects
    'distance_km': [1, 2, 0.5, 500, 1.2, 3, 800] # 500 et 800 km sont suspects
})

# Initialisation d'Isolation Forest avec une estimation de contamination de 25% (0.25)
detector = IsolationForest(contamination=0.25, random_state=42)

# Entraînement et classification
transactions['est_fraude'] = detector.fit_predict(transactions)

# On filtre pour afficher uniquement les fraudes détectées (valeur égale à -1)
fraudes = transactions[transactions['est_fraude'] == -1]

print("Transactions suspectes détectées :")
print(fraudes)
```

---

## 5. Vidéos et ressources complémentaires
- 🎥 **YouTube :** "Isolation Forest Algorithm Explained" (Chaîne : *StatQuest with Josh Starmer*).
- 🎥 **YouTube :** "K-Means Clustering - Machine Learning" (Chaîne : *StatQuest with Josh Starmer*).
