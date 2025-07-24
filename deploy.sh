#!/bin/bash

# Document Converter Deployment Script

echo "🚀 Preparing for deployment..."

# Clean up any remaining unwanted files
echo "🧹 Cleaning up project..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy: Document Converter application"
fi
git commit -m "$commit_msg"

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Please add your GitHub repository URL:"
    read -p "GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps for Vercel deployment:"
echo "1. Go to https://vercel.com"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Configure build settings:"
echo "   - Framework: Next.js"
echo "   - Build Command: cd frontend && npm run build"
echo "   - Output Directory: frontend/.next"
echo "   - Install Command: cd frontend && npm install"
echo "5. Add environment variables if needed"
echo "6. Deploy!"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
