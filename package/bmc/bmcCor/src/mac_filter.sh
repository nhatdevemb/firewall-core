#!/bin/sh

CONF_FILE="/etc/mac-filter.conf"
CHAIN="MAC_FILTER"

# Ensure config file exists
touch "$CONF_FILE"

# ======== JSON Output Helpers ========
print_error_json() {
    local msg="$1"
    echo "{"
    echo "  \"status\": \"-1\","
    echo "  \"message\": \"$msg\""
    echo "}"
    exit 1
}

print_success_json() {
    local msg="$1"
    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": \"$msg\""
    echo "}"
    exit 0
}

print_json_info() {
    mode=$(get_mode)
    status_val=$(get_status)
    macs=$(get_maclist)

    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": {"
    echo "    \"mode\": \"${mode}\","
    echo "    \"status\": \"${status_val}\","
    echo "    \"maclist\": ["

    count=$(echo "$macs" | wc -l)
    i=0

    echo "$macs" | while read -r mac; do
        i=$((i + 1))
        printf "      \"%s\"" "$mac"
        [ "$i" -lt "$count" ] && echo "," || echo
    done

    echo "    ]"
    echo "  }"
    echo "}"
    exit 0
}

# ======== Config readers ========
get_mode() {
    grep '^mode=' "$CONF_FILE" | cut -d= -f2
}
get_status() {
    grep '^status=' "$CONF_FILE" | cut -d= -f2
}
get_maclist() {
    grep '^maclist=' "$CONF_FILE" | cut -d= -f2
}

# ======== Core functions ========
set_mode() {
    mode="$1"
    case "$mode" in
        whitelist|blacklist) ;;
        *) return 1 ;;
    esac
    sed -i '/^mode=/d' "$CONF_FILE"
    echo "mode=$mode" >> "$CONF_FILE"
    apply_rules
    return 0
}

set_status() {
    status="$1"
    case "$status" in
        enable|disable) ;;
        *) return 1 ;;
    esac
    sed -i '/^status=/d' "$CONF_FILE"
    echo "status=$status" >> "$CONF_FILE"
    if [ "$status" = "enable" ]; then
        enable_chain
    else
        disable_chain
    fi
    return 0
}

add_mac() {
    mac="$1"
    grep -q "^maclist=$mac$" "$CONF_FILE" && return 1
    echo "maclist=$mac" >> "$CONF_FILE"
    apply_rules
    return 0
}

delete_mac() {
    mac="$1"
    grep -q "^maclist=$mac$" "$CONF_FILE" || return 1
    sed -i "/^maclist=$mac$/d" "$CONF_FILE"
    apply_rules
    return 0
}

# ======== iptables helpers ========
init_chain() {
    iptables -L "$CHAIN" >/dev/null 2>&1 || iptables -N "$CHAIN"
}
flush_chain() {
    while iptables -D "$CHAIN" 1 >/dev/null 2>&1; do :; done
}
enable_chain() {
    iptables -C INPUT -j "$CHAIN" 2>/dev/null || iptables -I INPUT -j "$CHAIN"
    iptables -C FORWARD -j "$CHAIN" 2>/dev/null || iptables -I FORWARD -j "$CHAIN"
}
disable_chain() {
    iptables -D INPUT -j "$CHAIN" 2>/dev/null
    iptables -D FORWARD -j "$CHAIN" 2>/dev/null
}

apply_rules() {
    mode="$(get_mode)"
    init_chain
    flush_chain
    get_maclist | while read -r mac; do
        [ -n "$mac" ] && iptables -A "$CHAIN" -m mac --mac-source "$mac" -j "$( [ "$mode" = "whitelist" ] && echo ACCEPT || echo DROP )"
    done
    [ "$mode" = "whitelist" ] && iptables -A "$CHAIN" -j DROP
    return 0
}


case "$1" in
    mode)
        [ -z "$2" ] && print_error_json "Missing mode parameter"
        set_mode "$2" && print_success_json "Mode set to $2" || print_error_json "Invalid mode"
        ;;
    enable)
        set_status enable && print_success_json "MAC filter enabled" || print_error_json "Failed to enable"
        ;;
    disable)
        set_status disable && print_success_json "MAC filter disabled" || print_error_json "Failed to disable"
        ;;
    add)
        [ -z "$2" ] && print_error_json "Missing MAC address"
        add_mac "$2" && print_success_json "MAC $2 added" || print_error_json "MAC $2 already exists"
        ;;
    delete)
        [ -z "$2" ] && print_error_json "Missing MAC address"
        delete_mac "$2" && print_success_json "MAC $2 removed" || print_error_json "MAC $2 not found"
        ;;
    info)
        print_json_info
        ;;
    *)
        print_error_json "Usage: $0 [mode|enable|disable|add|delete|info]"
        ;;
esac
