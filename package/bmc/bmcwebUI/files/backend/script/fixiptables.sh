#!/bin/bash

# Kiểm tra đầu vào: cần ít nhất 3 tham số: tableName, chainName, rule_indexes
if [ "$#" -lt 3 ]; then
    echo '{"error": "Thiếu tham số đầu vào: cần bảng, chain, rule_indexes"}'
    exit 1
fi

TABLE_NAME="$1"
CHAIN_NAME="$2"

# Lấy các rule indexes (tất cả các tham số từ vị trí thứ 3 trở đi)
RULE_INDEXES=("${@:3}")

# Kiểm tra bảng hợp lệ
VALID_TABLES=("nat" "mangle" "filter")
if [[ ! " ${VALID_TABLES[@]} " =~ " $TABLE_NAME " ]]; then
    echo '{"error": "Tên bảng không hợp lệ"}'
    exit 1
fi

# Kiểm tra chain hợp lệ dựa trên bảng
case "$TABLE_NAME" in
  "nat")
    VALID_CHAINS=("PREROUTING" "INPUT" "OUTPUT" "POSTROUTING")
    ;;
  "filter")
    VALID_CHAINS=("INPUT" "FORWARD" "OUTPUT")
    ;;
  "mangle")
    VALID_CHAINS=("PREROUTING" "INPUT" "FORWARD" "OUTPUT" "POSTROUTING")
    ;;
  *)
    echo '{"error": "Bảng không hợp lệ"}'
    exit 1
    ;;
esac

if [[ ! " ${VALID_CHAINS[@]} " =~ " $CHAIN_NAME " ]]; then
    echo "{\"error\": \"Chain không hợp lệ cho bảng $TABLE_NAME\"}"
    exit 1
fi

# Sắp xếp các rule index giảm dần để tránh thay đổi thứ tự sau mỗi lần xóa
IFS=$'\n' SORTED_INDEXES=($(sort -r -n <<<"${RULE_INDEXES[*]}"))
unset IFS

delete_results=()

for idx in "${SORTED_INDEXES[@]}"; do
    DELETE_CMD="sudo iptables -t $TABLE_NAME -D $CHAIN_NAME $idx"
    output=$(eval "$DELETE_CMD" 2>&1)
    exit_status=$?
    if [ $exit_status -eq 0 ]; then
        delete_results+=("{\"rule_index\": \"$idx\", \"status\": \"deleted\"}")
    else
        escaped_output=$(echo "$output" | tr -d '\000-\037' | sed 's/"/\\"/g')
        delete_results+=("{\"rule_index\": \"$idx\", \"status\": \"error\", \"message\": \"$escaped_output\"}")
    fi
done

# Lấy thông tin iptables mới cho tất cả các chain hợp lệ trong bảng
default_policies_str="{"
rules_str="{"

for chain in "${VALID_CHAINS[@]}"; do
  chain_output=$(sudo iptables -t $TABLE_NAME -L $chain -n --line-numbers 2>&1)
  default_policy=$(echo "$chain_output" | head -n 1 | grep -oP '(?<=\(policy )\w+(?=\))')
  if [ -z "$default_policy" ]; then
    default_policy="N/A"
  fi
  default_policies_str+="\"$chain\":\"$default_policy\","  
  rules_array="["
  rules_lines=$(echo "$chain_output" | tail -n +3)
  while IFS= read -r rule_line; do
    [ -z "$rule_line" ] && continue
    lineNumber=$(echo "$rule_line" | awk '{print $1}')
    action=$(echo "$rule_line" | awk '{print $2}')
    details=$(echo "$rule_line" | cut -d' ' -f3- | sed 's/ *$//')
    details=$(echo "$details" | sed 's/"/\\"/g')
    rules_array+="{\"lineNumber\":\"$lineNumber\",\"action\":\"$action\",\"details\":\"$details\"},"
  done <<< "$rules_lines"
  rules_array=$(echo "$rules_array" | sed 's/,$//')
  rules_array+="]"
  rules_str+="\"$chain\":$rules_array,"
done

default_policies_str=$(echo "$default_policies_str" | sed 's/,$//')
default_policies_str+="}"
rules_str=$(echo "$rules_str" | sed 's/,$//')
rules_str+="}"

RESULT_JSON=$(cat <<EOF
{
  "default_policies": $default_policies_str,
  "rules": $rules_str,
  "table": "$TABLE_NAME",
  "chain": "$CHAIN_NAME",
  "delete_results": [$(IFS=,; echo "${delete_results[*]}")],
  "timestamp": "$(date +%Y-%m-%dT%H:%M:%S%z)"
}
EOF
)

echo "$RESULT_JSON" | jq .
exit 0

