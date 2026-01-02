#!/bin/bash

# Get Test Tokens for Phase 2.3 Testing
# This script helps obtain JWT tokens for different test users

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
USER_POOL_ID="${USER_POOL_ID:-}"
CLIENT_ID="${CLIENT_ID:-}"
API_BASE_URL="${API_BASE_URL:-}"

# Test user credentials (these should match your setup-test-users.sh)
get_user_credentials() {
    case "$1" in
        "member") echo "dave.member@example.com:TempPassword123!" ;;
        "captain") echo "bob.captain@example.com:TempPassword123!" ;;
        "admin") echo "alice.admin@example.com:TempPassword123!" ;;
        "leader") echo "carol.leader@example.com:TempPassword123!" ;;
        "external") echo "eve.external@example.com:TempPassword123!" ;;
        *) echo "" ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is required but not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi
    
    # Check environment variables
    if [[ -z "$USER_POOL_ID" ]]; then
        log_warning "USER_POOL_ID not set. Attempting to get from CloudFormation..."
        USER_POOL_ID=$(aws cloudformation describe-stacks \
            --stack-name SydneyCyclesStack \
            --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [[ -z "$USER_POOL_ID" ]]; then
            log_error "Could not determine USER_POOL_ID. Please set it manually."
            exit 1
        fi
    fi
    
    if [[ -z "$CLIENT_ID" ]]; then
        log_warning "CLIENT_ID not set. Attempting to get from CloudFormation..."
        CLIENT_ID=$(aws cloudformation describe-stacks \
            --stack-name SydneyCyclesStack \
            --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [[ -z "$CLIENT_ID" ]]; then
            log_error "Could not determine CLIENT_ID. Please set it manually."
            exit 1
        fi
    fi
    
    if [[ -z "$API_BASE_URL" ]]; then
        log_warning "API_BASE_URL not set. Attempting to get from CloudFormation..."
        API_BASE_URL=$(aws cloudformation describe-stacks \
            --stack-name SydneyCyclesStack \
            --query 'Stacks[0].Outputs[?OutputKey==`RestApiUrl`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [[ -z "$API_BASE_URL" ]]; then
            log_error "Could not determine API_BASE_URL. Please set it manually."
            exit 1
        fi
        
        # Remove trailing slash
        API_BASE_URL=${API_BASE_URL%/}
    fi
    
    log_success "Prerequisites check passed"
    log_info "User Pool ID: $USER_POOL_ID"
    log_info "Client ID: $CLIENT_ID"
    log_info "API Base URL: $API_BASE_URL"
}

get_token_for_user() {
    local user_type="$1"
    local credentials=$(get_user_credentials "$user_type")
    
    if [[ -z "$credentials" ]]; then
        log_error "Unknown user type: $user_type"
        return 1
    fi
    
    local email=$(echo "$credentials" | cut -d':' -f1)
    local password=$(echo "$credentials" | cut -d':' -f2)
    
    log_info "Getting token for $user_type ($email)..." >&2
    
    # Authenticate with Cognito
    local auth_response=$(aws cognito-idp initiate-auth \
        --client-id "$CLIENT_ID" \
        --auth-flow USER_PASSWORD_AUTH \
        --auth-parameters USERNAME="$email",PASSWORD="$password" \
        --output json 2>/dev/null || echo "")
    
    if [[ -z "$auth_response" ]]; then
        log_error "Failed to authenticate $user_type" >&2
        return 1
    fi
    
    # Check if we need to handle a challenge (like NEW_PASSWORD_REQUIRED)
    local challenge_name=$(echo "$auth_response" | jq -r '.ChallengeName // empty')
    
    if [[ "$challenge_name" == "NEW_PASSWORD_REQUIRED" ]]; then
        log_info "Handling NEW_PASSWORD_REQUIRED challenge for $user_type..." >&2
        
        local session=$(echo "$auth_response" | jq -r '.Session')
        local challenge_response=$(aws cognito-idp respond-to-auth-challenge \
            --client-id "$CLIENT_ID" \
            --challenge-name NEW_PASSWORD_REQUIRED \
            --session "$session" \
            --challenge-responses NEW_PASSWORD="$password",USERNAME="$email" \
            --output json 2>/dev/null || echo "")
        
        if [[ -z "$challenge_response" ]]; then
            log_error "Failed to handle password challenge for $user_type" >&2
            return 1
        fi
        
        auth_response="$challenge_response"
    fi
    
    # Extract ID token
    local id_token=$(echo "$auth_response" | jq -r '.AuthenticationResult.IdToken // empty')
    
    if [[ -z "$id_token" ]]; then
        log_error "Failed to get ID token for $user_type" >&2
        return 1
    fi
    
    log_success "Got token for $user_type" >&2
    echo "$id_token"
}

generate_export_commands() {
    log_info "Generating export commands..."
    
    local member_token=$(get_token_for_user "member")
    local captain_token=$(get_token_for_user "captain")
    local admin_token=$(get_token_for_user "admin")
    local leader_token=$(get_token_for_user "leader")
    local external_token=$(get_token_for_user "external")
    
    echo
    echo "=========================================="
    echo "Export Commands for Test Tokens"
    echo "=========================================="
    echo
    echo "# Copy and paste these commands to set environment variables:"
    echo
    echo "export API_BASE_URL=\"$API_BASE_URL\""
    echo "export USER_POOL_ID=\"$USER_POOL_ID\""
    echo "export CLIENT_ID=\"$CLIENT_ID\""
    echo
    echo "export MEMBER_TOKEN=\"$member_token\""
    echo "export CAPTAIN_TOKEN=\"$captain_token\""
    echo "export ADMIN_TOKEN=\"$admin_token\""
    echo "export LEADER_TOKEN=\"$leader_token\""
    echo "export EXTERNAL_TOKEN=\"$external_token\""
    echo
    echo "# Or save to a file and source it:"
    echo "# ./scripts/get-test-tokens.sh > test-tokens.env"
    echo "# source test-tokens.env"
    echo
}

save_to_file() {
    local output_file="test-tokens.env"
    
    log_info "Saving tokens to $output_file..."
    
    local member_token=$(get_token_for_user "member")
    local captain_token=$(get_token_for_user "captain")
    local admin_token=$(get_token_for_user "admin")
    local leader_token=$(get_token_for_user "leader")
    local external_token=$(get_token_for_user "external")
    
    cat > "$output_file" << EOF
# Phase 2.3 Test Tokens
# Generated on $(date)

export API_BASE_URL="$API_BASE_URL"
export USER_POOL_ID="$USER_POOL_ID"
export CLIENT_ID="$CLIENT_ID"

export MEMBER_TOKEN="$member_token"
export CAPTAIN_TOKEN="$captain_token"
export ADMIN_TOKEN="$admin_token"
export LEADER_TOKEN="$leader_token"
export EXTERNAL_TOKEN="$external_token"

# Test club ID (update this with your actual test club ID)
export CLUB_ID="club_test_123"
EOF
    
    log_success "Tokens saved to $output_file"
    log_info "Run 'source $output_file' to load the tokens"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --save-file    Save tokens to test-tokens.env file"
    echo "  --user TYPE    Get token for specific user type (member|captain|admin|leader|external)"
    echo "  --help         Show this help message"
    echo
    echo "Environment Variables:"
    echo "  USER_POOL_ID   Cognito User Pool ID"
    echo "  CLIENT_ID      Cognito User Pool Client ID"
    echo "  API_BASE_URL   API Gateway base URL"
    echo
    echo "Examples:"
    echo "  $0                           # Generate export commands"
    echo "  $0 --save-file              # Save tokens to file"
    echo "  $0 --user member            # Get token for member user only"
}

main() {
    local save_file=false
    local specific_user=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --save-file)
                save_file=true
                shift
                ;;
            --user)
                specific_user="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    
    if [[ -n "$specific_user" ]]; then
        # Get token for specific user
        local token=$(get_token_for_user "$specific_user")
        echo "$token"
    elif [[ "$save_file" == true ]]; then
        # Save tokens to file
        save_to_file
    else
        # Generate export commands
        generate_export_commands
    fi
}

main "$@"