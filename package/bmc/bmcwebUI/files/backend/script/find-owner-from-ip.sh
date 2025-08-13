#!/bin/bash

# Kiểm tra số lượng tham số
if [ "$#" -ne 1 ]; then
    echo '{"error": "Sai số lượng tham số. Sử dụng: '$0' <ip>"}'
    exit 1
fi

TARGET_IP="$1"
MAC_WHITELIST="/home/bmc/mac_list/mac_whitelist.txt"

# Lấy MAC Address từ IP
MAC_ADDRESS=$(arp -an | grep -w "$TARGET_IP" | awk '{print $4}')
if [ -z "$MAC_ADDRESS" ]; then
    echo '{"error": "Không tìm thấy địa chỉ MAC cho IP '$TARGET_IP'"}'
    exit 1
fi

# Kiểm tra MAC trong danh sách whitelist
OWNER=$(grep -i "$MAC_ADDRESS" "$MAC_WHITELIST" | awk -F ' - ' '{print $2}')
if [ -z "$OWNER" ]; then
    OWNER="unknown"
fi

# Xuất thông tin dưới dạng JSON
cat <<EOF
{
  "ip": "$TARGET_IP",
  "mac": "$MAC_ADDRESS",
  "owner": "$OWNER"
}
EOF
