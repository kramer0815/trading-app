# Bitcoin Trading Signal App

Live Bitcoin-Preise mit technischen Indikatoren und automatischen Trading-Signalen.

## ✅ Voraussetzungen

- **Podman Desktop** installiert und gestartet
- **Kubernetes aktiviert** in Podman Desktop (verwendet Kind)
- **kubectl** verfügbar im Terminal

## 🚀 Installation & Start (3 Schritte)

### 1. Projekt-Ordner öffnen
```bash
cd ~/devel/trading-app
```

### 2. App deployen
```bash
./deploy.sh
```

Das Script führt automatisch aus:
- Baut Docker Image mit Podman
- Lädt Image in Kind Kubernetes Cluster
- Deployt die App
- Wartet auf Pod-Start

### 3. App öffnen

**Option A - Port-Forward (empfohlen):**
```bash
kubectl port-forward svc/bitcoin-trading-app 8080:80
```
Dann öffne: **http://localhost:8080**

**Option B - NodePort:**
Öffne direkt: **http://localhost:30080**

## 📋 Nützliche Befehle

```bash
make deploy        # Baut und deployt
make status        # Zeigt Status
make logs          # Zeigt Logs
make port-forward  # Startet Port-Forward
make stop          # Stoppt App
make clean         # Löscht alles
```

## 🔍 Troubleshooting

### Pods starten nicht

```bash
# Status prüfen
kubectl get pods -l app=bitcoin-trading-app

# Logs anschauen
kubectl logs -l app=bitcoin-trading-app

# Pod beschreiben
kubectl describe pod -l app=bitcoin-trading-app
```

### Image nicht gefunden

```bash
# Prüfe ob Image existiert
podman images | grep bitcoin-trading-app

# Kind Cluster prüfen
kind get clusters

# Image manuell laden
kind load docker-image bitcoin-trading-app:latest --name podman
```

### Kubernetes nicht erreichbar

```bash
# Prüfe kubectl
kubectl cluster-info

# Prüfe Kind Cluster
kind get clusters

# Neustart Podman Desktop
```

## 🎯 Features

- ✅ Live Bitcoin-Preise (CoinGecko API)
- ✅ Technische Indikatoren (SMA7, SMA20, RSI)
- ✅ Automatische Trading-Signale
- ✅ Interaktive Charts
- ✅ Auto-Refresh alle 5 Minuten
- ✅ Responsive Design

## 🛠️ Entwicklung

Lokaler Dev-Server ohne Kubernetes:

```bash
npm install
npm run dev
```

Öffne: http://localhost:3000

## 📦 Architektur

```
Podman Desktop (Mac)
  └── Kind Kubernetes Cluster
      └── bitcoin-trading-app Pod
          └── Nginx + React App
```

## ⚠️ Wichtig

Diese App dient nur zu **Lern- und Demonstrationszwecken**.
Keine Finanzberatung - niemals blindlings Trading-Signalen folgen!

## 🆘 Support

Bei Problemen:
1. `kubectl get pods -l app=bitcoin-trading-app` - Pod Status
2. `kubectl logs -l app=bitcoin-trading-app` - Logs
3. `kubectl describe pod -l app=bitcoin-trading-app` - Details
# trading-app
