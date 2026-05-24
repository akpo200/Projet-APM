// ==========================================
// Logique Javascript du Dashboard APM
// Copyright par Pascale Nancy Alia AKPO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTS DU DOM ---
    const themeSelector = document.getElementById("theme-selector");
    const thresholdSlider = document.getElementById("threshold-slider");
    const thresholdVal = document.getElementById("threshold-val");
    const btnPlayPause = document.getElementById("btn-play-pause");
    const btnPlayPauseText = document.getElementById("btn-play-pause-text");
    const speedSlider = document.getElementById("speed-slider");
    const speedVal = document.getElementById("speed-val");
    const timeRangeSelector = document.getElementById("time-range-selector");
    
    // Checkboxes de disposition
    const chkStatus = document.getElementById("chk-status");
    const chkVolChart = document.getElementById("chk-vol-chart");
    const chkScoreChart = document.getElementById("chk-score-chart");
    const chkTerminal = document.getElementById("chk-terminal");
    
    // Panels du dashboard
    const panelStatus = document.getElementById("panel-status");
    const panelVolChart = document.getElementById("panel-vol-chart");
    const panelScoreChart = document.getElementById("panel-score-chart");
    const panelTerminal = document.getElementById("panel-terminal");
    
    // Eléments de métriques
    const statusBox = document.getElementById("status-box");
    const statusTitle = document.getElementById("status-title");
    const statusDesc = document.getElementById("status-desc");
    const metricVol = document.getElementById("metric-vol");
    const metricScore = document.getElementById("metric-score");
    const logTerminal = document.getElementById("log-terminal");
    const anomalyOverlay = document.getElementById("anomaly-overlay");
    const btnExportPdf = document.getElementById("btn-export-pdf");
    const btnExportJson = document.getElementById("btn-export-json");

    // --- VARIABLES DE L'APPLICATION ---
    let currentTheme = "theme-cyberpunk";
    let isPaused = false;
    let customThreshold = -0.15;
    let lastLogsLength = 0;
    let timeRangeDuration = 300; // par défaut 5 minutes (300 secondes)
    
    // Graphiques
    let volChart, scoreChart;
    
    // Données historiques locales pour les graphiques
    let history = {
        timestamps: [],
        log_count: [],
        anomaly_score: [],
        thresholds: []
    };

    // --- INITIALISATION ---
    
    // 1. Initialise les graphiques vides
    initCharts();
    
    // 2. Récupère la config initiale du serveur
    fetchConfig();
    
    // 3. Premier chargement de l'historique
    updateHistory();
    
    // 4. Boucles de mise à jour synchronisées sur le rythme de Spark & Prometheus (toutes les 5 secondes)
    setInterval(updateRealtime, 5000);
    setInterval(updateHistory, 5000);
    setInterval(updateLogs, 2000);

    // --- ÉVÉNEMENTS (LISTENERS) ---

    // Changement de thème
    themeSelector.addEventListener("change", (e) => {
        const selectedTheme = e.target.value;
        document.body.classList.remove(currentTheme);
        document.body.classList.add(selectedTheme);
        currentTheme = selectedTheme;
        
        // Adapte les couleurs des graphiques au thème
        updateChartColors();
    });

    // Changement de la plage temporelle des graphiques
    timeRangeSelector.addEventListener("change", (e) => {
        timeRangeDuration = parseInt(e.target.value);
        updateHistory(); // Rafraîchit les graphiques immédiatement
    });

    // Seuil d'anomalie dynamique
    thresholdSlider.addEventListener("input", (e) => {
        customThreshold = parseFloat(e.target.value);
        thresholdVal.textContent = customThreshold.toFixed(2);
        
        // Met à jour la ligne de seuil sur le graphique en direct
        if (scoreChart) {
            const length = history.anomaly_score.length;
            history.thresholds = Array(length).fill(customThreshold);
            scoreChart.data.datasets[1].data = history.thresholds;
            scoreChart.update('none'); // Met à jour sans animation pour la réactivité
        }
    });

    // Contrôle Play/Pause de la simulation
    btnPlayPause.addEventListener("click", () => {
        isPaused = !isPaused;
        
        if (isPaused) {
            btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span id="btn-play-pause-text">Reprendre</span>';
            btnPlayPause.style.backgroundColor = "var(--normal-color)";
            btnPlayPause.style.boxShadow = "0 0 15px var(--normal-color)";
        } else {
            btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span id="btn-play-pause-text">Pause</span>';
            btnPlayPause.style.backgroundColor = "var(--accent-color)";
            btnPlayPause.style.boxShadow = "var(--accent-glow)";
        }
        
        sendConfigToServer();
    });

    // Slider de vitesse de simulation
    speedSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        speedVal.textContent = val.toFixed(2) + "s";
    });
    
    speedSlider.addEventListener("change", () => {
        sendConfigToServer();
    });

    // Affichage/Masquage des Panels (Disposition dynamique)
    const togglePanel = (checkbox, panel) => {
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                panel.classList.remove("hidden");
            } else {
                panel.classList.add("hidden");
            }
            adjustGridSpans();
        });
    };

    togglePanel(chkStatus, panelStatus);
    togglePanel(chkVolChart, panelVolChart);
    togglePanel(chkScoreChart, panelScoreChart);
    togglePanel(chkTerminal, panelTerminal);

    // Ajuste dynamiquement le grid column span si certains graphiques sont masqués
    function adjustGridSpans() {
        const isVolVisible = chkVolChart.checked;
        const isScoreVisible = chkScoreChart.checked;

        if (isVolVisible && !isScoreVisible) {
            panelVolChart.classList.add("span-2");
        } else {
            panelVolChart.classList.remove("span-2");
        }

        if (isScoreVisible && !isVolVisible) {
            panelScoreChart.classList.add("span-2");
        } else {
            panelScoreChart.classList.remove("span-2");
        }
    }

    // Exporter le rapport d'analyse en PDF
    btnExportPdf.addEventListener("click", () => {
        window.print(); // Déclenche la boîte de dialogue d'impression gérée par @media print dans style.css
    });

    // Exporter le rapport d'analyse en JSON
    btnExportJson.addEventListener("click", () => {
        const reportData = {
            date_export: new Date().toISOString(),
            contexte: "Supervision de Performance Applicative (APM)",
            auteur: "Pascale Nancy Alia AKPO",
            seuil_anomalie_choisi: customThreshold,
            statistiques_courantes: {
                volume_logs: parseInt(metricVol.textContent),
                anomaly_score: parseFloat(metricScore.textContent),
                status: statusTitle.textContent
            },
            historique: history,
            logs_recents: []
        };
        
        // Récupère les logs actuels du terminal
        const logLines = document.querySelectorAll(".log-line");
        logLines.forEach(line => {
            reportData.logs_recents.push(line.textContent);
        });

        // Crée un fichier JSON et le télécharge
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `apm_rapport_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // --- FONCTIONS COMMUNICATIONS API ---

    // Récupère la config depuis le serveur Flask
    function fetchConfig() {
        fetch(`/api/config?_=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                isPaused = data.paused;
                const delay = data.delay;
                
                speedSlider.value = delay;
                speedVal.textContent = delay.toFixed(2) + "s";
                
                if (isPaused) {
                    btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span id="btn-play-pause-text">Reprendre</span>';
                    btnPlayPause.style.backgroundColor = "var(--normal-color)";
                    btnPlayPause.style.boxShadow = "0 0 15px var(--normal-color)";
                } else {
                    btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span id="btn-play-pause-text">Pause</span>';
                    btnPlayPause.style.backgroundColor = "var(--accent-color)";
                    btnPlayPause.style.boxShadow = "var(--accent-glow)";
                }
            })
            .catch(err => console.error("Erreur de config:", err));
    }

    // Envoie la config au serveur Flask
    function sendConfigToServer() {
        const config = {
            delay: parseFloat(speedSlider.value),
            paused: isPaused
        };
        
        fetch("/api/config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(config)
        }).catch(err => console.error("Erreur d'envoi config:", err));
    }

    // Met à jour les valeurs instantanées et l'état d'anomalie
    function updateRealtime() {
        fetch(`/api/metrics/realtime?_=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                metricVol.textContent = data.log_count;
                metricScore.textContent = data.anomaly_score.toFixed(4);
                
                // --- ALGORITHME DE DIAGNOSTIC ---
                // Si l'indicateur d'anomalie du backend est à 1 (seuil de sécurité >= 0.5)
                // OU si le score d'anomalie en direct descend en dessous de notre seuil personnalisé
                const isAnomaly = (data.is_anomaly >= 0.5) || (data.anomaly_score < customThreshold);
                
                if (isAnomaly) {
                    statusBox.classList.add("anomaly-active");
                    statusTitle.textContent = "ANOMALIE DÉTECTÉE";
                    statusDesc.textContent = "Le modèle de Machine Learning signale un comportement hautement suspect.";
                    anomalyOverlay.classList.remove("hidden");
                } else {
                    statusBox.classList.remove("anomaly-active");
                    statusTitle.textContent = "NORMAL";
                    statusDesc.textContent = "Le modèle ML évalue le comportement comme stable.";
                    anomalyOverlay.classList.add("hidden");
                }
            })
            .catch(err => console.error("Erreur temps réel:", err));
    }

    // Récupère l'historique et recharge les graphiques
    function updateHistory() {
        fetch(`/api/metrics/history?duration=${timeRangeDuration}&_=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (!data.timestamps || data.timestamps.length === 0) return;
                
                // Formate les timestamps pour l'affichage (HH:MM:SS)
                const formattedTimes = data.timestamps.map(t => {
                    const date = new Date(t * 1000);
                    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                });
                
                history.timestamps = formattedTimes;
                history.log_count = data.log_count;
                history.anomaly_score = data.anomaly_score;
                history.thresholds = Array(data.timestamps.length).fill(customThreshold);
                
                // Met à jour Chart.js
                if (volChart && scoreChart) {
                    volChart.data.labels = history.timestamps;
                    volChart.data.datasets[0].data = history.log_count;
                    volChart.update('active');
                    
                    scoreChart.data.labels = history.timestamps;
                    scoreChart.data.datasets[0].data = history.anomaly_score;
                    scoreChart.data.datasets[1].data = history.thresholds;
                    scoreChart.update('active');
                }
            })
            .catch(err => console.error("Erreur historique:", err));
    }

    // Récupère les logs récents depuis Kafka
    function updateLogs() {
        fetch(`/api/logs?_=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) return;
                if (data.length === lastLogsLength) return; // Aucun nouveau log
                
                lastLogsLength = data.length;
                logTerminal.innerHTML = "";
                
                data.forEach(item => {
                    const div = document.createElement("div");
                    div.className = "log-line";
                    
                    // Détection du niveau de log pour coloration syntaxique
                    let logType = "info";
                    const upperLog = item.log.toUpperCase();
                    if (upperLog.includes("WARN")) {
                        logType = "warn";
                    } else if (upperLog.includes("ERROR") || upperLog.includes("EXCEPTION") || upperLog.includes("FAIL")) {
                        logType = "error";
                    }
                    
                    div.classList.add(logType);
                    div.textContent = `[${item.timestamp}] ${item.log}`;
                    logTerminal.appendChild(div);
                });
                
                // Fait défiler le terminal automatiquement vers le bas
                logTerminal.scrollTop = logTerminal.scrollHeight;
            })
            .catch(err => console.error("Erreur de logs:", err));
    }

    // --- CONFIGURATION GRAPHITIQUES ---
    
    function initCharts() {
        const ctxVol = document.getElementById("volChart").getContext("2d");
        const ctxScore = document.getElementById("scoreChart").getContext("2d");
        
        // Couleur d'accentuation en cours
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#00f0ff';
        const alertColor = getComputedStyle(document.body).getPropertyValue('--alert-color').trim() || '#ff0055';
        
        // Dégradé pour le volume
        const gradVol = ctxVol.createLinearGradient(0, 0, 0, 200);
        gradVol.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        gradVol.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

        // Dégradé pour le score ML
        const gradScore = ctxScore.createLinearGradient(0, 0, 0, 200);
        gradScore.addColorStop(0, 'rgba(189, 147, 249, 0.3)');
        gradScore.addColorStop(1, 'rgba(189, 147, 249, 0.0)');

        // Chart 1: Volume de logs
        volChart = new Chart(ctxVol, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Volume de logs (5s)',
                    data: [],
                    borderColor: accentColor,
                    backgroundColor: gradVol,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#8a92a6', font: { size: 9 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#8a92a6', font: { size: 9 } },
                        beginAtZero: true
                    }
                }
            }
        });

        // Chart 2: Score Anomaly ML
        scoreChart = new Chart(ctxScore, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Score ML',
                        data: [],
                        borderColor: '#bd93f9',
                        backgroundColor: gradScore,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Seuil personnalisé',
                        data: [],
                        borderColor: alertColor,
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        fill: false,
                        pointRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#8a92a6', font: { size: 9 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#8a92a6', font: { size: 9 } },
                        suggestedMin: -0.4,
                        suggestedMax: 0.2
                    }
                }
            }
        });
    }

    // Recalcule les couleurs des graphiques lorsque le thème change
    function updateChartColors() {
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
        const alertColor = getComputedStyle(document.body).getPropertyValue('--alert-color').trim();
        
        if (volChart) {
            volChart.data.datasets[0].borderColor = accentColor;
            volChart.update();
        }
        
        if (scoreChart) {
            scoreChart.data.datasets[1].borderColor = alertColor;
            scoreChart.update();
        }
    }
});
