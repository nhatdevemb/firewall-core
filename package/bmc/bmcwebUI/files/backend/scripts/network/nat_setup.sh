#!/bin/sh

# Script to manage NAT (Masquerading) on OpenWrt
# Supports 'get' mode to retrieve current NAT status (JSON) and 'set' mode to enable/disable NAT.
# All console output is in JSON with a 'status'. Debug messages go to /var/log/messages.

# Default configuration variable
WAN_FIREWALL_ZONE="wan" # The firewall zone corresponding to your WAN interface

# Function to log messages to syslog (/var/log/messages)
log_debug() {
    logger -t "nat_setup" "$1"
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


if [ -z "$1" ]; then
    print_error_json "Missing command. Usage: $0 [get|set]"
fi

case "$1" in
    get)
        log_debug "Executing GET command for NAT status."
        ZONE_INDEX=$(uci show firewall | grep "name='wan'" | sed -n "s/^firewall.@zone\[\([0-9]\+\)\].*/\1/p")

        if [ -z "$ZONE_INDEX" ]; then
        echo '{ "error": "WAN zone not found" }'
        exit 1
        fi

        NAT=$(uci get firewall.@zone["$ZONE_INDEX"].masq 2>/dev/null)

        if [ "$NAT" = "1" ]; then
            DISPLAY_STATUS="enabled"
        elif [ "$NAT" = "0" ]; then
            DISPLAY_STATUS="disabled"
        else
            DISPLAY_STATUS="unknown"
        fi
        
        log_debug "Current NAT (masquerading) status for zone ${WAN_FIREWALL_ZONE}: ${DISPLAY_STATUS}"

        echo "{"
        echo "  \"status\": 0,"
        echo "  \"feature\": \"NAT\","
        echo "  \"zone\": \"${WAN_FIREWALL_ZONE}\","
        echo "  \"status\": \"${DISPLAY_STATUS}\""
        echo "}"
        ;;
    set)
        log_debug "Executing SET command for NAT status."
        # SET mode: Enable/Disable NAT
        if [ -z "$2" ]; then
            print_error_json "Missing NAT status. Specify 'enable' or 'disable'."
        fi

        NAT_STATUS="$2"
        
        case "$NAT_STATUS" in
            enable)
                log_debug "Setting NAT (masquerading) to enabled for zone ${WAN_FIREWALL_ZONE}."
                uci set firewall.${WAN_FIREWALL_ZONE}.masq='1'
                ;;
            disable)
                log_debug "Setting NAT (masquerading) to disabled for zone ${WAN_FIREWALL_ZONE}."
                uci set firewall.${WAN_FIREWALL_ZONE}.masq='0'
                ;;
            *)
                print_error_json "Invalid NAT status: '$NAT_STATUS'. Must be 'enable' or 'disable'."
                ;;
        esac

        log_debug "Saving firewall configuration and restarting firewall service..."
        uci commit firewall
        /etc/init.d/firewall restart # Important: firewall service restart is needed for NAT changes

        print_success_json "NAT successfully set to ${NAT_STATUS} and firewall restarted."
        ;;
    *)
        print_error_json "Invalid command: '$1'. Usage: $0 [get|set]"
        ;;
esac