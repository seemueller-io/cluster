#!/usr/bin/env sh

untrust_cert() {
  cert_path=$1
  echo "Removing trust for development certificate"
  sudo security remove-trusted-cert -d $cert_path
}

untrust_cert ./cluster.crt
untrust_cert ./zitadel.crt

echo "Development certificates successfully removed from system trust store"