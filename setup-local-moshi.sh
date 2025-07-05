#!/bin/bash

echo "Setting up Moshi AI locally..."

# Create a directory for Moshi
mkdir -p ~/moshi-local
cd ~/moshi-local

# Clone the repository
echo "Cloning Moshi repository..."
git clone https://github.com/kyutai-labs/moshi.git
cd moshi

# Create Python virtual environment
echo "Creating Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -e .

# Download the model weights
echo "Downloading Moshi model (this may take a while)..."
python -m moshi.scripts.download_model

echo "Setup complete! To run Moshi:"
echo "1. cd ~/moshi-local/moshi"
echo "2. source venv/bin/activate"
echo "3. python -m moshi.server"
echo ""
echo "The server will run on ws://localhost:8080"