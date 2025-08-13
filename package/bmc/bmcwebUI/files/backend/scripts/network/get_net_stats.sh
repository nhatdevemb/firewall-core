#!/bin/sh

LOGFILE="/var/log/dnsmasq.log"

print_error_json() {
    local message="$1"
    echo "{"
    echo "  \"status\": \"-1\","
    echo "  \"message\": \"$message\""
    echo "}"
    exit 1
}

print_success_json() {
    local json_data="$1"
    echo "{"
    echo "  \"status\": \"0\","
    echo "  \"message\": $json_data"
    echo "}"
    exit 0
}


TOTAL=$(conntrack -L 2>/dev/null | wc -l)
TCP=$(conntrack -L 2>/dev/null | grep -c '^tcp')
UDP=$(conntrack -L 2>/dev/null | grep -c '^udp')
OTHER=$((TOTAL - TCP - UDP))

INTERNET=$(conntrack -L 2>/dev/null | awk '
  $0 ~ /dst=/ {
    if ($0 !~ /dst=(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./)
      count++
  }
  END { print count+0 }
')

TOP_SRC=$(conntrack -L 2>/dev/null | grep -o 'src=[0-9.]*' | cut -d= -f2 | sort | uniq -c | sort -rn | head -n 5)


get_top_domains() {
  if [ -f "$LOGFILE" ]; then
    grep "query\[" "$LOGFILE" | awk '{print $(NF-2)}' | sort | uniq -c | sort -rn | head -n 10 | awk '
      BEGIN { print "[" }
      {
        printf "    {\"domain\": \"%s\", \"count\": %s}", $2, $1
        if (NR != 10) print ","
      }
      END { print "\n  ]" }
    '
  else
    echo "  []"
  fi
}


json_data="{"
json_data="$json_data
  \"sessions\": {
    \"total\": $TOTAL,
    \"tcp\": $TCP,
    \"udp\": $UDP,
    \"other\": $OTHER,
    \"internet\": $INTERNET,
    \"top_source_ips\": ["

first=1
while read -r count ip; do
  [ "$first" -eq 0 ] && json_data="$json_data,"
  json_data="$json_data
      {\"ip\": \"$ip\", \"sessions\": $count}"
  first=0
done <<EOF
$TOP_SRC
EOF

json_data="$json_data
    ]
  },"


dns_json=$(get_top_domains)
json_data="$json_data
  \"dns\": $dns_json
}"

print_success_json "$json_data"
