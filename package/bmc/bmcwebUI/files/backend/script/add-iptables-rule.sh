#!/bin/bash
# File: ./script/add-iptables-rule.sh

# Kiểm tra số lượng tham số
if [ "$#" -ne 1 ]; then
    echo '{"error": "Sai số lượng tham số. Sử dụng: '$0' <rule>"}'
    exit 1
fi

RULE="$1"

# Xây dựng lệnh iptables với rule nhận được
COMMAND="sudo iptables $RULE"

# Thực thi lệnh trên máy local
OUTPUT=$(eval "$COMMAND" 2>&1)

if [ $? -eq 0 ]; then
    echo "{\"success\": \"Rule added successfully\", \"rule\": \"$RULE\"}"
else
    echo "{\"error\": \"Failed to add rule\", \"output\": \"$OUTPUT\"}"
    exit 1
fi
