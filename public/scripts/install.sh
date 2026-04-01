#!/bin/bash

# Configuration
AGENT_TOKEN=""
BACKEND_URL=""
INSTALL_DIR="/opt/server-monitor-agent"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -t|--token) AGENT_TOKEN="$2"; shift ;;
        -u|--url) BACKEND_URL="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$AGENT_TOKEN" ] || [ -z "$BACKEND_URL" ]; then
    echo "Usage: sudo bash install.sh -t <token> -u <url>"
    exit 1
fi

echo "--- Installing Server Monitor Agent ---"

# 1. Install python3 if missing
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Installing Python3..."
    sudo apt-get update
    sudo apt-get install -y python3
fi

# 2. Setup directory
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

# 3. Download agent.py
echo "Downloading agent.py from $BACKEND_URL/scripts/agent.py..."
curl -sSL "$BACKEND_URL/scripts/agent.py" -o "$INSTALL_DIR/agent.py"
chmod +x "$INSTALL_DIR/agent.py"

# 4. Create systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/server-monitor-agent.service > /dev/null <<EOF
[Unit]
Description=Server Monitor Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 agent.py -t $AGENT_TOKEN -u $BACKEND_URL
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. Start service
echo "Starting and enabling service..."
sudo systemctl daemon-reload
sudo systemctl restart server-monitor-agent
sudo systemctl enable server-monitor-agent

echo "--- Installation Complete ---"
sudo systemctl status server-monitor-agent --no-pager
