#!/bin/bash

# Kiểm tra số lượng tham số
if [ "$#" -ne 1 ]; then
    echo '{"error": "Sai số lượng tham số. Sử dụng: '$0' <log_file>"}'
    exit 1
fi

LOG_FILE="$1"

# Lấy thời gian sửa đổi cuối cùng của file log
LOG_TIME=$(stat --format='%y' /var/log/pihole/${LOG_FILE} | tr -d '\0')

# Kiểm tra định dạng file (nén hay không)
if [[ "$LOG_FILE" == *.gz ]]; then
    LOG_CONTENT=$(zcat /var/log/pihole/${LOG_FILE} | tr -d '\0')
else
    LOG_CONTENT=$(cat /var/log/pihole/${LOG_FILE} | tr -d '\0')
fi

# Xuất thông tin dưới dạng JSON
cat <<EOF
{
  "log_time": "$LOG_TIME",
  "log_content": "$(echo "$LOG_CONTENT" | sed 's/"/\\"/g')"
}
EOF
