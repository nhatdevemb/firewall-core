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


UBUS_OUT=$(ubus call system board 2>/dev/null)
[ -z "$UBUS_OUT" ] && print_error_json "Failed to get system board info via ubus"

MODEL=$(echo "$UBUS_OUT" | jsonfilter -e '@.model')
BOARD_NAME=$(echo "$UBUS_OUT" | jsonfilter -e '@.board_name')
FIRMWARE=$(echo "$UBUS_OUT" | jsonfilter -e '@.release.description')


UPTIME_SECS=$(cut -d. -f1 /proc/uptime)

format_uptime() {
  local total_secs=$1
  local days=$((total_secs / 86400))
  local hours=$(( (total_secs % 86400) / 3600 ))
  local minutes=$(( (total_secs % 3600) / 60 ))

  local result=""
  [ "$days" -gt 0 ] && result="${result}${days} days, "
  [ "$hours" -gt 0 ] && result="${result}${hours} hours, "
  result="${result}${minutes} minutes"

  echo "$result"
}

UPTIME_FORMATTED=$(format_uptime "$UPTIME_SECS")

json_data="{
  \"model\": \"$MODEL\",
  \"board_name\": \"$BOARD_NAME\",
  \"firmware\": \"$FIRMWARE\",
  \"uptime\": \"$UPTIME_FORMATTED\"
}"


print_success_json "$json_data"
