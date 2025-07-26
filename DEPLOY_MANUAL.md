# Manual Deployment Guide

## 📋 Overview

This guide shows how to manually deploy the Document Converter on EC2 Ubuntu by uploading the project and running the deployment script directly on the server.

## 🚀 Quick Steps

### 1. Upload Project to EC2

```bash
# Upload entire project to EC2
scp -i ~/.ssh/your-key.pem -r . ubuntu@YOUR_EC2_IP:~/document-converter/
```

**Alternative: Using Git (Recommended)**
```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Clone the repository
git clone https://github.com/your-username/your-repo.git document-converter
cd document-converter
```

### 2. SSH into EC2 and Deploy

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project directory
cd ~/document-converter

# Make script executable and run deployment
chmod +x deploy-local.sh
./deploy-local.sh
```

## 📝 What the Script Does

The `deploy-local.sh` script automatically:

1. ✅ **Checks Ubuntu compatibility**
2. ✅ **Verifies project files** (docker-compose.yml, Dockerfile)
3. ✅ **Installs Docker and Docker Compose** (if not present)
4. ✅ **Configures UFW firewall** (ports 22, 80, 443, 3000, 8000)
5. ✅ **Prepares directories** (uploads, SSL)
6. ✅ **Stops existing containers** (if any)
7. ✅ **Builds and deploys application**
8. ✅ **Verifies deployment** (health checks)
9. ✅ **Displays access URLs and management commands**

## 🌐 Access Your Application

After successful deployment, you can access:

- **Frontend**: `http://YOUR_EC2_IP`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **API Documentation**: `http://YOUR_EC2_IP:8000/docs`
- **Health Check**: `http://YOUR_EC2_IP:8000/health`

## 🔧 Management Commands

All commands should be run from the project directory (`~/document-converter`):

### View Status
```bash
sudo docker-compose ps
```

### View Logs
```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f document-converter
sudo docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart document-converter
```

### Stop Services
```bash
sudo docker-compose down
```

### Update Application
```bash
# If using Git
git pull
sudo docker-compose down
sudo docker-compose up -d --build

# If uploaded manually, re-upload and rebuild
sudo docker-compose down
sudo docker-compose up -d --build
```

### Monitor Resources
```bash
# Docker container stats
sudo docker stats

# System resources
htop

# Disk usage
df -h
```

## 🆘 Troubleshooting

### Common Issues

1. **Permission denied for Docker commands**
   ```bash
   # Add user to docker group (requires logout/login)
   sudo usermod -aG docker $USER
   
   # Or use sudo for now
   sudo docker-compose ps
   ```

2. **Port already in use**
   ```bash
   # Find process using port
   sudo lsof -i :80
   sudo lsof -i :8000
   
   # Kill process
   sudo kill -9 <PID>
   ```

3. **Build fails due to disk space**
   ```bash
   # Clean Docker system
   sudo docker system prune -a -f
   
   # Check disk space
   df -h
   ```

4. **Services not responding**
   ```bash
   # Check container status
   sudo docker-compose ps
   
   # Check logs for errors
   sudo docker-compose logs
   
   # Restart services
   sudo docker-compose restart
   ```

### Log Locations

- **Container logs**: `sudo docker-compose logs`
- **System logs**: `/var/log/syslog`
- **Docker logs**: `/var/lib/docker/containers/`

## 🔒 Security Notes

The deployment script automatically:
- Configures UFW firewall with minimal required ports
- Sets proper file permissions for upload directories
- Creates SSL directory for future certificate installation

## 💡 Tips

1. **Use Git for easier updates**:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

2. **Setup SSH key forwarding** for easier Git access:
   ```bash
   ssh -A -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP
   ```

3. **Create an alias** for easier management:
   ```bash
   echo 'alias dclogs="sudo docker-compose logs -f"' >> ~/.bashrc
   echo 'alias dcps="sudo docker-compose ps"' >> ~/.bashrc
   echo 'alias dcrestart="sudo docker-compose restart"' >> ~/.bashrc
   source ~/.bashrc
   ```

4. **Monitor regularly**:
   ```bash
   # Create a simple monitoring script
   cat > monitor.sh << 'EOF'
   #!/bin/bash
   echo "=== $(date) ==="
   sudo docker-compose ps
   curl -s http://localhost:8000/health || echo "Backend down"
   echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
   echo "Disk: $(df -h / | tail -1 | awk '{print $5 " used"}')"
   EOF
   chmod +x monitor.sh
   ```

## 📚 Additional Resources

- **[QUICK_START.md](QUICK_START.md)** - Quick deployment options
- **[DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)** - Detailed troubleshooting
- **[README.md](README.md)** - Complete project documentation

## 🎯 Next Steps

After successful deployment:

1. **Test the application** with file uploads
2. **Setup domain name** (optional)
3. **Configure SSL certificate** (recommended)
4. **Setup monitoring** and log rotation
5. **Create backup strategy** for uploads

---

**Need help?** Check the logs with `sudo docker-compose logs -f` or refer to the troubleshooting guide.
