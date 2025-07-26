#!/bin/bash

# EC2 Docker Setup Script
# This script prepares an EC2 Ubuntu instance with Docker for the Document Converter
# Usage: ./setup-ec2-docker.sh [EC2_IP] [SSH_KEY_PATH]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
EC2_IP=${1:-""}
SSH_KEY=${2:-"~/.ssh/id_rsa"}

# Functions
print_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check parameters
if [ -z "$EC2_IP" ]; then
    print_error "Usage: $0 <EC2_IP> [SSH_KEY_PATH]"
    print_error "Example: $0 54.123.45.67 ~/.ssh/my-key.pem"
    exit 1
fi

if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH key not found: $SSH_KEY"
    exit 1
fi

echo "🐳 EC2 Docker Setup for Document Converter"
echo "=========================================="
echo "EC2 IP: $EC2_IP"
echo "SSH Key: $SSH_KEY"
echo ""

# Test SSH connection
print_step "Testing SSH connection"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_success "SSH connection established"
else
    print_error "Cannot connect to EC2 instance. Check IP and SSH key."
    exit 1
fi

# Check if install-docker.sh exists
if [ ! -f "install-docker.sh" ]; then
    print_error "install-docker.sh not found in current directory"
    print_info "Please make sure you're running this script from the project root"
    exit 1
fi

# Copy Docker installation script to EC2
print_step "Copying Docker installation script to EC2"
scp -i "$SSH_KEY" install-docker.sh ubuntu@"$EC2_IP":~/
print_success "Installation script copied"

# Run Docker installation on EC2
print_step "Installing Docker on EC2"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" "chmod +x ~/install-docker.sh && ~/install-docker.sh"
print_success "Docker installation completed"

# Configure firewall
print_step "Configuring firewall"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << 'EOF'
# Install and configure UFW if not already installed
if ! command -v ufw &> /dev/null; then
    sudo apt-get install -y ufw
fi

# Configure firewall rules
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Docker ports (optional, for direct access)
sudo ufw allow 3000/tcp comment 'Frontend'
sudo ufw allow 8000/tcp comment 'Backend API'

# Enable firewall
sudo ufw --force enable

echo "Firewall configured successfully"
EOF
print_success "Firewall configured"

# Create project directory and set permissions
print_step "Setting up project directory"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << 'EOF'
# Create project directory
mkdir -p ~/document-converter
cd ~/document-converter

# Create uploads directory with proper permissions
mkdir -p static/uploads
chmod 755 static/uploads

# Create SSL directory for future use
mkdir -p ssl
chmod 700 ssl

echo "Project directory structure created"
EOF
print_success "Project directory setup completed"

# Install additional useful tools
print_step "Installing additional tools"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << 'EOF'
# Update package list
sudo apt-get update -y

# Install useful tools
sudo apt-get install -y \
    htop \
    tree \
    curl \
    wget \
    unzip \
    git \
    nano \
    vim

echo "Additional tools installed"
EOF
print_success "Additional tools installed"

# Verify Docker installation
print_step "Verifying Docker installation"
DOCKER_STATUS=$(ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" "docker --version && docker-compose --version && sudo systemctl is-active docker" 2>/dev/null || echo "failed")

if [[ "$DOCKER_STATUS" == *"failed"* ]]; then
    print_error "Docker verification failed"
    exit 1
else
    print_success "Docker is working correctly"
fi

# Display system information
print_step "System Information"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << 'EOF'
echo "=== System Information ==="
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "CPU: $(nproc) cores"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $2 " total, " $4 " available"}')"
echo ""
echo "=== Docker Information ==="
docker --version
docker-compose --version
echo "Docker service: $(sudo systemctl is-active docker)"
echo ""
echo "=== Network Information ==="
echo "Public IP: $(curl -s ifconfig.me)"
echo "Private IP: $(hostname -I | awk '{print $1}')"
echo ""
echo "=== Firewall Status ==="
sudo ufw status
EOF

# Final instructions
print_step "Setup Complete!"
echo ""
print_success "EC2 instance is now ready for Docker deployment"
echo ""
print_info "What's been configured:"
echo "  ✅ Docker and Docker Compose installed"
echo "  ✅ User added to docker group"
echo "  ✅ Firewall configured (ports 22, 80, 443, 3000, 8000)"
echo "  ✅ Project directory created"
echo "  ✅ Additional tools installed"
echo ""
print_info "Next steps:"
echo "  1. Deploy your application:"
echo "     ./deploy-docker-ec2.sh $EC2_IP $SSH_KEY"
echo ""
echo "  2. Or manually copy your project and run:"
echo "     scp -i $SSH_KEY -r . ubuntu@$EC2_IP:~/document-converter/"
echo "     ssh -i $SSH_KEY ubuntu@$EC2_IP 'cd ~/document-converter && docker-compose up -d --build'"
echo ""
print_info "Access URLs (after deployment):"
echo "  Frontend: http://$EC2_IP"
echo "  Backend API: http://$EC2_IP:8000"
echo "  API Docs: http://$EC2_IP:8000/docs"
echo ""
print_warning "Note: The user needs to log out and log back in for Docker group changes to take effect"
print_info "Or you can use 'sudo docker' commands until then"
echo ""
print_success "Setup script completed successfully!"
