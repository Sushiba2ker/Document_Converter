# Docker Troubleshooting Guide

## Common Issues and Solutions

### 1. Container Build Failures

#### Issue: "No space left on device"
```bash
# Clean up Docker system
docker system prune -a -f
docker volume prune -f

# Remove unused images
docker image prune -a -f
```

#### Issue: "Package installation fails"
```bash
# Check if you're behind a proxy/firewall
# Update Dockerfile to use different package mirrors
# For Ubuntu/Debian packages, add to Dockerfile:
RUN sed -i 's/archive.ubuntu.com/mirror.kakao.com/g' /etc/apt/sources.list
```

#### Issue: "Node.js build fails"
```bash
# Clear npm cache and rebuild
docker-compose down
docker rmi $(docker images -q)
docker-compose up -d --build --no-cache
```

### 2. Container Runtime Issues

#### Issue: "Container exits immediately"
```bash
# Check container logs
docker-compose logs document-converter

# Run container interactively for debugging
docker run -it --entrypoint /bin/bash document-converter
```

#### Issue: "Port already in use"
```bash
# Find process using the port
sudo lsof -i :8000
sudo lsof -i :3000
sudo lsof -i :80

# Kill the process
sudo kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### Issue: "Permission denied for uploads"
```bash
# Fix upload directory permissions
sudo chown -R 1000:1000 ./static/uploads
chmod 755 ./static/uploads
```

### 3. Network Issues

#### Issue: "Cannot connect to backend from frontend"
```bash
# Check if containers are on same network
docker network ls
docker network inspect markitdown_app-network

# Restart with fresh network
docker-compose down
docker network prune
docker-compose up -d
```

#### Issue: "Nginx cannot reach backend"
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Check if backend is responding
docker-compose exec nginx curl http://document-converter:8000/health

# Restart nginx
docker-compose restart nginx
```

### 4. Performance Issues

#### Issue: "Slow file processing"
```bash
# Increase memory limits in docker-compose.yml
services:
  document-converter:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

#### Issue: "High CPU usage"
```bash
# Monitor resource usage
docker stats

# Limit CPU usage
services:
  document-converter:
    deploy:
      resources:
        limits:
          cpus: '1.0'
```

### 5. SSL/HTTPS Issues

#### Issue: "SSL certificate not working"
```bash
# Check certificate files
ls -la ./ssl/
openssl x509 -in ./ssl/cert.pem -text -noout

# Test SSL configuration
docker-compose exec nginx nginx -t
```

#### Issue: "Let's Encrypt certificate renewal"
```bash
# Manual renewal
docker run --rm -v ./ssl:/etc/letsencrypt certbot/certbot renew

# Auto-renewal with cron
0 12 * * * docker run --rm -v ./ssl:/etc/letsencrypt certbot/certbot renew --quiet
```

### 6. Data Persistence Issues

#### Issue: "Upload files disappear after restart"
```bash
# Check volume mounts
docker volume ls
docker volume inspect markitdown_uploads_data

# Ensure proper volume configuration in docker-compose.yml
volumes:
  - uploads_data:/app/static/uploads
```

### 7. Development vs Production Issues

#### Issue: "Works locally but not in production"
```bash
# Check environment variables
docker-compose exec document-converter env

# Compare local and production configs
diff .env.example .env

# Check if all required files are copied
docker-compose exec document-converter ls -la /app/
```

## Debugging Commands

### Container Inspection
```bash
# Enter running container
docker-compose exec document-converter /bin/bash

# Check container processes
docker-compose exec document-converter ps aux

# Check container environment
docker-compose exec document-converter env

# Check file permissions
docker-compose exec document-converter ls -la /app/static/uploads/
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
```

### Network Debugging
```bash
# Test internal connectivity
docker-compose exec nginx ping document-converter
docker-compose exec document-converter curl http://localhost:8000/health

# Check port bindings
docker-compose ps
netstat -tlnp | grep :80
netstat -tlnp | grep :8000
```

### Resource Monitoring
```bash
# Real-time resource usage
docker stats

# Disk usage
docker system df

# Container resource limits
docker inspect document-converter | grep -A 10 "Resources"
```

## Recovery Procedures

### Complete Reset
```bash
# Stop all containers
docker-compose down

# Remove all containers and images
docker system prune -a -f

# Remove volumes (WARNING: This deletes all data)
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

### Health Checks
```bash
# Manual health check
curl -f http://localhost:8000/health
curl -f http://localhost/

# Container health status
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' document-converter
```

## Prevention Tips

1. **Regular Maintenance**
   - Run `docker system prune` weekly
   - Monitor disk space: `df -h`
   - Check logs regularly: `docker-compose logs --tail=100`

2. **Resource Monitoring**
   - Set up monitoring: `docker stats`
   - Monitor upload directory size: `du -sh ./static/uploads/`
   - Check memory usage: `free -h`

3. **Backup Strategy**
   - Backup uploads daily
   - Version control your configuration
   - Document any custom changes

4. **Security**
   - Keep Docker updated
   - Regularly update base images
   - Monitor security advisories

## Getting Help

If you're still experiencing issues:

1. Check the application logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test individual components: `curl http://localhost:8000/health`
4. Check system resources: `docker stats` and `df -h`
5. Review this troubleshooting guide
6. Search for similar issues in Docker documentation
