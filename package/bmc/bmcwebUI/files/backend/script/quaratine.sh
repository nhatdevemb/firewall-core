#!/bin/bash

# Kiểm tra số lượng tham số đầu vào
if [ "$#" -eq 1 ]; then
    # Chế độ lấy thông tin từ IP -> MAC
    TARGET_IP="$1"
    MAC_WHITELIST="/home/bmc/mac_list/mac_whitelist.txt"
    # Lấy MAC Address từ IP
    MAC_ADDRESS=$(arp -an | grep "${TARGET_IP}" | awk '{print $4}')
    if [ -z "$MAC_ADDRESS" ]; then
        echo '{"error": "Không tìm thấy địa chỉ MAC cho IP '$TARGET_IP'"}'
        exit 1
    fi
    # Kiểm tra MAC trong danh sách whitelist
    OWNER=$(grep -i "$MAC_ADDRESS" "$MAC_WHITELIST" | awk -F ' - ' '{print $2}')
    if [ -z "$OWNER" ]; then
        OWNER="unknown"
    fi
    # Lấy thông tin từ iptables
    RULE_INFO=$(sudo iptables -L FORWARD -n -v)
    LINE=$(echo "$RULE_INFO" | grep -i "$MAC_ADDRESS" | tr -s ' ')
    if [ -z "$LINE" ]; then
        echo '{"error": "Không tìm thấy thông tin quy tắc cho MAC '$MAC_ADDRESS'"}'
        exit 1
    fi
    read -r PKTS BYTES TARGET PROT OPT IN OUT SOURCE DESTINATION EXTRA <<< "$LINE"
    PROT="${PROT:-unknown}"
    OPT="${OPT:-unknown}"
    IN="${IN:-unknown}"
    OUT="${OUT:-unknown}"
    SOURCE="${SOURCE:-unknown}"
    DESTINATION="${DESTINATION:-unknown}"
    EXTRA="${EXTRA:-unknown}"
    STATUS="$TARGET"
    echo '{
        "macAddress": "'$MAC_ADDRESS'",
        "owner": "'$OWNER'",
        "pkts": "'$PKTS'",
        "bytes": "'$BYTES'",
        "target": "'$TARGET'",
        "prot": "'$PROT'",
        "opt": "'$OPT'",
        "in": "'$IN'",
        "out": "'$OUT'",
        "source": "'$SOURCE'",
        "destination": "'$DESTINATION'",
        "status": "'$STATUS'"
    }'
elif [ "$#" -eq 2 ]; then
    # Chế độ cập nhật trạng thái: <MAC_ADDRESS> <ACTION>
    MAC_ADDRESS="$1"
    ACTION="$2"
    if [ "$ACTION" != "ACCEPT" ] && [ "$ACTION" != "DROP" ]; then
        echo '{"error": "Hành động không hợp lệ. Chỉ chấp nhận ACCEPT hoặc DROP."}'
        exit 1
    fi
    # Xóa quy tắc cũ
    sudo iptables -D FORWARD -m mac --mac-source $MAC_ADDRESS -j ACCEPT 2>/dev/null
    sudo iptables -D FORWARD -m mac --mac-source $MAC_ADDRESS -j DROP 2>/dev/null
    # Thêm quy tắc mới (-I để chèn lên đầu danh sách)
    sudo iptables -I FORWARD 1 -m mac --mac-source $MAC_ADDRESS -j $ACTION
    echo '{"success": "Cập nhật thành công địa chỉ MAC '$MAC_ADDRESS' với hành động '$ACTION'"}'
else
    echo '{"error": "Sai số lượng tham số. Sử dụng: '$0' <IP> hoặc '$0' <MAC_ADDRESS> <ACTION>"}'
    exit 1
fi
