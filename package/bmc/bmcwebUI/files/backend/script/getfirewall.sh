#!/bin/bash

# Kiểm tra đầu vào
if [ "$#" -ne 1 ]; then
    exit 1  # Không làm gì nếu đầu vào không đúng
fi

TABLE_NAME="$1"

# Kiểm tra bảng hợp lệ
VALID_TABLES=("nat" "mangle" "filter")
if [[ ! " ${VALID_TABLES[@]} " =~ " $TABLE_NAME " ]]; then
    exit 1  # Không làm gì nếu tên bảng không hợp lệ
fi

# Hàm lấy dữ liệu iptables từ firewall với số thứ tự (line numbers)
get_iptables_data() {
    sudo iptables -t $TABLE_NAME -L --line-numbers -n
}

TABLE_DATA=$(get_iptables_data)

# Khởi tạo các biến cho default_policies và rules
default_policies=()
rules_prerouting=()
rules_input=()
rules_output=()
rules_forward=()
rules_postrouting=()

# Biến lưu tên chain hiện tại (sẽ được thay đổi khi gặp dòng "Chain")
current_chain=""

# Phân loại các chain cần thêm vào rules dựa trên bảng
case "$TABLE_NAME" in
  "nat")
    valid_chains=("PREROUTING" "INPUT" "OUTPUT" "POSTROUTING")
    ;;
  "filter")
    valid_chains=("INPUT" "FORWARD" "OUTPUT")
    ;;
  "mangle")
    valid_chains=("PREROUTING" "INPUT" "FORWARD" "OUTPUT" "POSTROUTING")
    ;;
  *)
    exit 1  # Không làm gì nếu tên bảng không hợp lệ
    ;;
esac

while IFS= read -r line; do
#   # In ra từng dòng để debug
#   echo "### Dòng đang xử lý: $line"

  # Nếu gặp dòng chứa "Chain", cập nhật current_chain và default policy (nếu có)
  if [[ "$line" =~ ^Chain ]]; then
      current_chain=$(echo "$line" | awk '{print $2}')
      policy=$(echo "$line" | grep -oP "(?<=policy )\w+")
      if [[ " ${valid_chains[@]} " =~ " $current_chain " ]]; then
          default_policies+=("\"$current_chain\": \"$policy\"")
      fi
  # Nếu là dòng rule có số thứ tự (bắt đầu bằng số)
  elif [[ "$line" =~ ^[0-9]+ ]]; then
      lineNumber=$(echo "$line" | awk '{print $1}')
      action=$(echo "$line" | awk '{print $2}')
      # Phần details từ cột 3 trở đi (bao gồm tất cả các chuỗi string)
      details=$(echo "$line" | cut -d ' ' -f 3-)


      # Nếu không có -j (action), gán action = NULL
        if [[ "$action" != "NULL" && ! "$action" =~ ^(ACCEPT|DROP|REJECT|LOG|SNAT|DNAT|MASQUERADE|REDIRECT|TARPIT|RETURN|MARK|QUEUE|CT)$ ]]; then
          action="NULL"
      fi

      # Kiểm tra nếu action là LOG, thì xử lý thêm các tùy chọn LOG
      if [[ "$action" == "LOG" ]]; then
          # Escape dấu ngoặc kép trong chuỗi "prefix"
          details=$(echo "$line" | cut -d ' ' -f 3- | sed 's/"/\\"/g')  # Thêm escape cho dấu ngoặc kép
      fi

      # Debug: Kiểm tra action và details sau khi xử lý
    #   echo "Final action: $action"
    #   echo "Final details: $details"

      # Phân loại rule theo chain hiện tại
      if [[ " ${valid_chains[@]} " =~ " $current_chain " ]]; then
          json_rule="{\"lineNumber\": $lineNumber, \"action\": \"$action\", \"details\": \"$details\"}"
          case "$current_chain" in
              "PREROUTING")
                  rules_prerouting+=("$json_rule")
                  ;;
              "INPUT")
                  rules_input+=("$json_rule")
                  ;;
              "OUTPUT")
                  rules_output+=("$json_rule")
                  ;;
              "FORWARD")
                  rules_forward+=("$json_rule")
                  ;;
              "POSTROUTING")
                  rules_postrouting+=("$json_rule")
                  ;;
          esac
      fi
  fi
done <<< "$TABLE_DATA"


# Nếu không có dữ liệu hợp lệ, không trả về gì
if [ ${#default_policies[@]} -eq 0 ] && [ ${#rules_prerouting[@]} -eq 0 ] && [ ${#rules_input[@]} -eq 0 ] && [ ${#rules_output[@]} -eq 0 ] && [ ${#rules_forward[@]} -eq 0 ] && [ ${#rules_postrouting[@]} -eq 0 ]; then
    exit 1
fi

# Chuyển danh sách default_policies thành một chuỗi JSON
default_policies_json=$(IFS=,; echo "{${default_policies[*]}}")

# Chuyển danh sách rules thành một chuỗi JSON
rules_prerouting_json=$(IFS=,; echo "[${rules_prerouting[*]}]")
rules_input_json=$(IFS=,; echo "[${rules_input[*]}]")
rules_output_json=$(IFS=,; echo "[${rules_output[*]}]")
rules_forward_json=$(IFS=,; echo "[${rules_forward[*]}]")
rules_postrouting_json=$(IFS=,; echo "[${rules_postrouting[*]}]")

# Tạo JSON cuối cùng
json_output=$(cat <<EOF
{
  "default_policies": $default_policies_json,
  "rules": {
    "PREROUTING": $rules_prerouting_json,
    "INPUT": $rules_input_json,
    "OUTPUT": $rules_output_json,
    "FORWARD": $rules_forward_json,
    "POSTROUTING": $rules_postrouting_json
  },
  "timestamp": "$(date +%Y-%m-%dT%H:%M:%S%z)"
}
EOF
)


# Lưu JSON vào file
echo "$json_output" > "iptables_${TABLE_NAME}_output.json"


# Hiển thị JSON trên console (định dạng đẹp nếu có jq)
echo "$json_output" | jq .




