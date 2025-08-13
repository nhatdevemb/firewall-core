#!/bin/sh

LOG_FILE="/etc/bmcweb/installed.log"
ACTION="$1"
PKG_NAME="$2"

escape_json() {
  echo "$1" | sed ':a;N;$!ba;s/\n/\\n/g; s/"/\\"/g'
}

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

mkdir -p "$(dirname "$LOG_FILE")"

case "$ACTION" in
  install)
    [ -z "$PKG_NAME" ] && print_error_json "Package name missing"

    opkg update > /dev/null 2>&1
    OUTPUT=$(opkg install "$PKG_NAME" 2>&1)
    RET=$?

    ESCAPED_OUTPUT="\"$(escape_json "$OUTPUT")\""

    if [ "$RET" -eq 0 ]; then
      grep -qxF "$PKG_NAME" "$LOG_FILE" 2>/dev/null || echo "$PKG_NAME" >> "$LOG_FILE"
      print_success_json "$ESCAPED_OUTPUT"
    else
      print_error_json "$OUTPUT"
    fi
    ;;

  remove)
    [ -z "$PKG_NAME" ] && print_error_json "Package name missing"

    OUTPUT=$(opkg remove "$PKG_NAME" 2>&1)
    RET=$?

    ESCAPED_OUTPUT="\"$(escape_json "$OUTPUT")\""

    if [ "$RET" -eq 0 ]; then
      if [ -f "$LOG_FILE" ]; then
        grep -vFx "$PKG_NAME" "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
      fi
      print_success_json "$ESCAPED_OUTPUT"
    else
      print_error_json "$OUTPUT"
    fi
    ;;

  list)
    if [ ! -f "$LOG_FILE" ]; then
      print_success_json "[]"
    fi

    LIST=$(awk 'BEGIN { print "[" }
      {
        printf "  \"%s\"%s\n", $0, (NR==NR_END?"":",")
      }
      END { print "]" }' NR_END=$(wc -l < "$LOG_FILE") "$LOG_FILE")

    print_success_json "$LIST"
    ;;

  *)
    print_error_json "Unknown action. Use install, remove, or list."
    ;;
esac
