#!/bin/bash

# Local Docker Deployment Script for EC2 Ubuntu
# Run this script directly on the EC2 instance after uploading the project
# Usage: ./deploy-local.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running on Ubuntu
check_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot determine OS version"
        exit 1
    fi
    
    source /etc/os-release
    
    if [[ "$ID" != "ubuntu" ]]; then
        print_error "This script is designed for Ubuntu only"
        print_info "Detected OS: $ID $VERSION_ID"
        exit 1
    fi
    
    print_success "Ubuntu $VERSION_ID detected"
}

# Check if we're in the right directory
check_project_directory() {
    if [[ ! -f "docker-compose.yml" ]] || [[ ! -f "Dockerfile" ]]; then
        print_error "docker-compose.yml or Dockerfile not found"
        print_info "Please run this script from the project root directory"
        print_info "Current directory: $(pwd)"
        exit 1
    fi
    
    print_success "Project files found"
}

# Install Docker if not present
install_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_success "Docker and Docker Compose already installed"
        return 0
    fi
    
    print_step "Installing Docker and Docker Compose"
    
    if [[ -f "install-docker.sh" ]]; then
        print_info "Using project's install-docker.sh script"
        chmod +x install-docker.sh
        ./install-docker.sh
    else
        print_info "Installing Docker manually"
        
        # Update system
        sudo apt-get update -y
        
        # Install prerequisites
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        
        # Add Docker repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Install Docker Compose standalone
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        sudo curl -L "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        
        # Start Docker service
        sudo systemctl enable docker
        sudo systemctl start docker
    fi
    
    print_success "Docker installation completed"
}

# Configure firewall
configure_firewall() {
    print_step "Configuring firewall"
    
    # Install UFW if not present
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
    
    # Allow Docker ports (optional)
    sudo ufw allow 3000/tcp comment 'Frontend'
    sudo ufw allow 8000/tcp comment 'Backend API'
    
    # Enable firewall
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Prepare directories
prepare_directories() {
    print_step "Preparing directories"
    
    # Create uploads directory
    mkdir -p static/uploads
    chmod 755 static/uploads
    
    # Create SSL directory for future use
    mkdir -p ssl
    chmod 700 ssl
    
    print_success "Directories prepared"
}

# Stop existing containers
stop_existing_containers() {
    print_step "Stopping existing containers"
    
    # Stop and remove existing containers
    sudo docker-compose down 2>/dev/null || true
    
    # Remove old images to free space
    sudo docker system prune -f
    
    print_success "Existing containers stopped"
}

# Build and deploy application
build_and_deploy() {
    print_step "Building and deploying application"
    
    # Build and start containers
    print_info "Building Docker images..."
    sudo docker-compose build --no-cache
    
    print_info "Starting services..."
    sudo docker-compose up -d
    
    # Wait for services to start
    print_info "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    print_info "Checking service status..."
    sudo docker-compose ps
    
    print_success "Application deployed"
}

# Verify deployment
verify_deployment() {
    print_step "Verifying deployment"
    
    # Wait a bit more for services to be fully ready
    sleep 10
    
    # Check backend health
    if curl -f -s "http://localhost:8000/health" > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API might not be ready yet"
        print_info "You can check logs with: sudo docker-compose logs document-converter"
    fi
    
    # Check frontend
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend might not be ready yet"
        print_info "You can check logs with: sudo docker-compose logs document-converter"
    fi
    
    # Check nginx proxy
    if curl -f -s "http://localhost" > /dev/null; then
        print_success "Nginx proxy is responding"
    else
        print_warning "Nginx proxy might not be ready yet"
        print_info "You can check logs with: sudo docker-compose logs nginx"
    fi
}

# Display final information
display_final_info() {
    print_step "Deployment Complete!"
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to detect")
    PRIVATE_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    print_success "Document Converter has been deployed successfully!"
    echo ""
    print_info "🌐 Application URLs:"
    if [[ "$PUBLIC_IP" != "Unable to detect" ]]; then
        echo "   Frontend: http://$PUBLIC_IP"
        echo "   Backend API: http://$PUBLIC_IP:8000"
        echo "   API Docs: http://$PUBLIC_IP:8000/docs"
        echo "   Health Check: http://$PUBLIC_IP:8000/health"
    else
        echo "   Frontend: http://$PRIVATE_IP"
        echo "   Backend API: http://$PRIVATE_IP:8000"
        echo "   API Docs: http://$PRIVATE_IP:8000/docs"
        echo "   Health Check: http://$PRIVATE_IP:8000/health"
    fi
    echo ""
    print_info "🔧 Management Commands:"
    echo "   View status: sudo docker-compose ps"
    echo "   View logs: sudo docker-compose logs -f"
    echo "   Restart: sudo docker-compose restart"
    echo "   Stop: sudo docker-compose down"
    echo "   Update: git pull && sudo docker-compose down && sudo docker-compose up -d --build"
    echo ""
    print_info "📊 Monitoring:"
    echo "   Resource usage: sudo docker stats"
    echo "   System info: htop"
    echo "   Disk usage: df -h"
    echo ""
    print_warning "Note: If you just installed Docker, you may need to log out and log back in"
    print_info "Or use 'sudo docker' commands until then"
    echo ""
}

# Main deployment process
main() {
    echo "🐳 Local Docker Deployment for Document Converter"
    echo "================================================"
    echo ""
    
    check_ubuntu
    check_project_directory
    install_docker
    configure_firewall
    prepare_directories
    stop_existing_containers
    build_and_deploy
    verify_deployment
    display_final_info
    
    print_success "Local deployment script completed successfully!"
}

# Run main function
main "$@"
