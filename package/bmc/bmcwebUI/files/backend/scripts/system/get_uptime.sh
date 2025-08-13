#!/bin/sh

uptime_str=$(uptime -p)
cat <<EOF
{
  "uptime": "$uptime_str"
}
EOF
