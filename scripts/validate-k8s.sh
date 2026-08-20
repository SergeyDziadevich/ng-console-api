#!/usr/bin/env bash
set -euo pipefail

echo "======================================================"
echo " Kubernetes & Kustomize Manifest Validation"
echo "======================================================"

echo "--> 1. Validating Base Manifests..."
kubectl kustomize k8s/base > /dev/null
echo "    [PASS] k8s/base rendered successfully."

echo "--> 2. Validating Local Overlay..."
kubectl kustomize k8s/overlays/local > /dev/null
echo "    [PASS] k8s/overlays/local rendered successfully."

echo "--> 3. Validating Staging Overlay..."
kubectl kustomize k8s/overlays/staging > /dev/null
echo "    [PASS] k8s/overlays/staging rendered successfully."

echo "======================================================"
echo " All Kubernetes manifests validated successfully!"
echo "======================================================"
