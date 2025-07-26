#!/bin/bash

# Document Converter - Docker Deployment Script for EC2 Ubuntu
# Usage: ./deploy-docker-ec2.sh [EC2_IP] [SSH_KEY_PATH]

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
PROJECT_NAME="document-converter"
REMOTE_DIR="/home/ubuntu/$PROJECT_NAME"

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

print_step "Starting Docker deployment to EC2"
echo "EC2 IP: $EC2_IP"
echo "SSH Key: $SSH_KEY"
echo "Project: $PROJECT_NAME"
echo ""

# Test SSH connection
print_step "Testing SSH connection"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_success "SSH connection established"
else
    print_error "Cannot connect to EC2 instance. Check IP and SSH key."
    exit 1
fi

# Create project directory on EC2
print_step "Creating project directory on EC2"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" "mkdir -p $REMOTE_DIR"
print_success "Project directory created"

# Copy project files to EC2
print_step "Uploading project files"
rsync -avz --progress -e "ssh -i $SSH_KEY" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude 'static/uploads/*' \
    ./ ubuntu@"$EC2_IP":"$REMOTE_DIR"/
print_success "Project files uploaded"

# Install Docker and dependencies on EC2
print_step "Installing Docker and dependencies"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << 'EOF'
# Update system
sudo apt-get update -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker ubuntu
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "Docker already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi
EOF
print_success "Docker and dependencies installed"

# Build and deploy application
print_step "Building and deploying application"
ssh -i "$SSH_KEY" ubuntu@"$EC2_IP" << EOF
cd $REMOTE_DIR

# Stop existing containers
sudo docker-compose down 2>/dev/null || true

# Remove old images to free space
sudo docker system prune -f

# Create uploads directory
mkdir -p static/uploads

# Build and start containers
sudo docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check if services are running
sudo docker-compose ps
EOF
print_success "Application deployed"

# Verify deployment
print_step "Verifying deployment"
sleep 10

# Check if services are responding
if curl -f -s "http://$EC2_IP:8000/health" > /dev/null; then
    print_success "Backend API is responding"
else
    print_warning "Backend API might not be ready yet"
fi

if curl -f -s "http://$EC2_IP" > /dev/null; then
    print_success "Frontend is responding"
else
    print_warning "Frontend might not be ready yet"
fi

# Display final information
print_step "Deployment Complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$EC2_IP"
echo "   Backend API: http://$EC2_IP:8000"
echo "   API Docs: http://$EC2_IP:8000/docs"
echo "   Health Check: http://$EC2_IP:8000/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: ssh -i $SSH_KEY ubuntu@$EC2_IP 'cd $REMOTE_DIR && sudo docker-compose logs -f'"
echo "   Restart: ssh -i $SSH_KEY ubuntu@$EC2_IP 'cd $REMOTE_DIR && sudo docker-compose restart'"
echo "   Stop: ssh -i $SSH_KEY ubuntu@$EC2_IP 'cd $REMOTE_DIR && sudo docker-compose down'"
echo "   Update: Re-run this script"
echo ""
echo "📊 Monitor: ssh -i $SSH_KEY ubuntu@$EC2_IP 'sudo docker stats'"
echo ""
print_success "Deployment script completed successfully!"
