#!/bin/sh

LEASES_FILE="/tmp/dhcp.leases"

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

if [ ! -f "$LEASES_FILE" ]; then
  print_error_json "No DHCP leases file found"
fi

json_array="["
COUNT=$(wc -l < "$LEASES_FILE")
i=0

while read -r lease; do
  i=$((i+1))
  set -- $lease
  expires=$1
  mac=$2
  ip=$3
  hostname=$4

  remaining=$((expires - $(date +%s)))
  [ "$remaining" -lt 0 ] && remaining=0

  json_array="$json_array
  {
    \"ip\": \"$ip\",
    \"mac\": \"$mac\",
    \"hostname\": \"${hostname:-unknown}\",
    \"lease_remaining\": $remaining
  }"

  [ "$i" -lt "$COUNT" ] && json_array="$json_array," || true
done < "$LEASES_FILE"

json_array="$json_array
]"

print_success_json "$json_array"
