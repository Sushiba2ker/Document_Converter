# Docker Troubleshooting Guide

## Quick Diagnostics

### Check System Status
```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs -f

# Check system resources
docker stats
df -h
free -h
```

## Common Issues and Solutions

### 1. Installation Issues

#### Docker installation fails
```bash
# Clean previous installation
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get autoremove

# Run installation script again
./install-docker.sh
```

#### Permission denied errors
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Test without sudo
docker run hello-world
```

### 2. Container Build Issues

#### Build fails with "No space left on device"
```bash
# Clean Docker system
docker system prune -a -f
docker volume prune -f

# Check disk space
df -h

# Remove unused images
docker image prune -a
```

#### Frontend build fails
```bash
# Clear npm cache
docker-compose exec document-converter npm cache clean --force

# Rebuild without cache
docker-compose down
docker-compose up -d --build --no-cache
```

#### Backend dependencies fail
```bash
# Check Python version in container
docker-compose exec document-converter python --version

# Reinstall requirements
docker-compose exec document-converter pip install -r requirements.txt
```

### 3. Runtime Issues

#### Container exits immediately
```bash
# Check container logs
docker-compose logs document-converter

# Run container interactively
docker run -it --entrypoint /bin/bash document-converter-image

# Check startup script
docker-compose exec document-converter cat start.sh
```

#### Port conflicts
```bash
# Find processes using ports
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :8000

# Kill conflicting processes
sudo kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### File upload issues
```bash
# Check upload directory permissions
ls -la static/uploads/

# Fix permissions
sudo chown -R 1000:1000 static/uploads/
chmod 755 static/uploads/

# Check disk space
df -h
```

### 4. Network Issues

#### Cannot access application
```bash
# Check if containers are running
docker-compose ps

# Check port bindings
docker port document-converter

# Test internal connectivity
docker-compose exec nginx curl http://document-converter:8000/health
```

#### Nginx proxy issues
```bash
# Test nginx configuration
docker-compose exec nginx nginx -t

# Check nginx logs
docker-compose logs nginx

# Restart nginx
docker-compose restart nginx
```

#### API calls fail
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend-backend connectivity
docker-compose exec document-converter curl http://localhost:8000/health

# Check nginx upstream
docker-compose exec nginx curl http://document-converter:8000/health
```

### 5. Performance Issues

#### Slow response times
```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect document-converter | grep -A 10 "Resources"

# Increase memory limits in docker-compose.yml
```

#### High CPU usage
```bash
# Check processes in container
docker-compose exec document-converter top

# Limit CPU usage in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'
```

### 6. SSL/HTTPS Issues

#### SSL certificate problems
```bash
# Check certificate files
ls -la ssl/

# Verify certificate
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL configuration
docker-compose exec nginx nginx -t
```

## Debugging Commands

### Container Inspection
```bash
# Enter running container
docker-compose exec document-converter bash

# Check environment variables
docker-compose exec document-converter env

# Check file structure
docker-compose exec document-converter ls -la /app/

# Check processes
docker-compose exec document-converter ps aux
```

### Log Analysis
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs document-converter
docker-compose logs nginx

# View last N lines
docker-compose logs --tail=50 document-converter

# Search logs for errors
docker-compose logs | grep -i error
```

### Network Debugging
```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect markitdown_app-network

# Test connectivity between containers
docker-compose exec nginx ping document-converter
docker-compose exec document-converter ping nginx
```

## Recovery Procedures

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart document-converter

# Force recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

### Complete Reset
```bash
# Stop and remove everything
docker-compose down -v

# Remove all containers and images
docker system prune -a -f

# Remove volumes (WARNING: Deletes all data)
docker volume prune -f

# Rebuild from scratch
docker-compose up -d --build
```

### Backup and Restore
```bash
# Backup uploads
docker run --rm -v markitdown_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads
docker run --rm -v markitdown_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Health Checks

### Manual Health Checks
```bash
# Backend health
curl -f http://localhost:8000/health

# Frontend health
curl -f http://localhost:3000

# Nginx health
curl -f http://localhost/health

# Container health status
docker inspect --format='{{.State.Health.Status}}' document-converter
```

### Automated Monitoring
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    docker-compose ps
    curl -s http://localhost:8000/health || echo "Backend down"
    curl -s http://localhost/ > /dev/null || echo "Frontend down"
    echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
    echo "Disk: $(df -h / | tail -1 | awk '{print $5 " used"}')"
    echo ""
    sleep 60
done
EOF
chmod +x monitor.sh
```

## Prevention Tips

### Regular Maintenance
```bash
# Weekly cleanup
docker system prune -f
docker volume prune -f

# Monitor disk space
df -h

# Check logs size
du -sh /var/lib/docker/containers/*/
```

### Resource Monitoring
```bash
# Set up log rotation
sudo tee /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
```

### Security Updates
```bash
# Update base images regularly
docker-compose pull
docker-compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## Getting Help

If issues persist:

1. **Check logs**: `docker-compose logs -f`
2. **Verify system resources**: `docker stats` and `df -h`
3. **Test individual components**: 
   - Backend: `curl http://localhost:8000/health`
   - Frontend: `curl http://localhost:3000`
   - Nginx: `curl http://localhost/`
4. **Review configuration**: Check `docker-compose.yml` and `nginx.conf`
5. **Search documentation**: Check Docker and application docs
6. **Community support**: Search for similar issues online

### Useful Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
