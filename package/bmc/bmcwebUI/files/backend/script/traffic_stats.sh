#!/bin/bash

# Kiểm tra số lượng tham số
if [ "$#" -ne 1 ]; then
    echo '{"error": "Sai số lượng tham số. Sử dụng: '$0' <log_file>"}'
    exit 1
fi

LOG_FILE="$1"

# Đọc dữ liệu log trực tiếp từ file local
LOG_DATA=$(cat "$LOG_FILE")

# Phân tích dữ liệu log (ví dụ: đếm số dòng)
LINE_COUNT=$(echo "$LOG_DATA" | wc -l)

# Xuất thông tin dưới dạng JSON
cat <<EOF
{
  "line_count": $LINE_COUNT,
  "log_file": "$LOG_FILE"
}
EOF
