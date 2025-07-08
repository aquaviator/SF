#!/bin/bash

for domain in shiftflo.com test.shiftflo.com; do
  echo "Checking $domain..."
  curl -s --head "https://$domain" | grep "200 OK" > /dev/null

  if [ $? -eq 0 ]; then
    echo "✅ $domain is LIVE"
  else
    echo "❌ $domain is NOT ready yet"
  fi
done
