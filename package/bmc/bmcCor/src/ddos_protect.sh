#!/bin/sh

CHAIN="FW_DOS_POLICY"

print_success_json() {
    local msg="$1"
    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": \"$msg\""
    echo "}"
    exit 0
}

print_error_json() {
    local msg="$1"
    echo "{"
    echo "  \"status\": \"-1\","
    echo "  \"message\": \"$msg\""
    echo "}"
    exit 1
}

enable_dos_policy() {
    iptables -N $CHAIN 2>/dev/null
    iptables -C INPUT -j $CHAIN 2>/dev/null || iptables -A INPUT -j $CHAIN

    # --- SYN Flood ---
    iptables -A $CHAIN -p tcp --syn -i eth0 -m limit --limit 20/s --limit-burst 40 -j RETURN
    iptables -A $CHAIN -p tcp --syn -i eth0 -j LOG --log-prefix "[DDOS] SYN DROP: "
    iptables -A $CHAIN -p tcp --syn -i eth0 -j DROP

    # --- UDP Flood ---
    iptables -A $CHAIN -p udp -i eth0 -m limit --limit 100/s --limit-burst 150 -j RETURN
    iptables -A $CHAIN -p udp -i eth0 -j LOG --log-prefix "[DDOS] UDP DROP: "
    iptables -A $CHAIN -p udp -i eth0 -j DROP

    # --- ICMP Flood ---
    iptables -A $CHAIN -p icmp -i eth0 -m limit --limit 1/s --limit-burst 5 -j RETURN
    iptables -A $CHAIN -p icmp -i eth0 -j LOG --log-prefix "[DDOS] ICMP DROP: "
    iptables -A $CHAIN -p icmp -i eth0 -j DROP

    # --- SSH Brute-force ---
    iptables -A $CHAIN -p tcp --dport 22 -i eth0 -m recent --name ssh --set
    iptables -A $CHAIN -p tcp --dport 22 -i eth0 -m recent --name ssh --update --seconds 60 --hitcount 5 -j LOG --log-prefix "[BRUTE SSH]: "
    iptables -A $CHAIN -p tcp --dport 22 -i eth0 -m recent --name ssh --update --seconds 60 --hitcount 5 -j DROP

    print_success_json "DoS policy enabled"
}

disable_dos_policy() {
    iptables -D INPUT -j $CHAIN 2>/dev/null
    iptables -F $CHAIN 2>/dev/null
    iptables -X $CHAIN 2>/dev/null
    print_success_json "DoS policy disabled"
}

case "$1" in
    enable)
        enable_dos_policy
        ;;
    disable)
        disable_dos_policy
        ;;
    *)
        print_error_json "Invalid option. Use enable or disable"
        ;;
esac
