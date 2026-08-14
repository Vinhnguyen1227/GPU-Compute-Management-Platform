#!/bin/bash
set -e

echo "Waiting for Kafka to be ready..."
cub kafka-ready -b kafka:29092 1 30

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
