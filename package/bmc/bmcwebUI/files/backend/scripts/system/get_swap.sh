#!/bin/sh

swap_line=$(free -m | grep Swap:)
used=$(echo $swap_line | awk '{print $3}')
total=$(echo $swap_line | awk '{print $2}')
percent=0
if [ $total -gt 0 ]; then
  percent=$(( 100 * used / total ))
fi

cat <<EOF
{
  "used": $used,
  "total": $total,
  "percent": $percent
}
EOF
