#!/bin/bash
# Topologia local (LocalStack) só do que este serviço publica e consome.
set -euo pipefail

awslocal sns create-topic --name lagoski-dev-catalog-events >/dev/null
touch /tmp/lagoski-ready
echo "topologia Lagoski pronta"
