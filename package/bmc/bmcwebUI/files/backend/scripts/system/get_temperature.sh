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

first=1
for zone in /sys/class/thermal/thermal_zone*; do
  [ -f "$zone/temp" ] || continue
  name=$(cat "$zone/type")
  temp_raw=$(cat "$zone/temp")
  temp_c=$(awk "BEGIN {printf \"%.1f\", $temp_raw / 1000}")

  entry="  {
    \"sensor\": \"${name}\",
    \"temp_c\": ${temp_c}
  }"

  if [ "$first" -eq 1 ]; then
    json_array="$json_array
$entry"
    first=0
  else
    json_array="$json_array,
$entry"
  fi
done

json_array="$json_array
]"

print_success_json "$json_array"
