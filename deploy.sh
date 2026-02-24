#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Bitcoin Trading App - Kind Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

IMAGE_NAME="bitcoin-trading-app"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# Schritt 1: Docker Image mit Podman bauen
echo -e "${YELLOW}[1/4] Baue Docker Image mit Podman...${NC}"
podman build -t ${FULL_IMAGE} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image gebaut: ${FULL_IMAGE}${NC}"
else
    echo -e "${RED}✗ Fehler beim Bauen${NC}"
    exit 1
fi

echo ""

# Schritt 2: Image zu Kind laden
echo -e "${YELLOW}[2/4] Lade Image in Kind Cluster...${NC}"

# Finde Kind Cluster Name (normalerweise 'podman')
KIND_CLUSTER=$(kind get clusters 2>/dev/null | head -n 1)

if [ -z "$KIND_CLUSTER" ]; then
    echo -e "${RED}✗ Kein Kind Cluster gefunden!${NC}"
    echo "Starte Kubernetes in Podman Desktop"
    exit 1
fi

echo "Kind Cluster: ${KIND_CLUSTER}"

# Lade Image in Kind
kind load docker-image ${FULL_IMAGE} --name ${KIND_CLUSTER}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image in Kind geladen${NC}"
else
    echo -e "${RED}✗ Fehler beim Laden${NC}"
    exit 1
fi

echo ""

# Schritt 3: Kubernetes Ressourcen anwenden
echo -e "${YELLOW}[3/4] Wende Kubernetes Manifeste an...${NC}"

kubectl apply -f k8s/deployment.yaml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment angewendet${NC}"
else
    echo -e "${RED}✗ Fehler beim Deployment${NC}"
    exit 1
fi

echo ""

# Schritt 4: Warte auf Pods
echo -e "${YELLOW}[4/4] Warte auf Pod-Start (max 60s)...${NC}"

kubectl wait --for=condition=ready pod -l app=${IMAGE_NAME} --timeout=60s

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pods sind bereit!${NC}"
else
    echo -e "${YELLOW}⚠ Pods noch nicht bereit. Prüfe Status:${NC}"
    kubectl get pods -l app=${IMAGE_NAME}
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment abgeschlossen!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Status anzeigen
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -l app=${IMAGE_NAME}
echo ""

echo -e "${YELLOW}Service:${NC}"
kubectl get svc ${IMAGE_NAME}
echo ""

echo -e "${GREEN}Zugriff auf die App:${NC}"
echo -e "Methode 1 (Port-Forward):  ${YELLOW}kubectl port-forward svc/${IMAGE_NAME} 8080:80${NC}"
echo -e "Dann öffne: ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "Methode 2 (NodePort):      ${YELLOW}http://localhost:30080${NC}"
echo ""

# Optional: Port-Forward starten
read -p "Port-Forwarding jetzt starten? (j/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Jj]$ ]]; then
    echo -e "${GREEN}Starte Port-Forwarding...${NC}"
    echo -e "${YELLOW}Drücke CTRL+C zum Beenden${NC}"
    kubectl port-forward svc/${IMAGE_NAME} 8080:80
fi
