#!/bin/sh

# Script to manage WAN mode setup on OpenWrt
# Supports 'get' mode to retrieve current WAN information (JSON) and 'set' mode to configure WAN.
# All console output is in JSON with a 'status'. Debug messages go to /var/log/messages.

# Default configuration variable
WAN_INTERFACE="wan"

# Function to log messages to syslog (var/log/messages)
log_debug() {
    logger -t "wan_setup" "$1"
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

# --- Helper function to retrieve runtime information ---
# Extracts data from ubus and sets shell variables
get_runtime_wan_data() {
    log_debug "Attempting to get runtime WAN data for interface: ${WAN_INTERFACE}"
    ubus_status=$(ubus call network.interface.${WAN_INTERFACE} status 2>/dev/null)

    if [ -z "$ubus_status" ]; then
        log_debug "ubus call returned no data for interface ${WAN_INTERFACE}"
        return
    fi
    RUNTIME_IPADDR=$(echo "$ubus_status" | jsonfilter -e '@.ipv4_address[0].address')
    RUNTIME_NETMASK=$(echo "$ubus_status" | jsonfilter -e '@.ipv4_address[0].mask')
    RUNTIME_GATEWAY=$(echo "$ubus_status" | jsonfilter -e '@.ipv4_address[0].gateway')
    
    dns_servers_array=$(echo "$ubus_status" | jsonfilter -e '@.dns_servers')
    
    # Extract DNS servers and join them with a space
    RUNTIME_DNS=""
    if [ -n "$dns_servers_array" ]; then
        # Remove JSON array brackets and quotes, then replace commas with spaces
        RUNTIME_DNS=$(echo "$dns_servers_array" | sed -e 's/^\["//' -e 's/"\]$//' -e 's/","/\ /g')
    fi
    log_debug "Runtime data collected: IP=${RUNTIME_IPADDR}, Netmask=${RUNTIME_NETMASK}, Gateway=${RUNTIME_GATEWAY}, DNS=${RUNTIME_DNS}"
}


if [ -z "$1" ]; then
    print_error_json "Missing command. Usage: $0 [get|set]"
fi

case "$1" in
    get)
        log_debug "Executing GET command."
        # GET mode: Returns current WAN configuration and runtime status in unified JSON
        CURRENT_PROTO=$(uci get network.${WAN_INTERFACE}.proto 2>/dev/null)
        log_debug "Current UCI protocol for ${WAN_INTERFACE}: ${CURRENT_PROTO}"
        
        # Get runtime information
        get_runtime_wan_data # This function will set RUNTIME_IPADDR, RUNTIME_NETMASK, etc.

        display_ipaddr="${RUNTIME_IPADDR:-}"
        display_netmask="${RUNTIME_NETMASK:-}"
        display_gateway="${RUNTIME_GATEWAY:-}"
        display_dns="${RUNTIME_DNS:-}"

        if [ "$CURRENT_PROTO" = "static" ]; then
            log_debug "WAN is configured as static. Prioritizing UCI config for display."
            display_ipaddr=$(uci get network.${WAN_INTERFACE}.ipaddr 2>/dev/null)
            display_netmask=$(uci get network.${WAN_INTERFACE}.netmask 2>/dev/null)
            display_gateway=$(uci get network.${WAN_INTERFACE}.gateway 2>/dev/null)
            display_dns=$(uci get network.${WAN_INTERFACE}.dns 2>/dev/null | tr '\n' ' ')
        else
            log_debug "WAN is configured as DHCP or unknown. Displaying runtime data."
        fi
        
        echo "{"
        echo "  \"status\": 0,"
        echo "  \"interface\": \"${WAN_INTERFACE}\","
        echo "  \"mode\": \"${CURRENT_PROTO:-unknown}\","
        echo "  \"ipaddr\": \"${display_ipaddr}\","
        echo "  \"netmask\": \"${display_netmask}\","
        echo "  \"gateway\": \"${display_gateway}\","
        echo "  \"dns\": \"${display_dns}\""
        echo "}"
        ;;
    set)
        log_debug "Executing SET command."
        # SET mode: Configure WAN
        if [ -z "$2" ]; then
            print_error_json "Missing WAN mode. Specify 'dhcp' or 'static'."
        fi

        WAN_MODE="$2"
        log_debug "Requested WAN mode: ${WAN_MODE}"

        case "$WAN_MODE" in
            dhcp)
                log_debug "Configuring WAN mode to DHCP."
                uci set network.${WAN_INTERFACE}.proto='dhcp'
                uci delete network.${WAN_INTERFACE}.ipaddr
                uci delete network.${WAN_INTERFACE}.netmask
                uci delete network.${WAN_INTERFACE}.gateway
                uci delete network.${WAN_INTERFACE}.dns
                ;;
            static)
                if [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                    print_error_json "Missing required parameters for static mode: IP_ADDRESS, NETMASK, GATEWAY."
                fi

                STATIC_IP="$3"
                NETMASK="$4"
                GATEWAY="$5"
                DNS_SERVERS=""

                if [ -n "$6" ]; then
                    DNS_SERVERS="$6"
                fi
                if [ -n "$7" ]; then
                    if [ -n "$DNS_SERVERS" ]; then
                        DNS_SERVERS="${DNS_SERVERS} $7"
                    else
                        DNS_SERVERS="$7"
                    fi
                fi

                log_debug "Configuring WAN mode to Static IP with parameters: IP=${STATIC_IP}, Netmask=${NETMASK}, Gateway=${GATEWAY}, DNS=${DNS_SERVERS:-'None'}"

                uci set network.${WAN_INTERFACE}.proto='static'
                uci set network.${WAN_INTERFACE}.ipaddr="${STATIC_IP}"
                uci set network.${WAN_INTERFACE}.netmask="${NETMASK}"
                uci set network.${WAN_INTERFACE}.gateway="${GATEWAY}"

                if [ -n "$DNS_SERVERS" ]; then
                    uci set network.${WAN_INTERFACE}.dns="${DNS_SERVERS}"
                else
                    uci delete network.${WAN_INTERFACE}.dns
                fi
                ;;
            *)
                print_error_json "Invalid WAN mode for set command: '$WAN_MODE'. Must be 'dhcp' or 'static'."
                ;;
        esac

        log_debug "Saving configuration and restarting interface ${WAN_INTERFACE}..."
        uci commit network
        ifup "${WAN_INTERFACE}"
        print_success_json "WAN mode successfully set to ${WAN_MODE} and interface restarted."
        ;;
    *)
        print_error_json "Invalid command: '$1'. Usage: $0 [get|set]"
        ;;
esac