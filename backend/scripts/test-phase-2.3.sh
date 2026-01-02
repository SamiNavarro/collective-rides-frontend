#!/bin/bash

# Phase 2.3 Ride Management Testing Script
# This script automates key test scenarios for the ride management system

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-https://your-api-gateway-url}"
CLUB_ID="${CLUB_ID:-club_test_123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TESTS_RUN++))
    local test_name="$1"
    local expected_status="$2"
    local curl_command="$3"
    
    log_info "Running test: $test_name"
    
    # Execute curl command and capture response
    local response=$(eval "$curl_command" 2>/dev/null)
    local actual_status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null || echo "")
    local http_status=$(echo "$curl_command" | grep -o '\-w "%{http_code}"' && echo "$response" | tail -c 4 || echo "")
    
    # Check if test passed
    if [[ "$actual_status" == "$expected_status" ]] || [[ "$http_status" == "$expected_status" ]]; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name - Expected: $expected_status, Got: $actual_status/$http_status"
        echo "Response: $response"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    for tool in curl jq; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check environment variables
    if [[ -z "$API_BASE_URL" ]]; then
        log_error "API_BASE_URL environment variable is required"
        exit 1
    fi
    
    # Check if tokens are set
    if [[ -z "$MEMBER_TOKEN" ]] || [[ -z "$CAPTAIN_TOKEN" ]] || [[ -z "$ADMIN_TOKEN" ]]; then
        log_warning "Authentication tokens not set. Please set MEMBER_TOKEN, CAPTAIN_TOKEN, and ADMIN_TOKEN"
        log_info "You can get tokens by running: ./scripts/get-test-tokens.sh"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Test 1: Member creates draft ride
test_member_create_draft() {
    local test_data='{
        "title": "Test Draft Ride",
        "description": "Testing draft ride creation",
        "rideType": "training",
        "difficulty": "intermediate",
        "startDateTime": "2026-01-15T06:00:00.000Z",
        "estimatedDuration": 180,
        "maxParticipants": 20,
        "meetingPoint": {
            "name": "Test Location",
            "address": "Test Address, Sydney NSW 2000",
            "coordinates": {
                "latitude": -33.8688,
                "longitude": 151.2093
            },
            "instructions": "Meet at the entrance"
        },
        "route": {
            "name": "Test Route",
            "type": "basic",
            "distance": 25.0,
            "estimatedTime": 180,
            "difficulty": "intermediate"
        },
        "requirements": {
            "equipment": ["helmet", "water_bottle"],
            "experience": "intermediate",
            "fitness": "moderate"
        },
        "isPublic": false,
        "allowWaitlist": true
    }'
    
    local curl_cmd="curl -s -X POST $API_BASE_URL/v1/clubs/$CLUB_ID/rides \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -H 'Content-Type: application/json' \
        -d '$test_data' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "201" ]]; then
        local ride_status=$(echo "$body" | jq -r '.data.status')
        if [[ "$ride_status" == "draft" ]]; then
            log_success "Member creates draft ride"
            # Store ride ID for later tests
            export DRAFT_RIDE_ID=$(echo "$body" | jq -r '.data.rideId')
        else
            log_error "Member creates draft ride - Expected status 'draft', got '$ride_status'"
        fi
    else
        log_error "Member creates draft ride - HTTP $http_status"
        echo "Response: $body"
    fi
}

# Test 2: Captain publishes ride immediately
test_captain_immediate_publish() {
    local test_data='{
        "title": "Official Training Ride",
        "description": "Official club training session",
        "rideType": "training",
        "difficulty": "intermediate",
        "startDateTime": "2026-01-16T06:00:00.000Z",
        "estimatedDuration": 120,
        "publishImmediately": true,
        "meetingPoint": {
            "name": "Hyde Park",
            "address": "Sydney NSW 2000",
            "coordinates": {
                "latitude": -33.8688,
                "longitude": 151.2093
            }
        }
    }'
    
    local curl_cmd="curl -s -X POST $API_BASE_URL/v1/clubs/$CLUB_ID/rides \
        -H 'Authorization: Bearer $CAPTAIN_TOKEN' \
        -H 'Content-Type: application/json' \
        -d '$test_data' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "201" ]]; then
        local ride_status=$(echo "$body" | jq -r '.data.status')
        if [[ "$ride_status" == "published" ]]; then
            log_success "Captain publishes ride immediately"
            export PUBLISHED_RIDE_ID=$(echo "$body" | jq -r '.data.rideId')
        else
            log_error "Captain publishes ride immediately - Expected status 'published', got '$ride_status'"
        fi
    else
        log_error "Captain publishes ride immediately - HTTP $http_status"
        echo "Response: $body"
    fi
}

# Test 3: Member cannot publish immediately
test_member_cannot_publish_immediately() {
    local test_data='{
        "title": "Unauthorized Publish",
        "description": "This should fail",
        "rideType": "social",
        "difficulty": "beginner",
        "startDateTime": "2026-01-17T08:00:00.000Z",
        "estimatedDuration": 60,
        "publishImmediately": true,
        "meetingPoint": {
            "name": "Test Location",
            "address": "Test Address",
            "coordinates": {
                "latitude": -33.8688,
                "longitude": 151.2093
            }
        }
    }'
    
    local curl_cmd="curl -s -X POST $API_BASE_URL/v1/clubs/$CLUB_ID/rides \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -H 'Content-Type: application/json' \
        -d '$test_data' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    
    if [[ "$http_status" == "403" ]]; then
        log_success "Member cannot publish immediately (correctly blocked)"
    else
        log_error "Member cannot publish immediately - Expected HTTP 403, got $http_status"
    fi
}

# Test 4: Publish draft ride
test_publish_draft_ride() {
    if [[ -z "$DRAFT_RIDE_ID" ]]; then
        log_error "Publish draft ride - No draft ride ID available"
        return 1
    fi
    
    local publish_data='{
        "audience": "members_only",
        "isPublic": false,
        "publishMessage": "Official club ride - all members welcome!"
    }'
    
    local curl_cmd="curl -s -X POST $API_BASE_URL/v1/clubs/$CLUB_ID/rides/$DRAFT_RIDE_ID/publish \
        -H 'Authorization: Bearer $CAPTAIN_TOKEN' \
        -H 'Content-Type: application/json' \
        -d '$publish_data' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "200" ]]; then
        local ride_status=$(echo "$body" | jq -r '.data.status')
        if [[ "$ride_status" == "published" ]]; then
            log_success "Publish draft ride"
        else
            log_error "Publish draft ride - Expected status 'published', got '$ride_status'"
        fi
    else
        log_error "Publish draft ride - HTTP $http_status"
        echo "Response: $body"
    fi
}

# Test 5: List rides (member view)
test_list_rides_member() {
    local curl_cmd="curl -s -X GET $API_BASE_URL/v1/clubs/$CLUB_ID/rides \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success')
        if [[ "$success" == "true" ]]; then
            log_success "List rides (member view)"
        else
            log_error "List rides (member view) - Response not successful"
        fi
    else
        log_error "List rides (member view) - HTTP $http_status"
    fi
}

# Test 6: Join published ride
test_join_published_ride() {
    if [[ -z "$PUBLISHED_RIDE_ID" ]]; then
        log_error "Join published ride - No published ride ID available"
        return 1
    fi
    
    local join_data='{
        "message": "Looking forward to this ride!"
    }'
    
    local curl_cmd="curl -s -X POST $API_BASE_URL/v1/clubs/$CLUB_ID/rides/$PUBLISHED_RIDE_ID/participants \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -H 'Content-Type: application/json' \
        -d '$join_data' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "201" ]]; then
        local participation_status=$(echo "$body" | jq -r '.data.status')
        if [[ "$participation_status" == "confirmed" ]]; then
            log_success "Join published ride"
            export PARTICIPATION_ID=$(echo "$body" | jq -r '.data.participationId')
        else
            log_error "Join published ride - Expected status 'confirmed', got '$participation_status'"
        fi
    else
        log_error "Join published ride - HTTP $http_status"
        echo "Response: $body"
    fi
}

# Test 7: Get user rides
test_get_user_rides() {
    local curl_cmd="curl -s -X GET $API_BASE_URL/v1/users/me/rides \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success')
        if [[ "$success" == "true" ]]; then
            log_success "Get user rides"
        else
            log_error "Get user rides - Response not successful"
        fi
    else
        log_error "Get user rides - HTTP $http_status"
    fi
}

# Test 8: Leave ride
test_leave_ride() {
    if [[ -z "$PUBLISHED_RIDE_ID" ]]; then
        log_error "Leave ride - No published ride ID available"
        return 1
    fi
    
    local curl_cmd="curl -s -X DELETE $API_BASE_URL/v1/clubs/$CLUB_ID/rides/$PUBLISHED_RIDE_ID/participants/me \
        -H 'Authorization: Bearer $MEMBER_TOKEN' \
        -w '%{http_code}'"
    
    local response=$(eval "$curl_cmd")
    local http_status=$(echo "$response" | tail -c 4)
    local body=$(echo "$response" | head -c -4)
    
    if [[ "$http_status" == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success')
        if [[ "$success" == "true" ]]; then
            log_success "Leave ride"
        else
            log_error "Leave ride - Response not successful"
        fi
    else
        log_error "Leave ride - HTTP $http_status"
        echo "Response: $body"
    fi
}

# Main test execution
main() {
    echo "=========================================="
    echo "Phase 2.3 Ride Management Testing Script"
    echo "=========================================="
    echo
    
    check_prerequisites
    echo
    
    log_info "Starting Phase 2.3 tests..."
    echo
    
    # Core functionality tests
    test_member_create_draft
    test_captain_immediate_publish
    test_member_cannot_publish_immediately
    test_publish_draft_ride
    test_list_rides_member
    test_join_published_ride
    test_get_user_rides
    test_leave_ride
    
    echo
    echo "=========================================="
    echo "Test Results Summary"
    echo "=========================================="
    echo "Tests Run: $TESTS_RUN"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All tests passed! ✅${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed! ❌${NC}"
        exit 1
    fi
}

# Run main function
main "$@"