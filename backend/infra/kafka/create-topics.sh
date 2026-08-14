#!/bin/bash
set -e

echo "Waiting for Kafka to be ready..."
# Docker Compose healthcheck ensures Kafka is healthy before this container starts.
# Adding a small sleep as a safety buffer.
sleep 5

echo "Creating Kafka topics..."

topics=(
  "job.created"
  "job.assigned"
  "job.progress"
  "job.completed"
  "job.failed"
  "resource.updated"
  "payment.completed"
)

for topic in "${topics[@]}"; do
  kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic "$topic" --partitions 1 --replication-factor 1
  echo "Topic '$topic' created."
done

echo "All Kafka topics created successfully."
