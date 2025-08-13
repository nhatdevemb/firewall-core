#!/bin/sh

now=$(date +"%Y-%m-%d %H:%M:%S")
cat <<EOF
{
  "time": "$now"
}
EOF
