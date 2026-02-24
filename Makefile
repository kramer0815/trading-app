.PHONY: help deploy start stop logs status clean port-forward

IMAGE_NAME = bitcoin-trading-app
IMAGE_TAG = latest

help: ## Zeigt Hilfe
	@echo "Bitcoin Trading App - Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

deploy: ## Baut und deployt die App
	@./deploy.sh

start: deploy ## Alias für deploy

stop: ## Stoppt die App
	@kubectl delete -f k8s/deployment.yaml || true

logs: ## Zeigt Logs
	@kubectl logs -f -l app=$(IMAGE_NAME) --tail=100

status: ## Zeigt Status
	@echo "Pods:"
	@kubectl get pods -l app=$(IMAGE_NAME)
	@echo ""
	@echo "Service:"
	@kubectl get svc $(IMAGE_NAME)

clean: ## Löscht alles
	@kubectl delete -f k8s/ || true
	@kind delete cluster --name podman || true

port-forward: ## Startet Port-Forwarding
	@echo "Port-Forwarding zu localhost:8080"
	@kubectl port-forward svc/$(IMAGE_NAME) 8080:80

dev: ## Lokaler Dev-Server
	@npm install
	@npm run dev

restart: ## Pods neu starten
	@kubectl rollout restart deployment/$(IMAGE_NAME)

shell: ## Shell im Pod
	@kubectl exec -it deployment/$(IMAGE_NAME) -- sh
