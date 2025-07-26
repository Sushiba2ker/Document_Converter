# Quick Start Guide - Docker Deployment

## 🚀 One-Command Deployment

Deploy everything to EC2 Ubuntu in one command:

```bash
./deploy-docker-ec2.sh YOUR_EC2_IP ~/.ssh/your-key.pem
```

**What this does:**
- ✅ Installs Docker and Docker Compose
- ✅ Configures firewall and security
- ✅ Uploads and builds your application
- ✅ Starts all services with nginx proxy
- ✅ Provides access URLs and management commands

## 📋 Prerequisites

### EC2 Instance Requirements
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **Instance Type**: Minimum t3.medium (2 vCPU, 4GB RAM)
- **Storage**: Minimum 20GB
- **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Local Requirements
- SSH key for EC2 access
- Git (project should be cloned locally)

## 🛠️ Alternative Deployment Methods

### Method 1: Two-Step Deployment (Recommended for Production)

```bash
# Step 1: Prepare EC2 with Docker
./setup-ec2-docker.sh YOUR_EC2_IP ~/.ssh/your-key.pem

# Step 2: Deploy application
./deploy-docker-ec2.sh YOUR_EC2_IP ~/.ssh/your-key.pem
```

### Method 2: Manual Docker Installation

```bash
# On any Ubuntu system
./install-docker.sh
```

### Method 3: Local Development

```bash
# Build and run locally
docker-compose up -d --build
```

## 🌐 Access Your Application

After successful deployment:

- **Frontend**: `http://YOUR_EC2_IP`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **API Documentation**: `http://YOUR_EC2_IP:8000/docs`
- **Health Check**: `http://YOUR_EC2_IP:8000/health`

## 🔧 Management Commands

### View Status
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'cd ~/document-converter && sudo docker-compose ps'
```

### View Logs
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'cd ~/document-converter && sudo docker-compose logs -f'
```

### Restart Services
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'cd ~/document-converter && sudo docker-compose restart'
```

### Update Application
```bash
# Re-run the deployment script
./deploy-docker-ec2.sh YOUR_EC2_IP ~/.ssh/your-key.pem
```

### Stop Services
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'cd ~/document-converter && sudo docker-compose down'
```

## 🆘 Troubleshooting

### Quick Diagnostics
```bash
# Check if services are running
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'sudo docker-compose ps'

# Check logs for errors
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'sudo docker-compose logs --tail=50'

# Check system resources
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP 'sudo docker stats --no-stream'
```

### Common Issues

1. **Cannot connect to EC2**
   - Check security group allows SSH (port 22)
   - Verify SSH key path and permissions
   - Ensure EC2 instance is running

2. **Application not accessible**
   - Check security group allows HTTP (port 80)
   - Verify containers are running: `docker-compose ps`
   - Check logs: `docker-compose logs`

3. **Build failures**
   - Check disk space: `df -h`
   - Clean Docker: `docker system prune -f`
   - Retry deployment

For detailed troubleshooting, see [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)

## 📚 Documentation

- **[README.md](README.md)** - Complete project documentation
- **[DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)** - Comprehensive troubleshooting guide
- **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md)** - EC2-specific deployment guide

## 🔒 Security Notes

- The deployment automatically configures UFW firewall
- Only necessary ports are opened (22, 80, 443)
- SSL/HTTPS can be configured by placing certificates in `./ssl/` directory
- Regular security updates are recommended

## 💡 Tips

1. **Use Elastic IP** for production to avoid IP changes
2. **Setup domain name** and SSL certificate for HTTPS
3. **Monitor resources** regularly with `docker stats`
4. **Backup uploads** periodically from `static/uploads/`
5. **Keep Docker updated** for security patches

## 🎯 Next Steps

After successful deployment:

1. **Test the application** with sample file uploads
2. **Configure domain name** (optional)
3. **Setup SSL certificate** (recommended for production)
4. **Setup monitoring** and alerting
5. **Configure backup strategy** for uploaded files

---

**Need help?** Check the troubleshooting guide or review the logs for specific error messages.
