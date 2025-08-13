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

LINES=50

json_array=$(logread | tail -n "$LINES" | awk -v lines="$LINES" '
BEGIN { print "[" }
{
  timestamp = $1 " " $2 " " $3
  $1 = $2 = $3 = ""
  sub(/^ +/, "", $0)
  gsub(/"/, "\\\"", $0)
  printf "  {\"timestamp\": \"%s\", \"message\": \"%s\"}", timestamp, $0
  if (NR != lines) {
    print ","
  } else {
    print ""
  }
}
END { print "]" }
')

print_success_json "$json_array"
