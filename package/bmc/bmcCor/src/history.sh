#!/bin/sh
# Script to generate per-client DNS access logs in JSON format (OpenWrt)

# Function: Print error message in JSON
print_error_json() {
    local message="$1"
    echo "{"
    echo "  \"status\": \"-1\","
    echo "  \"message\": \"$message\""
    echo "}"
    exit 1
}

# Function: Print success message in JSON
print_success_json() {
    local json_data="$1"
    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": $json_data"
    echo "}"
    exit 0
}

# Configuration
DNS_LOG="/var/log/dnsmasq.log"          # Path to dnsmasq log
LEASES_FILE="/tmp/dhcp.leases"          # DHCP leases for IP–MAC mapping

# Check files
[ -f "$DNS_LOG" ] || print_error_json "DNS log file not found at $DNS_LOG"
[ -f "$LEASES_FILE" ] || print_error_json "DHCP leases file not found at $LEASES_FILE"

# Export leases file path for awk
export LEASES_FILE

# Parse and generate JSON output
JSON_DATA=$(awk '
BEGIN {
    FS=" ";
    print "[";
    first_client = 1;
}
# Capture DNS query log lines
/\<query/ {
    ip = $NF;
    domain = $(NF-2);  # domain appears before "from"
    time = strftime("%Y-%m-%d %H:%M:%S", systime());
    if (ip && domain) {
        if (!(ip in seen)) {
            seen[ip] = 1;
            domains[ip] = "";
        }
        domains[ip] = domains[ip] (domains[ip] ? "," : "") "{\"time\": \"" time "\", \"domain\": \"" domain "\"}";
    }
}
END {
    # Load IP–MAC from DHCP leases
    while ((getline < ENVIRON["LEASES_FILE"]) > 0) {
        mac = $2;
        ip = $3;
        if (ip in seen && mac) {
            if (!first_client) print ",";
            first_client = 0;
            print "  {\"ip\": \"" ip "\", \"mac\": \"" mac "\", \"accesses\": [" domains[ip] "]}";
        }
    }
    print "]";
}' "$DNS_LOG")

# Check if data is empty
if [ "$JSON_DATA" = "[]" ]; then
    print_error_json "No access data found"
fi

# Output
print_success_json "$JSON_DATA"

