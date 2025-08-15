#!/usr/bin/env sh

CERT_PATH="/tmp/kind-cluster.crt"

echo "Getting cluster certificate from Kubernetes secret..."
kubectl get secret zitadel-tls -n default -o jsonpath='{.data.tls\.crt}' | base64 -d > "${CERT_PATH}"

if [ ! -f "${CERT_PATH}" ]; then
    echo "Error: Certificate file ${CERT_PATH} not found"
    exit 1
fi

echo "Adding certificate to macOS keychain..."
# macos specific
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${CERT_PATH}"
echo "Certificate successfully added to keychain"