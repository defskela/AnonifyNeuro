#!/bin/bash

# Test script for auth endpoints using curl
# Run this script from the Backend directory

echo "Starting regression tests for auth endpoints..."

# Test 1: Register new user
echo "Test 1: Register new user"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"regtest","password":"regpass","email":"regtest@example.com"}')
echo "Register response: $REGISTER_RESPONSE"
if echo "$REGISTER_RESPONSE" | grep -q "User created successfully"; then
  echo "✓ Register test passed"
else
  echo "✗ Register test failed"
fi

# Test 2: Login
echo "Test 2: Login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"regtest","password":"regpass"}')
echo "Login response: $LOGIN_RESPONSE"
if echo "$LOGIN_RESPONSE" | grep -q "jwt_token"; then
  echo "✓ Login test passed"
  # Extract token for next tests
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"jwt_token":"[^"]*' | cut -d'"' -f4)
else
  echo "✗ Login test failed"
  exit 1
fi

# Test 3: Logout
echo "Test 3: Logout"
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer $TOKEN")
echo "Logout response: $LOGOUT_RESPONSE"
if echo "$LOGOUT_RESPONSE" | grep -q "Logged out successfully"; then
  echo "✓ Logout test passed"
else
  echo "✗ Logout test failed"
fi

# Test 4: Refresh
echo "Test 4: Refresh"
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/refresh \
  -H "Authorization: Bearer $TOKEN")
echo "Refresh response: $REFRESH_RESPONSE"
if echo "$REFRESH_RESPONSE" | grep -q "jwt_token"; then
  echo "✓ Refresh test passed"
else
  echo "✗ Refresh test failed"
fi

# Test 5: Register duplicate username
echo "Test 5: Register duplicate username"
DUP_USER_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"regtest","password":"newpass","email":"new@example.com"}')
echo "Duplicate username response: $DUP_USER_RESPONSE"
if echo "$DUP_USER_RESPONSE" | grep -q "Username already registered"; then
  echo "✓ Duplicate username test passed"
else
  echo "✗ Duplicate username test failed"
fi

# Test 6: Login with invalid credentials
echo "Test 6: Login with invalid credentials"
INVALID_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"wrong"}')
echo "Invalid login response: $INVALID_LOGIN_RESPONSE"
if echo "$INVALID_LOGIN_RESPONSE" | grep -q "Invalid credentials"; then
  echo "✓ Invalid credentials test passed"
else
  echo "✗ Invalid credentials test failed"
fi

# Test 7: Get entities
echo "Test 7: Get entities"
ENTITIES_RESPONSE=$(curl -s -X GET http://localhost:8000/entities \
  -H "Authorization: Bearer $TOKEN")
echo "Entities response: $ENTITIES_RESPONSE"
if echo "$ENTITIES_RESPONSE" | grep -q "entities"; then
  echo "✓ Get entities test passed"
else
  echo "✗ Get entities test failed"
fi

echo "Regression tests completed!"