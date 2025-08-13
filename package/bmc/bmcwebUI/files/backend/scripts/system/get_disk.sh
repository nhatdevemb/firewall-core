#!/bin/sh

print_error_json() {
    local message="$1"
    echo "{"
    echo "  \"status\": \"-1\","
    echo "  \"message\": \"$message\""
    echo "}"
    exit 1
}

print_success_json() {
    local json_data="$1"
    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": $json_data"
    echo "}"
    exit 0
}

json_array="["

df -m | awk 'NR>1 {print $6,$2,$3}' | while read -r mount total used; do
    percent=$((used * 100 / total))
    json_array="$json_array
  {
    \"mount\": \"${mount}\",
    \"used\": ${used},
    \"total\": ${total},
    \"percent\": ${percent}
  },"
done

json_array=$(echo "$json_array" | sed '$s/},$/}/')
json_array="$json_array
]"

print_success_json "$json_array"
