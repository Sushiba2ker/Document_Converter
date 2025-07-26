#!/bin/bash

# Docker Installation Script for Ubuntu
# Compatible with Ubuntu 18.04, 20.04, 22.04, and 24.04
# Usage: ./install-docker.sh

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root user"
        print_info "It's recommended to run as a regular user with sudo privileges"
        print_info "Continuing with root installation..."
        IS_ROOT=true
    else
        IS_ROOT=false
    fi
}

# Check Ubuntu version
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

# Check if Docker is already installed
check_existing_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_warning "Docker is already installed (version $DOCKER_VERSION)"
        
        read -p "Do you want to reinstall Docker? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping Docker installation"
            return 1
        fi
        
        print_step "Removing existing Docker installation"
        sudo apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
        print_success "Existing Docker removed"
    fi
    return 0
}

# Install Docker
install_docker() {
    print_step "Installing Docker"
    
    # Update package index
    print_info "Updating package index..."
    sudo apt-get update -y
    
    # Install prerequisites
    print_info "Installing prerequisites..."
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common
    
    # Add Docker's official GPG key
    print_info "Adding Docker GPG key..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    print_info "Adding Docker repository..."
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update -y
    
    # Install Docker Engine
    print_info "Installing Docker Engine..."
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully"
}

# Configure Docker
configure_docker() {
    print_step "Configuring Docker"

    # Add current user to docker group (skip if root)
    if [[ "$IS_ROOT" == "false" ]]; then
        print_info "Adding user to docker group..."
        sudo usermod -aG docker $USER
    else
        print_info "Running as root, skipping user group configuration..."
    fi

    # Enable and start Docker service
    print_info "Enabling Docker service..."
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Configure Docker daemon
    print_info "Configuring Docker daemon..."
    sudo mkdir -p /etc/docker
    
    # Create daemon.json with optimized settings
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ]
}
EOF
    
    # Restart Docker to apply configuration
    sudo systemctl restart docker
    
    print_success "Docker configured successfully"
}

# Install Docker Compose (standalone)
install_docker_compose() {
    print_step "Installing Docker Compose"
    
    # Get latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    if [[ -z "$COMPOSE_VERSION" ]]; then
        print_warning "Could not fetch latest version, using v2.24.0"
        COMPOSE_VERSION="v2.24.0"
    fi
    
    print_info "Installing Docker Compose $COMPOSE_VERSION..."
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for easier access
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
}

# Verify installation
verify_installation() {
    print_step "Verifying installation"
    
    # Check Docker version
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker: $DOCKER_VERSION"
    else
        print_error "Docker installation failed"
        return 1
    fi
    
    # Check Docker Compose version
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose: $COMPOSE_VERSION"
    else
        print_error "Docker Compose installation failed"
        return 1
    fi
    
    # Check Docker service status
    if sudo systemctl is-active --quiet docker; then
        print_success "Docker service is running"
    else
        print_error "Docker service is not running"
        return 1
    fi
    
    print_success "All installations verified successfully"
}

# Test Docker
test_docker() {
    print_step "Testing Docker installation"

    print_info "Running hello-world container..."
    if [[ "$IS_ROOT" == "true" ]]; then
        if docker run --rm hello-world > /dev/null 2>&1; then
            print_success "Docker test completed successfully"
        else
            print_warning "Docker test failed, but installation appears correct"
        fi
    else
        if sudo docker run --rm hello-world > /dev/null 2>&1; then
            print_success "Docker test completed successfully"
        else
            print_warning "Docker test failed, but installation appears correct"
            print_info "You may need to log out and log back in for group changes to take effect"
        fi
    fi
}

# Cleanup
cleanup() {
    print_step "Cleaning up"

    # Remove hello-world image
    if [[ "$IS_ROOT" == "true" ]]; then
        docker rmi hello-world 2>/dev/null || true
    else
        sudo docker rmi hello-world 2>/dev/null || true
    fi

    # Clean up package cache
    sudo apt-get autoremove -y
    sudo apt-get autoclean

    print_success "Cleanup completed"
}

# Main installation process
main() {
    echo "🐳 Docker Installation Script for Ubuntu"
    echo "========================================"
    echo ""
    
    check_root
    check_ubuntu
    
    if check_existing_docker; then
        install_docker
        configure_docker
    fi
    
    install_docker_compose
    verify_installation
    test_docker
    cleanup
    
    echo ""
    print_step "Installation Complete!"
    echo ""
    print_success "Docker and Docker Compose have been installed successfully"

    if [[ "$IS_ROOT" == "false" ]]; then
        print_warning "IMPORTANT: You need to log out and log back in (or restart) for group changes to take effect"
        echo ""
        print_info "After logging back in, you can test Docker with:"
        echo "  docker run hello-world"
    else
        print_info "Running as root, you can immediately use Docker commands:"
        echo "  docker run hello-world"
    fi
    echo ""
    print_info "To start using Docker Compose:"
    echo "  docker-compose --version"
    echo ""
    print_info "Useful commands:"
    echo "  docker --version                 # Check Docker version"
    echo "  docker-compose --version         # Check Docker Compose version"
    echo "  docker ps                        # List running containers"
    echo "  docker images                    # List Docker images"
    echo "  sudo systemctl status docker    # Check Docker service status"
    echo ""
}

# Run main function
main "$@"
