#!/bin/bash
# tmux.sh — runs run.sh inside a tmux session.
# Usage: ./tmux.sh [session-name]
#   session-name defaults to "deepseek-dashboard"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="${1:-deepseek-dashboard}"

if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Reusing existing tmux session '$SESSION'."
    tmux send-keys -t "$SESSION" C-c
    sleep 0.3
else
    echo "Creating tmux session '$SESSION'."
    tmux new-session -d -s "$SESSION"
fi

tmux send-keys -t "$SESSION" "cd '$SCRIPT_DIR' && ./run.sh" ENTER

echo "Session '$SESSION' is running."
echo "Attach with:  tmux attach -t $SESSION"
