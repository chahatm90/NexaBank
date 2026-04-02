#!/usr/bin/env bash
# Quick smoke-test all APIs
BASE=${1:-http://localhost:8080}
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

echo -e "\n${BOLD}NexaBank API Smoke Tests → $BASE${NC}\n"

# 1. Health checks
for svc in "" ":8081" ":8082" ":8083" ":8084"; do
  url="http://localhost${svc}/actuator/health"
  [ -n "$svc" ] || url="$BASE/actuator/health"
  status=$(curl -sf "$url" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "DOWN")
  [ "$status" = "UP" ] && pass "Health $url" || fail "Health $url ($status)"
done

# 2. Create customer
echo -e "\n${BOLD}-- Customer --${NC}"
CUSTOMER=$(curl -sf -X POST "$BASE/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Test","email":"alice.test.'$(date +%s)'@bank.com","phone":"+1-555-9999"}')
echo "$CUSTOMER" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ID: ' + str(d['data']['id']))" 2>/dev/null && pass "Create customer" || fail "Create customer"
CUST_ID=$(echo "$CUSTOMER" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# 3. Create account
echo -e "\n${BOLD}-- Account --${NC}"
if [ -n "$CUST_ID" ]; then
  ACCOUNT=$(curl -sf -X POST "$BASE/api/v1/accounts" \
    -H "Content-Type: application/json" \
    -d "{\"customerId\":\"$CUST_ID\",\"accountType\":\"CHECKING\",\"initialDeposit\":1000.00}")
  ACC_ID=$(echo "$ACCOUNT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  [ -n "$ACC_ID" ] && pass "Create account (ID: $ACC_ID)" || fail "Create account"
fi

# 4. Deposit
echo -e "\n${BOLD}-- Transactions --${NC}"
if [ -n "$ACC_ID" ]; then
  DEP=$(curl -sf -X POST "$BASE/api/v1/transactions/deposit" \
    -H "Content-Type: application/json" \
    -d "{\"accountId\":\"$ACC_ID\",\"amount\":500.00,\"description\":\"Test deposit\"}")
  echo "$DEP" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('  Ref:', d['transactionRef'], '| BalAfter:', d['balanceAfter'])" 2>/dev/null
  [ $? -eq 0 ] && pass "Deposit" || fail "Deposit"

  # 5. Withdraw
  WD=$(curl -sf -X POST "$BASE/api/v1/transactions/withdraw" \
    -H "Content-Type: application/json" \
    -d "{\"accountId\":\"$ACC_ID\",\"amount\":100.00,\"description\":\"Test withdrawal\"}")
  echo "$WD" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('  Ref:', d['transactionRef'], '| BalAfter:', d['balanceAfter'])" 2>/dev/null
  [ $? -eq 0 ] && pass "Withdrawal" || fail "Withdrawal"

  # 6. Transaction history
  HIST=$(curl -sf "$BASE/api/v1/transactions/account/$ACC_ID")
  COUNT=$(echo "$HIST" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
  [ -n "$COUNT" ] && pass "Transaction history ($COUNT records)" || fail "Transaction history"
fi

echo -e "\n${BOLD}Done.${NC}\n"
