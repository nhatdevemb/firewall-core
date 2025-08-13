#!/bin/sh

host=$(hostname)
cat <<EOF
{
  "hostname": "$host"
}
EOF
