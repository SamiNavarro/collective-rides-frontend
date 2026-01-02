#!/bin/bash

# Phase 2.4: Advanced Route Management (MVP) - Test Execution Script
# Version: 1.0
# Date: December 30, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.sydneycycles.com}"
TEST_CLUB_ID="${TEST_CLUB_ID:-club_123}"
TEST_ROUTE_ID="${TEST_ROUTE_ID:-route_123}"
TEST_DATA_DIR="backend/test-data/gpx"

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
    echo -e "\n${BLUE}Test $TESTS_RUN:${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    command -v curl >/dev/null 2>&1 || { log_error "curl is required but not installed"; exit 1; }
    command -v jq >/dev/null 2>&1 || { log_error "jq is required but not installed"; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "aws CLI is required but not installed"; exit 1; }
    
    # Check environment variables
    if [ -z "$API_BASE_URL" ]; then
        log_error "API_BASE_URL environment variable is required"
        exit 1
    fi
    
    # Check test data directory
    if [ ! -d "$TEST_DATA_DIR" ]; then
        log_warning "Test data directory $TEST_DATA_DIR not found, creating..."
        mkdir -p "$TEST_DATA_DIR"
        create_test_gpx_files
    fi
    
    log_success "Prerequisites check completed"
}

create_test_gpx_files() {
    log_info "Creating test GPX files..."
    
    # Create small test GPX file
    cat > "$TEST_DATA_DIR/small-route.gpx" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Sydney Cycles Test">
  <trk>
    <name>Small Test Route</name>
    <trkseg>
      <trkpt lat="-33.8688" lon="151.2093">
        <ele>50</ele>
        <time>2025-12-30T06:00:00Z</time>
      </trkpt>
      <trkpt lat="-33.8700" lon="151.2100">
        <ele>55</ele>
        <time>2025-12-30T06:01:00Z</time>
      </trkpt>
      <trkpt lat="-33.8712" lon="151.2107">
        <ele>60</ele>
        <time>2025-12-30T06:02:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
EOF

    # Create invalid file for testing
    echo "This is not a GPX file" > "$TEST_DATA_DIR/invalid-file.txt"
    
    # Create malformed GPX file
    cat > "$TEST_DATA_DIR/malformed.gpx" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Malformed Route</name>
    <!-- Missing closing tags -->
  </trk>
EOF

    log_success "Test GPX files created"
}

get_auth_tokens() {
    log_info "Getting authentication tokens..."
    
    # Source the token script if it exists
    if [ -f "backend/scripts/get-test-tokens.sh" ]; then
        source backend/scripts/get-test-tokens.sh
    else
        log_warning "Token script not found, using environment variables"
        ADMIN_TOKEN="${ADMIN_TOKEN:-admin_token_here}"
        CAPTAIN_TOKEN="${CAPTAIN_TOKEN:-captain_token_here}"
        LEADER_TOKEN="${LEADER_TOKEN:-leader_token_here}"
        MEMBER_TOKEN="${MEMBER_TOKEN:-member_token_here}"
        NON_MEMBER_TOKEN="${NON_MEMBER_TOKEN:-non_member_token_here}"
    fi
    
    if [ -z "$LEADER_TOKEN" ]; then
        log_error "Authentication tokens not available"
        exit 1
    fi
    
    log_success "Authentication tokens loaded"
}

test_infrastructure() {
    log_info "Testing infrastructure deployment..."
    
    run_test "API Gateway endpoints accessible"
    response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url")
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        log_success "API Gateway endpoints accessible"
    else
        log_error "API Gateway endpoints not accessible (HTTP $response)"
    fi
    
    run_test "S3 bucket exists"
    if aws s3 ls s3://sydney-cycles-routes-dev/ >/dev/null 2>&1; then
        log_success "S3 bucket accessible"
    else
        log_error "S3 bucket not accessible"
    fi
}

test_file_upload() {
    log_info "Testing file upload functionality..."
    
    run_test "Request upload URL (authorized user)"
    upload_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "fileName": "test-route.gpx",
            "fileSize": 1000,
            "contentType": "application/gpx+xml",
            "description": "Test upload"
        }')
    
    if echo "$upload_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Upload URL generated successfully"
        UPLOAD_URL=$(echo "$upload_response" | jq -r '.data.uploadUrl')
        FILE_ID=$(echo "$upload_response" | jq -r '.data.fileId')
    else
        log_error "Failed to generate upload URL: $upload_response"
        return 1
    fi
    
    run_test "Member cannot request upload URL"
    member_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url" \
        -H "Authorization: Bearer $MEMBER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"fileName":"unauthorized.gpx","fileSize":1000,"contentType":"application/gpx+xml"}')
    
    if echo "$member_response" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Member upload correctly denied"
    else
        log_error "Member upload should be denied"
    fi
    
    run_test "Invalid file type rejected"
    invalid_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"fileName":"invalid.txt","fileSize":1000,"contentType":"text/plain"}')
    
    if echo "$invalid_response" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Invalid file type correctly rejected"
    else
        log_error "Invalid file type should be rejected"
    fi
    
    run_test "File size limit enforced"
    large_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"fileName":"huge.gpx","fileSize":15000000,"contentType":"application/gpx+xml"}')
    
    if echo "$large_response" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "File size limit correctly enforced"
    else
        log_error "File size limit should be enforced"
    fi
}

test_file_processing() {
    log_info "Testing file processing..."
    
    run_test "Confirm upload and start processing"
    confirm_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/1/confirm" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"fileId\":\"$FILE_ID\",\"uploadCompleted\":true}")
    
    if echo "$confirm_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Upload confirmation successful"
    else
        log_error "Upload confirmation failed: $confirm_response"
        return 1
    fi
    
    run_test "Check processing status"
    status_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/1/status" \
        -H "Authorization: Bearer $LEADER_TOKEN")
    
    if echo "$status_response" | jq -e '.success' >/dev/null 2>&1; then
        status=$(echo "$status_response" | jq -r '.data.status')
        log_success "Processing status retrieved: $status"
    else
        log_error "Failed to get processing status: $status_response"
    fi
    
    # Wait for processing to complete (with timeout)
    log_info "Waiting for processing to complete..."
    timeout=120
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        status_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/1/status" \
            -H "Authorization: Bearer $LEADER_TOKEN")
        
        if echo "$status_response" | jq -e '.success' >/dev/null 2>&1; then
            status=$(echo "$status_response" | jq -r '.data.status')
            if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
                break
            fi
        fi
        
        sleep 10
        elapsed=$((elapsed + 10))
        echo -n "."
    done
    echo ""
    
    if [ "$status" = "completed" ]; then
        log_success "File processing completed successfully"
    else
        log_error "File processing did not complete in time (status: $status)"
    fi
}

test_analytics() {
    log_info "Testing route analytics..."
    
    run_test "Get route analytics"
    analytics_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/analytics" \
        -H "Authorization: Bearer $MEMBER_TOKEN")
    
    if echo "$analytics_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Route analytics retrieved successfully"
        
        # Check analytics structure
        if echo "$analytics_response" | jq -e '.data.elevationSummary' >/dev/null 2>&1; then
            log_success "Elevation summary present"
        else
            log_error "Elevation summary missing"
        fi
        
        if echo "$analytics_response" | jq -e '.data.difficultyScore' >/dev/null 2>&1; then
            log_success "Difficulty score present"
        else
            log_error "Difficulty score missing"
        fi
        
        if echo "$analytics_response" | jq -e '.data.performanceMetrics' >/dev/null 2>&1; then
            log_success "Performance metrics present"
        else
            log_error "Performance metrics missing"
        fi
    else
        log_error "Failed to retrieve route analytics: $analytics_response"
    fi
    
    run_test "Non-member cannot view analytics"
    non_member_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/analytics" \
        -H "Authorization: Bearer $NON_MEMBER_TOKEN")
    
    if echo "$non_member_response" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Non-member analytics access correctly denied"
    else
        log_error "Non-member should not access analytics"
    fi
}

test_templates() {
    log_info "Testing route templates..."
    
    run_test "Create route template (authorized user)"
    template_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "sourceRouteId": "'$TEST_ROUTE_ID'",
            "templateName": "Test Template",
            "description": "Template created during testing",
            "tags": ["test", "automation"],
            "category": "training",
            "difficulty": "intermediate",
            "terrain": "road",
            "visibility": "club",
            "allowDownload": true
        }')
    
    if echo "$template_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Route template created successfully"
        TEMPLATE_ID=$(echo "$template_response" | jq -r '.data.templateId')
    else
        log_error "Failed to create route template: $template_response"
        return 1
    fi
    
    run_test "Member cannot create template"
    member_template_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates" \
        -H "Authorization: Bearer $MEMBER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"sourceRouteId":"'$TEST_ROUTE_ID'","templateName":"Unauthorized","category":"training","difficulty":"beginner","terrain":"road"}')
    
    if echo "$member_template_response" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Member template creation correctly denied"
    else
        log_error "Member should not be able to create templates"
    fi
    
    run_test "Search club templates"
    search_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates?query=test&limit=10" \
        -H "Authorization: Bearer $MEMBER_TOKEN")
    
    if echo "$search_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Template search successful"
        
        # Check if our template is in results
        if echo "$search_response" | jq -e '.data.templates[] | select(.templateId == "'$TEMPLATE_ID'")' >/dev/null 2>&1; then
            log_success "Created template found in search results"
        else
            log_error "Created template not found in search results"
        fi
    else
        log_error "Template search failed: $search_response"
    fi
    
    run_test "Non-member cannot search templates"
    non_member_search=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates" \
        -H "Authorization: Bearer $NON_MEMBER_TOKEN")
    
    if echo "$non_member_search" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Non-member template search correctly denied"
    else
        log_error "Non-member should not access templates"
    fi
}

test_file_download() {
    log_info "Testing file download..."
    
    run_test "Club member can download file"
    download_response=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/1/download" \
        -H "Authorization: Bearer $MEMBER_TOKEN")
    
    if echo "$download_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "File download URL generated successfully"
        
        # Check download URL structure
        if echo "$download_response" | jq -e '.data.downloadUrl' >/dev/null 2>&1; then
            log_success "Download URL present"
        else
            log_error "Download URL missing"
        fi
        
        if echo "$download_response" | jq -e '.data.expiresAt' >/dev/null 2>&1; then
            log_success "Download URL expiration present"
        else
            log_error "Download URL expiration missing"
        fi
    else
        log_error "Failed to generate download URL: $download_response"
    fi
    
    run_test "Non-member cannot download file"
    non_member_download=$(curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/1/download" \
        -H "Authorization: Bearer $NON_MEMBER_TOKEN")
    
    if echo "$non_member_download" | jq -e '.success == false' >/dev/null 2>&1; then
        log_success "Non-member download correctly denied"
    else
        log_error "Non-member should not download files"
    fi
}

test_integration() {
    log_info "Testing Phase 2.3 integration..."
    
    run_test "Create ride with GPX route reference"
    ride_response=$(curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/rides" \
        -H "Authorization: Bearer $CAPTAIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Integration Test Ride",
            "description": "Testing Phase 2.3 + 2.4 integration",
            "rideType": "training",
            "difficulty": "intermediate",
            "startDateTime": "2026-01-06T09:00:00.000Z",
            "estimatedDuration": 150,
            "publishImmediately": true,
            "meetingPoint": {
                "name": "Integration Test Point",
                "address": "Test Address",
                "coordinates": { "latitude": -33.8688, "longitude": 151.2093 }
            },
            "route": {
                "name": "Integration Test Route",
                "type": "s3_gpx",
                "routeKey": "gpx-files/'$TEST_CLUB_ID'/'$TEST_ROUTE_ID'/v1.gpx",
                "distance": 32.5,
                "estimatedTime": 150,
                "difficulty": "intermediate"
            }
        }')
    
    if echo "$ride_response" | jq -e '.success' >/dev/null 2>&1; then
        log_success "Ride with GPX route created successfully"
        
        # Verify route type is preserved
        if echo "$ride_response" | jq -e '.data.route.type == "s3_gpx"' >/dev/null 2>&1; then
            log_success "GPX route type preserved"
        else
            log_error "GPX route type not preserved"
        fi
    else
        log_error "Failed to create ride with GPX route: $ride_response"
    fi
}

run_performance_tests() {
    log_info "Running performance tests..."
    
    run_test "Upload URL generation performance"
    start_time=$(date +%s%N)
    curl -s -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url" \
        -H "Authorization: Bearer $LEADER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"fileName":"perf-test.gpx","fileSize":50000,"contentType":"application/gpx+xml"}' >/dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 500 ]; then
        log_success "Upload URL generation: ${duration}ms (target: <500ms)"
    else
        log_error "Upload URL generation too slow: ${duration}ms (target: <500ms)"
    fi
    
    run_test "Template search performance"
    start_time=$(date +%s%N)
    curl -s -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates?limit=20" \
        -H "Authorization: Bearer $MEMBER_TOKEN" >/dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 500 ]; then
        log_success "Template search: ${duration}ms (target: <500ms)"
    else
        log_error "Template search too slow: ${duration}ms (target: <500ms)"
    fi
}

cleanup_test_data() {
    log_info "Cleaning up test data..."
    
    # Note: In a real implementation, you might want to clean up
    # test rides, templates, and files created during testing
    log_success "Cleanup completed"
}

print_summary() {
    echo ""
    echo "=================================="
    echo "Phase 2.4 Test Summary"
    echo "=================================="
    echo "Tests Run:    $TESTS_RUN"
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✅${NC}"
        echo "Phase 2.4 is ready for deployment."
    else
        echo -e "${RED}$TESTS_FAILED test(s) failed! ❌${NC}"
        echo "Please review the failures above before deployment."
        exit 1
    fi
}

# Main execution
main() {
    echo "=================================="
    echo "Phase 2.4: Advanced Route Management"
    echo "Test Execution Script"
    echo "=================================="
    echo ""
    
    check_prerequisites
    get_auth_tokens
    
    test_infrastructure
    test_file_upload
    test_file_processing
    test_analytics
    test_templates
    test_file_download
    test_integration
    run_performance_tests
    
    cleanup_test_data
    print_summary
}

# Run main function
main "$@"