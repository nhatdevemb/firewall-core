#!/bin/sh

# Function to log messages to syslog (/var/log/messages)
log_debug() {
    logger -t "operation_mode_setup" "$1"
}

# Function to print JSON error message and exit
print_error_json() {
    local message="$1"
    echo "{"
    echo "  \"status\": -1,"
    echo "  \"message\": \"Error: ${message}\""
    echo "}"
    exit 1
}

# Function to print JSON success message (for set operations)
print_success_json() {
    local message="$1"
    echo "{"
    echo "  \"status\": 0,"
    echo "  \"message\": \"${message}\""
    echo "}"
    exit 0
}

# Detect current network mode: bridge or route
get_mode() {
    if uci get network.wan >/dev/null 2>&1; then
        mode="route"
    else
        mode="bridge"
    fi
    echo "{"
    echo "  \"status\": 0,"
    echo "  \"mode\": \"$mode\""
    echo "}"
}

# Set network mode
set_mode() {
    mode="$1"

    if [ "$mode" != "bridge" ] && [ "$mode" != "route" ]; then
        echo "Invalid mode: '$mode'. Allowed values: bridge, route"
        exit 1
    fi
 
    if [ "$mode" = "bridge" ]; then
        log_debug "[*] Switching to BRIDGE mode..."
        uci delete network.wan 2>/dev/null
        uci delete network.wan6 2>/dev/null
        uci set network.lan.proto='dhcp'
        uci set dhcp.lan.ignore='1'
    elif [ "$mode" = "route" ]; then #need combine with other script, which set LAN DHCP range, and set IP br-lan also 
        log_debug "[*] Switching to ROUTE mode..."
        uci set network.wan=interface
        uci set network.wan.device='eth0'
        uci set network.wan.proto='dhcp'
        uci set network.lan.proto='static'
        uci set dhcp.lan.ignore='0'
    fi

    uci commit network
    uci commit dhcp
    sleep 1 #sleep for make sure configs are applied
    /etc/init.d/network restart
    print_success_json "${mode^} mode set successfully"
}

# Entry point
case "$1" in
    get)
        get_mode
        ;;
    set)
        if [ -z "$2" ]; then
            print_error_json "Missing mode name. Usage: $0 set [bridge|route]"
        fi
        set_mode "$2"
        ;;
    *)
        print_error_json "Unknown command: '$1'. Usage: $0 get   $0 set [bridge|route]"
        ;;
esac