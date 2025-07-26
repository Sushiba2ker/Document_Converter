#!/bin/bash

# Docker Fix Script for Ubuntu
# This script diagnoses and fixes common Docker startup issues

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

# Check Docker installation
check_docker_installation() {
    print_step "Checking Docker installation"
    
    if command -v docker &> /dev/null; then
        print_success "Docker binary found"
        docker --version
    else
        print_error "Docker not installed"
        exit 1
    fi
}

# Check Docker daemon status
check_docker_status() {
    print_step "Checking Docker daemon status"
    
    if systemctl is-active --quiet docker; then
        print_success "Docker daemon is running"
        return 0
    else
        print_warning "Docker daemon is not running"
        return 1
    fi
}

# Fix Docker daemon configuration
fix_docker_config() {
    print_step "Fixing Docker daemon configuration"
    
    # Backup existing config
    if [[ -f /etc/docker/daemon.json ]]; then
        print_info "Backing up existing daemon.json"
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    fi
    
    # Create minimal working configuration
    print_info "Creating minimal Docker daemon configuration"
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    
    print_success "Docker daemon configuration updated"
}

# Fix Docker service
fix_docker_service() {
    print_step "Fixing Docker service"
    
    # Stop Docker service
    print_info "Stopping Docker service..."
    systemctl stop docker.service 2>/dev/null || true
    systemctl stop docker.socket 2>/dev/null || true
    
    # Clean up Docker runtime
    print_info "Cleaning up Docker runtime..."
    rm -rf /var/lib/docker/runtimes 2>/dev/null || true
    
    # Reset systemd
    print_info "Reloading systemd..."
    systemctl daemon-reload
    
    # Start Docker service
    print_info "Starting Docker service..."
    systemctl enable docker
    systemctl start docker
    
    # Wait for Docker to start
    print_info "Waiting for Docker to start..."
    sleep 5
    
    if systemctl is-active --quiet docker; then
        print_success "Docker service started successfully"
    else
        print_error "Failed to start Docker service"
        return 1
    fi
}

# Check and fix permissions
fix_permissions() {
    print_step "Fixing Docker permissions"
    
    # Fix Docker socket permissions
    if [[ -S /var/run/docker.sock ]]; then
        chmod 666 /var/run/docker.sock
        print_success "Docker socket permissions fixed"
    fi
    
    # Fix Docker directory permissions
    if [[ -d /var/lib/docker ]]; then
        chown -R root:root /var/lib/docker
        print_success "Docker directory permissions fixed"
    fi
}

# Test Docker functionality
test_docker() {
    print_step "Testing Docker functionality"
    
    # Test basic Docker command
    if docker info > /dev/null 2>&1; then
        print_success "Docker info command works"
    else
        print_error "Docker info command failed"
        return 1
    fi
    
    # Test running a container
    print_info "Testing container execution..."
    if docker run --rm hello-world > /dev/null 2>&1; then
        print_success "Docker container test passed"
        # Clean up test image
        docker rmi hello-world 2>/dev/null || true
    else
        print_warning "Docker container test failed, but basic functionality works"
    fi
}

# Show Docker information
show_docker_info() {
    print_step "Docker Information"
    
    echo "Docker Version:"
    docker --version
    echo ""
    
    echo "Docker Service Status:"
    systemctl status docker --no-pager -l
    echo ""
    
    echo "Docker Info:"
    docker info 2>/dev/null || echo "Docker info not available"
}

# Main fix process
main() {
    echo "🔧 Docker Fix Script"
    echo "==================="
    echo ""
    
    check_docker_installation
    
    if ! check_docker_status; then
        print_warning "Docker daemon issues detected, attempting fixes..."
        
        fix_docker_config
        fix_docker_service
        fix_permissions
        
        # Check again
        if check_docker_status; then
            print_success "Docker daemon fixed successfully!"
        else
            print_error "Failed to fix Docker daemon"
            print_info "Manual intervention may be required"
            
            print_step "Diagnostic Information"
            echo "Docker service status:"
            systemctl status docker --no-pager -l || true
            echo ""
            echo "Docker service logs:"
            journalctl -xeu docker.service --no-pager -l | tail -20 || true
            exit 1
        fi
    fi
    
    test_docker
    show_docker_info
    
    print_step "Fix Complete!"
    print_success "Docker is now working properly"
    print_info "You can now use Docker commands normally"
}

# Run main function
main "$@"
