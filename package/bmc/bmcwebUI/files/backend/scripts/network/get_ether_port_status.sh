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

PORTS=$(ls /sys/class/net | grep -E '^eth[0-9]+$|^lan[0-9]+$')


[ -z "$PORTS" ] && print_error_json "No Ethernet or LAN ports found"


json_array="["
COUNT=$(echo "$PORTS" | wc -l)
i=0

while read -r iface; do
  i=$((i+1))
  
  LINK_DETECTED=$(ethtool "$iface" 2>/dev/null | awk -F': ' '/Link detected:/ {print $2}')
  SPEED=$(ethtool "$iface" 2>/dev/null | awk -F': ' '/Speed:/ {print $2}')
  [ "$LINK_DETECTED" = "yes" ] && STATUS="active" || STATUS="inactive"
  [ -z "$SPEED" ] && SPEED="unknown"

  json_array="$json_array
  {
    \"interface\": \"$iface\",
    \"status\": \"$STATUS\",
    \"speed\": \"$SPEED\"
  }"

  [ "$i" -lt "$COUNT" ] && json_array="$json_array," || true
done <<EOF
$PORTS
EOF

json_array="$json_array
]"

print_success_json "$json_array"
