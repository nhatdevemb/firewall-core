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

total_kb=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
free_kb=$(awk '/^MemFree:/ {print $2}' /proc/meminfo)
buffers_kb=$(awk '/^Buffers:/ {print $2}' /proc/meminfo)
cached_kb=$(awk '/^Cached:/ {print $2}' /proc/meminfo)

used_kb=$((total_kb - free_kb - buffers_kb - cached_kb))

total=$((total_kb / 1024))
used=$((used_kb / 1024))
percent=$((used_kb * 100 / total_kb))

json_data="{
  \"used\": $used,
  \"total\": $total,
  \"percent\": $percent
}"

print_success_json "$json_data"
