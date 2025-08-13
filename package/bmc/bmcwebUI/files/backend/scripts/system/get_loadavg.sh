#!/bin/sh

loadavg=$(cat /proc/loadavg | awk '{print $1, $2, $3}')
cat <<EOF
{
  "loadavg": "$loadavg"
}
EOF
