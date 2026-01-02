#!/bin/bash

# Frontend Deployment Script for Collective Rides
# Automates the deployment process to Vercel via GitHub
# Version: 1.0
# Last Updated: January 1, 2026

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="collective-rides-frontend"
GITHUB_USERNAME=""  # Will be prompted if not set
VERCEL_ORG=""      # Will be prompted if not set
BACKEND_API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
AWS_REGION="us-east-2"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for user input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " input
        eval "$var_name=\"${input:-$default_value}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to validate prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for required commands
    local missing_commands=()
    
    if ! command_exists git; then
        missing_commands+=("git")
    fi
    
    if ! command_exists node; then
        missing_commands+=("node")
    fi
    
    if ! command_exists npm; then
        missing_commands+=("npm")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        print_error "Please install the missing commands and try again."
        exit 1
    fi
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup project configuration
setup_project() {
    print_status "Setting up project configuration..."
    
    # Check if we're in a Next.js project
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    if ! grep -q "next" package.json; then
        print_error "This doesn't appear to be a Next.js project."
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    print_success "Project setup completed"
}

# Function to create environment template
create_env_template() {
    print_status "Creating environment template..."
    
    if [ ! -f ".env.example" ]; then
        cat > .env.example << EOF
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/development
NEXT_PUBLIC_AWS_REGION=us-east-2

# Cognito Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id

# Strava Integration
NEXT_PUBLIC_STRAVA_CLIENT_ID=your-strava-client-id

# Application Environment
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=Collective Rides
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
        print_success "Created .env.example template"
    else
        print_status ".env.example already exists"
    fi
}

# Function to optimize Next.js configuration
optimize_nextjs_config() {
    print_status "Optimizing Next.js configuration..."
    
    if [ ! -f "next.config.mjs" ]; then
        cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: ['collective-rides.vercel.app'],
  },
  output: 'standalone',
  experimental: {
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

export default nextConfig
EOF
        print_success "Created optimized next.config.mjs"
    else
        print_status "next.config.mjs already exists"
    fi
}

# Function to create Vercel configuration
create_vercel_config() {
    print_status "Creating Vercel configuration..."
    
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["syd1", "iad1"],
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
EOF
        print_success "Created vercel.json configuration"
    else
        print_status "vercel.json already exists"
    fi
}

# Function to run build test
test_build() {
    print_status "Testing production build..."
    
    # Run type check
    if npm run type-check >/dev/null 2>&1; then
        print_success "TypeScript type check passed"
    else
        print_warning "TypeScript type check failed - continuing anyway"
    fi
    
    # Run build
    if npm run build; then
        print_success "Production build successful"
    else
        print_error "Production build failed"
        exit 1
    fi
}

# Function to setup Git repository
setup_git_repository() {
    print_status "Setting up Git repository..."
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        git init
        print_success "Initialized Git repository"
    fi
    
    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/.next/
/out/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
.DS_Store
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# Vercel
.vercel
EOF
        print_success "Created .gitignore file"
    fi
    
    # Add all files
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_status "No changes to commit"
    else
        git commit -m "Deploy: Prepare frontend application for Vercel deployment"
        print_success "Committed changes to Git"
    fi
}

# Function to setup GitHub repository
setup_github_repository() {
    print_status "Setting up GitHub repository..."
    
    # Prompt for GitHub username if not set
    if [ -z "$GITHUB_USERNAME" ]; then
        prompt_input "Enter your GitHub username" GITHUB_USERNAME
    fi
    
    # Check if remote origin exists
    if git remote get-url origin >/dev/null 2>&1; then
        print_status "GitHub remote already configured"
        local remote_url=$(git remote get-url origin)
        print_status "Remote URL: $remote_url"
    else
        local repo_url="https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
        git remote add origin "$repo_url"
        print_success "Added GitHub remote: $repo_url"
        
        print_warning "Please create the repository '$PROJECT_NAME' on GitHub before pushing"
        print_status "Repository URL: https://github.com/$GITHUB_USERNAME/$PROJECT_NAME"
        
        read -p "Press Enter after creating the GitHub repository..."
    fi
    
    # Push to GitHub
    if git push -u origin main; then
        print_success "Pushed to GitHub successfully"
    else
        print_error "Failed to push to GitHub"
        print_error "Please ensure the repository exists and you have push access"
        exit 1
    fi
}

# Function to display Vercel deployment instructions
display_vercel_instructions() {
    print_status "Vercel Deployment Instructions"
    echo
    echo "1. Go to https://vercel.com and sign in with your GitHub account"
    echo "2. Click 'New Project'"
    echo "3. Import your GitHub repository: $GITHUB_USERNAME/$PROJECT_NAME"
    echo "4. Configure the following settings:"
    echo "   - Framework Preset: Next.js (auto-detected)"
    echo "   - Root Directory: . (project root)"
    echo "   - Build Command: npm run build"
    echo "   - Output Directory: .next"
    echo "   - Install Command: npm install"
    echo
    echo "5. Add the following environment variables:"
    echo "   NEXT_PUBLIC_API_URL = $BACKEND_API_URL"
    echo "   NEXT_PUBLIC_AWS_REGION = $AWS_REGION"
    echo "   NEXT_PUBLIC_COGNITO_USER_POOL_ID = [your-user-pool-id]"
    echo "   NEXT_PUBLIC_COGNITO_CLIENT_ID = [your-client-id]"
    echo "   NEXT_PUBLIC_ENVIRONMENT = production"
    echo
    echo "6. Click 'Deploy'"
    echo
    print_success "After deployment, you'll receive a production URL for Strava integration"
}

# Function to display post-deployment tasks
display_post_deployment_tasks() {
    print_status "Post-Deployment Tasks"
    echo
    echo "After successful Vercel deployment:"
    echo
    echo "1. Update Backend CORS Configuration:"
    echo "   - Add your Vercel URL to API Gateway CORS origins"
    echo "   - Redeploy your backend infrastructure"
    echo
    echo "2. Configure Strava Developer Application:"
    echo "   - Website: [your-vercel-url]"
    echo "   - Authorization Callback Domain: [your-vercel-domain]"
    echo "   - Authorization Callback URL: [your-vercel-url]/auth/strava/callback"
    echo
    echo "3. Update Environment Variables:"
    echo "   - Add NEXT_PUBLIC_STRAVA_CLIENT_ID to Vercel"
    echo "   - Redeploy the application"
    echo
    echo "4. Test the deployment:"
    echo "   - Verify all pages load correctly"
    echo "   - Test API integration"
    echo "   - Validate authentication flow"
    echo
    print_success "Deployment preparation completed!"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Collective Rides Frontend Deployment"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Setup project
    setup_project
    
    # Create configuration files
    create_env_template
    optimize_nextjs_config
    create_vercel_config
    
    # Test build
    test_build
    
    # Setup repositories
    setup_git_repository
    setup_github_repository
    
    # Display instructions
    display_vercel_instructions
    display_post_deployment_tasks
    
    echo
    print_success "Frontend deployment preparation completed successfully!"
    print_status "Follow the Vercel instructions above to complete the deployment."
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Only run prerequisite checks"
        echo "  --build        Only run build test"
        echo
        echo "Environment Variables:"
        echo "  GITHUB_USERNAME    Your GitHub username"
        echo "  VERCEL_ORG        Your Vercel organization (optional)"
        echo
        exit 0
        ;;
    --check)
        check_prerequisites
        exit 0
        ;;
    --build)
        setup_project
        test_build
        exit 0
        ;;
    *)
        main
        ;;
esac