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

CORES=$(grep -c '^processor' /proc/cpuinfo)

get_cpu_stat() {
    awk '/^cpu / {idle=$5; total=0; for(i=2;i<=NF;i++) total+=$i; print idle, total}' /proc/stat
}

read -r IDLE1 TOTAL1 < <(get_cpu_stat)
sleep 1
read -r IDLE2 TOTAL2 < <(get_cpu_stat)

IDLE_DIFF=$((IDLE2 - IDLE1))
TOTAL_DIFF=$((TOTAL2 - TOTAL1))


if [ "$TOTAL_DIFF" -eq 0 ]; then
    CPU_USED=0
else
    CPU_USED=$((100 * (TOTAL_DIFF - IDLE_DIFF) / TOTAL_DIFF))
fi

USED_CORES_FLOAT=$(awk "BEGIN {printf \"%.2f\", $CPU_USED * $CORES / 100}")
USED_CORES=${USED_CORES_FLOAT%.*}


json_data="{
  \"cores\": $CORES,
  \"percent_used\": $CPU_USED,
  \"used_cores\": $USED_CORES
}"

print_success_json "$json_data"
