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

# 1. Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Setup directory
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

# 3. Download agent.js
echo "Downloading agent.js from $BACKEND_URL/scripts/agent.js..."
curl -sSL "$BACKEND_URL/scripts/agent.js" -o "$INSTALL_DIR/agent.js"

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
ExecStart=/usr/bin/node agent.js -t $AGENT_TOKEN -u $BACKEND_URL
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
