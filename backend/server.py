from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import random
import pandas as pd
from io import StringIO
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'watchtower-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="Data Quality Watchtower API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DataSourceCreate(BaseModel):
    name: str
    source_type: str  # 'insurance', 'banking', 'custom'
    description: Optional[str] = None

class DataSourceResponse(BaseModel):
    id: str
    name: str
    source_type: str
    description: Optional[str]
    record_count: int
    created_at: str
    owner_id: Optional[str]

class QualityCheckCreate(BaseModel):
    data_source_id: str
    check_type: str  # 'schema', 'constraint', 'business_rule'
    rule_name: str
    rule_definition: Dict[str, Any]

class QualityCheckResponse(BaseModel):
    id: str
    data_source_id: str
    check_type: str
    rule_name: str
    rule_definition: Dict[str, Any]
    status: str  # 'passed', 'failed', 'warning'
    details: Optional[Dict[str, Any]]
    executed_at: str

class AlertConfigCreate(BaseModel):
    alert_type: str  # 'slack', 'email'
    config: Dict[str, Any]  # webhook_url for slack, email for email
    enabled: bool = True

class AlertConfigResponse(BaseModel):
    id: str
    alert_type: str
    config: Dict[str, Any]
    enabled: bool
    created_at: str
    owner_id: Optional[str]

class PipelineRunResponse(BaseModel):
    id: str
    data_source_id: str
    bronze_status: str
    silver_status: str
    gold_status: str
    quality_score: float
    total_records: int
    passed_records: int
    failed_records: int
    started_at: str
    completed_at: Optional[str]

class DashboardStats(BaseModel):
    total_data_sources: int
    total_quality_checks: int
    total_pipeline_runs: int
    overall_quality_score: float
    recent_alerts: int
    checks_passed: int
    checks_failed: int
    checks_warning: int

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# ==================== SAMPLE DATA GENERATORS ====================

def generate_insurance_data(num_records: int = 100) -> List[Dict]:
    """Generate sample insurance claims data"""
    data = []
    claim_types = ['auto', 'home', 'health', 'life', 'liability']
    statuses = ['pending', 'approved', 'rejected', 'under_review']
    
    for i in range(num_records):
        policy_limit = random.randint(10000, 500000)
        claim_amount = random.randint(500, policy_limit + random.randint(-5000, 20000))  # Some may exceed
        
        record = {
            "claim_id": f"CLM-{str(uuid.uuid4())[:8].upper()}",
            "policy_id": f"POL-{random.randint(100000, 999999)}",
            "policy_holder": f"Customer_{random.randint(1000, 9999)}",
            "claim_type": random.choice(claim_types),
            "claim_amount": claim_amount,
            "policy_limit": policy_limit,
            "claim_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365))).isoformat(),
            "status": random.choice(statuses),
            "deductible": random.randint(500, 5000),
            "agent_id": f"AGT-{random.randint(100, 999)}",
            "region": random.choice(['North', 'South', 'East', 'West', 'Central']),
            "risk_score": round(random.uniform(0.1, 1.0), 2)
        }
        
        # Introduce some null values for testing
        if random.random() < 0.05:
            record["agent_id"] = None
        
        data.append(record)
    
    return data

def generate_banking_data(num_records: int = 100) -> List[Dict]:
    """Generate sample banking transaction data"""
    data = []
    transaction_types = ['deposit', 'withdrawal', 'transfer', 'payment', 'refund']
    channels = ['online', 'mobile', 'branch', 'atm']
    
    for i in range(num_records):
        balance_before = random.randint(1000, 100000)
        amount = random.randint(10, 50000)
        tx_type = random.choice(transaction_types)
        
        if tx_type in ['withdrawal', 'payment', 'transfer']:
            balance_after = balance_before - amount
        else:
            balance_after = balance_before + amount
        
        record = {
            "transaction_id": f"TXN-{str(uuid.uuid4())[:8].upper()}",
            "account_id": f"ACC-{random.randint(100000, 999999)}",
            "customer_id": f"CUST-{random.randint(10000, 99999)}",
            "transaction_type": tx_type,
            "amount": amount,
            "currency": random.choice(['USD', 'EUR', 'GBP']),
            "balance_before": balance_before,
            "balance_after": balance_after,
            "transaction_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 90))).isoformat(),
            "channel": random.choice(channels),
            "merchant_category": random.choice(['retail', 'food', 'utilities', 'entertainment', 'healthcare']),
            "is_flagged": random.random() < 0.03,
            "risk_level": random.choice(['low', 'medium', 'high'])
        }
        
        # Introduce some anomalies
        if random.random() < 0.02:
            record["amount"] = -abs(record["amount"])  # Negative amount error
        
        data.append(record)
    
    return data

# ==================== QUALITY CHECK ENGINE ====================

def run_quality_checks(data: List[Dict], source_type: str) -> List[Dict]:
    """Run quality checks on data and return results"""
    checks = []
    
    if not data:
        return checks
    
    # Schema Validation
    expected_fields = set(data[0].keys()) if data else set()
    missing_fields = []
    for i, record in enumerate(data):
        missing = expected_fields - set(record.keys())
        if missing:
            missing_fields.append({"record_index": i, "missing": list(missing)})
    
    checks.append({
        "id": str(uuid.uuid4()),
        "check_type": "schema",
        "rule_name": "Schema Completeness",
        "rule_definition": {"type": "schema_validation", "expected_fields": list(expected_fields)},
        "status": "passed" if not missing_fields else "failed",
        "details": {
            "expected_fields": list(expected_fields),
            "records_with_missing_fields": len(missing_fields),
            "total_records": len(data)
        },
        "executed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Null Value Check
    null_counts = {}
    for field in expected_fields:
        null_count = sum(1 for r in data if r.get(field) is None)
        if null_count > 0:
            null_counts[field] = null_count
    
    checks.append({
        "id": str(uuid.uuid4()),
        "check_type": "constraint",
        "rule_name": "Non-Null Validation",
        "rule_definition": {"type": "null_check", "fields": list(expected_fields)},
        "status": "passed" if not null_counts else "warning",
        "details": {
            "fields_with_nulls": null_counts,
            "total_records": len(data)
        },
        "executed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Domain-specific checks
    if source_type == 'insurance':
        # Check: claim_amount should not exceed policy_limit
        violations = []
        for i, record in enumerate(data):
            if record.get('claim_amount', 0) > record.get('policy_limit', float('inf')):
                violations.append({
                    "record_index": i,
                    "claim_id": record.get('claim_id'),
                    "claim_amount": record.get('claim_amount'),
                    "policy_limit": record.get('policy_limit')
                })
        
        checks.append({
            "id": str(uuid.uuid4()),
            "check_type": "business_rule",
            "rule_name": "Claim Amount <= Policy Limit",
            "rule_definition": {"type": "business_rule", "rule": "claim_amount <= policy_limit"},
            "status": "passed" if not violations else "failed",
            "details": {
                "violations_count": len(violations),
                "sample_violations": violations[:5],
                "total_records": len(data)
            },
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Check: Unique claim IDs
        claim_ids = [r.get('claim_id') for r in data]
        duplicates = len(claim_ids) - len(set(claim_ids))
        
        checks.append({
            "id": str(uuid.uuid4()),
            "check_type": "constraint",
            "rule_name": "Unique Claim IDs",
            "rule_definition": {"type": "uniqueness_check", "field": "claim_id"},
            "status": "passed" if duplicates == 0 else "failed",
            "details": {
                "duplicate_count": duplicates,
                "total_records": len(data)
            },
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
    
    elif source_type == 'banking':
        # Check: Amount should be positive
        negative_amounts = [r for r in data if r.get('amount', 0) < 0]
        
        checks.append({
            "id": str(uuid.uuid4()),
            "check_type": "constraint",
            "rule_name": "Positive Transaction Amount",
            "rule_definition": {"type": "range_check", "field": "amount", "min": 0},
            "status": "passed" if not negative_amounts else "failed",
            "details": {
                "negative_amount_count": len(negative_amounts),
                "sample_violations": [{"transaction_id": r.get('transaction_id'), "amount": r.get('amount')} for r in negative_amounts[:5]],
                "total_records": len(data)
            },
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Check: Balance consistency
        inconsistent = []
        for record in data:
            tx_type = record.get('transaction_type')
            amount = record.get('amount', 0)
            before = record.get('balance_before', 0)
            after = record.get('balance_after', 0)
            
            if tx_type in ['withdrawal', 'payment', 'transfer']:
                expected = before - abs(amount)
            else:
                expected = before + abs(amount)
            
            if abs(after - expected) > 0.01:
                inconsistent.append(record.get('transaction_id'))
        
        checks.append({
            "id": str(uuid.uuid4()),
            "check_type": "business_rule",
            "rule_name": "Balance Consistency",
            "rule_definition": {"type": "business_rule", "rule": "balance_after = balance_before +/- amount"},
            "status": "passed" if not inconsistent else "warning",
            "details": {
                "inconsistent_count": len(inconsistent),
                "sample_ids": inconsistent[:5],
                "total_records": len(data)
            },
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
    
    return checks

# ==================== ALERT FUNCTIONS ====================

async def send_slack_alert(webhook_url: str, message: str, details: Dict = None):
    """Send alert to Slack webhook"""
    try:
        payload = {
            "text": message,
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🔔 Watchtower Alert", "emoji": True}
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": message}
                }
            ]
        }
        
        if details:
            payload["blocks"].append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"```{json.dumps(details, indent=2)}```"}
            })
        
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload)
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Failed to send Slack alert: {e}")
        return False

async def send_email_alert(email: str, subject: str, message: str):
    """Send email alert via SendGrid"""
    sendgrid_key = os.environ.get('SENDGRID_API_KEY')
    sender_email = os.environ.get('SENDER_EMAIL', 'alerts@watchtower.app')
    
    if not sendgrid_key:
        logger.warning("SendGrid API key not configured")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {sendgrid_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{"to": [{"email": email}]}],
                    "from": {"email": sender_email},
                    "subject": subject,
                    "content": [{"type": "text/html", "value": message}]
                }
            )
            return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
        return False

async def trigger_alerts(user_id: Optional[str], alert_message: str, details: Dict = None):
    """Trigger all configured alerts for a user or demo"""
    query = {"owner_id": user_id} if user_id else {"owner_id": None}
    alerts = await db.alert_configs.find(query, {"_id": 0}).to_list(100)
    
    for alert in alerts:
        if not alert.get('enabled'):
            continue
        
        if alert['alert_type'] == 'slack':
            webhook_url = alert['config'].get('webhook_url')
            if webhook_url:
                await send_slack_alert(webhook_url, alert_message, details)
        
        elif alert['alert_type'] == 'email':
            email = alert['config'].get('email')
            if email:
                html_content = f"""
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #22D3EE;">🔔 Watchtower Alert</h2>
                    <p>{alert_message}</p>
                    {f'<pre style="background: #1E293B; padding: 15px; color: #F8FAFC;">{json.dumps(details, indent=2)}</pre>' if details else ''}
                </div>
                """
                await send_email_alert(email, "Watchtower Data Quality Alert", html_content)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )

# ==================== DATA SOURCE ROUTES ====================

@api_router.post("/data-sources", response_model=DataSourceResponse)
async def create_data_source(
    data_source: DataSourceCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_optional_user)
):
    source_id = str(uuid.uuid4())
    
    # Generate sample data based on type
    if data_source.source_type == 'insurance':
        data = generate_insurance_data(100)
    elif data_source.source_type == 'banking':
        data = generate_banking_data(100)
    else:
        data = []
    
    doc = {
        "id": source_id,
        "name": data_source.name,
        "source_type": data_source.source_type,
        "description": data_source.description,
        "record_count": len(data),
        "data": data,
        "owner_id": user["id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.data_sources.insert_one(doc)
    
    # Run quality checks in background
    background_tasks.add_task(run_and_store_quality_checks, source_id, data, data_source.source_type, user["id"] if user else None)
    
    return DataSourceResponse(
        id=source_id,
        name=data_source.name,
        source_type=data_source.source_type,
        description=data_source.description,
        record_count=len(data),
        created_at=doc["created_at"],
        owner_id=doc["owner_id"]
    )

async def run_and_store_quality_checks(source_id: str, data: List[Dict], source_type: str, user_id: Optional[str]):
    """Run quality checks and store results"""
    checks = run_quality_checks(data, source_type)
    
    for check in checks:
        check["data_source_id"] = source_id
        check["owner_id"] = user_id
        await db.quality_checks.insert_one(check)
    
    # Create pipeline run
    passed = sum(1 for c in checks if c["status"] == "passed")
    failed = sum(1 for c in checks if c["status"] == "failed")
    warnings = sum(1 for c in checks if c["status"] == "warning")
    
    quality_score = (passed / len(checks) * 100) if checks else 0
    
    pipeline_run = {
        "id": str(uuid.uuid4()),
        "data_source_id": source_id,
        "bronze_status": "completed",
        "silver_status": "completed" if failed == 0 else "failed",
        "gold_status": "completed" if failed == 0 and warnings == 0 else "pending",
        "quality_score": round(quality_score, 2),
        "total_records": len(data),
        "passed_records": len(data) - failed * 10,
        "failed_records": failed * 10,
        "owner_id": user_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pipeline_runs.insert_one(pipeline_run)
    
    # Trigger alerts if there are failures
    if failed > 0:
        await trigger_alerts(
            user_id,
            f"⚠️ Data Quality Check Failed for source: {source_id}",
            {"failed_checks": failed, "quality_score": quality_score}
        )

@api_router.get("/data-sources", response_model=List[DataSourceResponse])
async def get_data_sources(user: dict = Depends(get_optional_user)):
    query = {"owner_id": user["id"]} if user else {"owner_id": None}
    sources = await db.data_sources.find(query, {"_id": 0, "data": 0}).to_list(100)
    return [DataSourceResponse(**s) for s in sources]

@api_router.get("/data-sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(source_id: str, user: dict = Depends(get_optional_user)):
    query = {"id": source_id}
    if user:
        query["owner_id"] = user["id"]
    
    source = await db.data_sources.find_one(query, {"_id": 0, "data": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return DataSourceResponse(**source)

@api_router.get("/data-sources/{source_id}/data")
async def get_data_source_data(source_id: str, limit: int = 50, user: dict = Depends(get_optional_user)):
    query = {"id": source_id}
    if user:
        query["owner_id"] = user["id"]
    
    source = await db.data_sources.find_one(query, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return {"data": source.get("data", [])[:limit], "total": len(source.get("data", []))}

@api_router.post("/data-sources/upload")
async def upload_data_source(
    file: UploadFile = File(...),
    name: str = "Uploaded Dataset",
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(get_optional_user)
):
    """Upload CSV or JSON file as data source"""
    content = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(StringIO(content.decode('utf-8')))
            data = df.to_dict('records')
        elif file.filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, dict):
                data = [data]
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    source_id = str(uuid.uuid4())
    doc = {
        "id": source_id,
        "name": name,
        "source_type": "custom",
        "description": f"Uploaded from {file.filename}",
        "record_count": len(data),
        "data": data,
        "owner_id": user["id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.data_sources.insert_one(doc)
    
    # Run quality checks
    if background_tasks:
        background_tasks.add_task(run_and_store_quality_checks, source_id, data, "custom", user["id"] if user else None)
    
    return DataSourceResponse(
        id=source_id,
        name=name,
        source_type="custom",
        description=doc["description"],
        record_count=len(data),
        created_at=doc["created_at"],
        owner_id=doc["owner_id"]
    )

# ==================== QUALITY CHECK ROUTES ====================

@api_router.get("/quality-checks", response_model=List[QualityCheckResponse])
async def get_quality_checks(data_source_id: Optional[str] = None, user: dict = Depends(get_optional_user)):
    query = {"owner_id": user["id"] if user else None}
    if data_source_id:
        query["data_source_id"] = data_source_id
    
    checks = await db.quality_checks.find(query, {"_id": 0}).sort("executed_at", -1).to_list(500)
    
    # Add fallback for missing rule_definition field
    for check in checks:
        if "rule_definition" not in check:
            check["rule_definition"] = {"type": "legacy", "rule": check.get("rule_name", "Unknown")}
    
    return [QualityCheckResponse(**c) for c in checks]

@api_router.get("/quality-checks/summary")
async def get_quality_summary(user: dict = Depends(get_optional_user)):
    query = {"owner_id": user["id"] if user else None}
    checks = await db.quality_checks.find(query, {"_id": 0}).to_list(1000)
    
    passed = sum(1 for c in checks if c["status"] == "passed")
    failed = sum(1 for c in checks if c["status"] == "failed")
    warning = sum(1 for c in checks if c["status"] == "warning")
    
    by_type = {}
    for check in checks:
        check_type = check["check_type"]
        if check_type not in by_type:
            by_type[check_type] = {"passed": 0, "failed": 0, "warning": 0}
        by_type[check_type][check["status"]] += 1
    
    return {
        "total": len(checks),
        "passed": passed,
        "failed": failed,
        "warning": warning,
        "pass_rate": round(passed / len(checks) * 100, 2) if checks else 0,
        "by_type": by_type
    }

# ==================== PIPELINE ROUTES ====================

@api_router.get("/pipeline-runs", response_model=List[PipelineRunResponse])
async def get_pipeline_runs(user: dict = Depends(get_optional_user)):
    query = {"owner_id": user["id"] if user else None}
    runs = await db.pipeline_runs.find(query, {"_id": 0}).sort("started_at", -1).to_list(100)
    return [PipelineRunResponse(**r) for r in runs]

@api_router.get("/pipeline-runs/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline_run(run_id: str, user: dict = Depends(get_optional_user)):
    query = {"id": run_id}
    if user:
        query["owner_id"] = user["id"]
    
    run = await db.pipeline_runs.find_one(query, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    
    return PipelineRunResponse(**run)

@api_router.post("/pipeline-runs/{source_id}/rerun")
async def rerun_pipeline(source_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_optional_user)):
    """Re-run quality checks for a data source"""
    query = {"id": source_id}
    if user:
        query["owner_id"] = user["id"]
    
    source = await db.data_sources.find_one(query, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    # Delete old checks
    await db.quality_checks.delete_many({"data_source_id": source_id})
    
    # Run new checks
    background_tasks.add_task(
        run_and_store_quality_checks, 
        source_id, 
        source.get("data", []), 
        source.get("source_type", "custom"),
        user["id"] if user else None
    )
    
    return {"message": "Pipeline rerun initiated", "source_id": source_id}

# ==================== ALERT CONFIG ROUTES ====================

@api_router.post("/alerts/config", response_model=AlertConfigResponse)
async def create_alert_config(config: AlertConfigCreate, user: dict = Depends(get_optional_user)):
    config_id = str(uuid.uuid4())
    doc = {
        "id": config_id,
        "alert_type": config.alert_type,
        "config": config.config,
        "enabled": config.enabled,
        "owner_id": user["id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.alert_configs.insert_one(doc)
    
    return AlertConfigResponse(**doc)

@api_router.get("/alerts/config", response_model=List[AlertConfigResponse])
async def get_alert_configs(user: dict = Depends(get_optional_user)):
    query = {"owner_id": user["id"] if user else None}
    configs = await db.alert_configs.find(query, {"_id": 0}).to_list(50)
    return [AlertConfigResponse(**c) for c in configs]

@api_router.put("/alerts/config/{config_id}", response_model=AlertConfigResponse)
async def update_alert_config(config_id: str, config: AlertConfigCreate, user: dict = Depends(get_optional_user)):
    query = {"id": config_id}
    if user:
        query["owner_id"] = user["id"]
    
    update = {
        "$set": {
            "alert_type": config.alert_type,
            "config": config.config,
            "enabled": config.enabled
        }
    }
    
    result = await db.alert_configs.find_one_and_update(query, update, return_document=True)
    if not result:
        raise HTTPException(status_code=404, detail="Alert config not found")
    
    result.pop("_id", None)
    return AlertConfigResponse(**result)

@api_router.delete("/alerts/config/{config_id}")
async def delete_alert_config(config_id: str, user: dict = Depends(get_optional_user)):
    query = {"id": config_id}
    if user:
        query["owner_id"] = user["id"]
    
    result = await db.alert_configs.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert config not found")
    
    return {"message": "Alert config deleted"}

@api_router.post("/alerts/test")
async def test_alert(config_id: str, user: dict = Depends(get_optional_user)):
    """Send a test alert"""
    query = {"id": config_id}
    if user:
        query["owner_id"] = user["id"]
    
    config = await db.alert_configs.find_one(query, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Alert config not found")
    
    success = False
    if config["alert_type"] == "slack":
        success = await send_slack_alert(
            config["config"].get("webhook_url"),
            "🧪 This is a test alert from Watchtower!",
            {"test": True, "timestamp": datetime.now(timezone.utc).isoformat()}
        )
    elif config["alert_type"] == "email":
        success = await send_email_alert(
            config["config"].get("email"),
            "Watchtower Test Alert",
            "<h2>🧪 Test Alert</h2><p>This is a test alert from Watchtower!</p>"
        )
    
    return {"success": success, "alert_type": config["alert_type"]}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_optional_user)):
    owner_query = {"owner_id": user["id"] if user else None}
    
    total_sources = await db.data_sources.count_documents(owner_query)
    total_checks = await db.quality_checks.count_documents(owner_query)
    total_runs = await db.pipeline_runs.count_documents(owner_query)
    
    checks = await db.quality_checks.find(owner_query, {"_id": 0, "status": 1}).to_list(1000)
    passed = sum(1 for c in checks if c["status"] == "passed")
    failed = sum(1 for c in checks if c["status"] == "failed")
    warning = sum(1 for c in checks if c["status"] == "warning")
    
    quality_score = (passed / len(checks) * 100) if checks else 100
    
    # Count recent alerts (last 24 hours)
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_alerts = await db.quality_checks.count_documents({
        **owner_query,
        "status": "failed",
        "executed_at": {"$gte": yesterday}
    })
    
    return DashboardStats(
        total_data_sources=total_sources,
        total_quality_checks=total_checks,
        total_pipeline_runs=total_runs,
        overall_quality_score=round(quality_score, 2),
        recent_alerts=recent_alerts,
        checks_passed=passed,
        checks_failed=failed,
        checks_warning=warning
    )

@api_router.get("/dashboard/timeline")
async def get_dashboard_timeline(days: int = 7, user: dict = Depends(get_optional_user)):
    """Get quality check timeline for charts"""
    owner_query = {"owner_id": user["id"] if user else None}
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    checks = await db.quality_checks.find(
        {**owner_query, "executed_at": {"$gte": start_date}},
        {"_id": 0}
    ).to_list(1000)
    
    # Group by date
    timeline = {}
    for check in checks:
        date = check["executed_at"][:10]
        if date not in timeline:
            timeline[date] = {"passed": 0, "failed": 0, "warning": 0}
        timeline[date][check["status"]] += 1
    
    return {"timeline": timeline}

# ==================== DATA LINEAGE ROUTES ====================

@api_router.get("/lineage/{source_id}")
async def get_data_lineage(source_id: str, user: dict = Depends(get_optional_user)):
    """Get data lineage for a source (Bronze → Silver → Gold)"""
    query = {"id": source_id}
    if user:
        query["owner_id"] = user["id"]
    
    source = await db.data_sources.find_one(query, {"_id": 0, "data": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    checks = await db.quality_checks.find({"data_source_id": source_id}, {"_id": 0}).to_list(100)
    runs = await db.pipeline_runs.find({"data_source_id": source_id}, {"_id": 0}).sort("started_at", -1).to_list(10)
    
    latest_run = runs[0] if runs else None
    
    return {
        "source": source,
        "layers": {
            "bronze": {
                "status": latest_run["bronze_status"] if latest_run else "pending",
                "description": "Raw data ingestion",
                "record_count": source["record_count"]
            },
            "silver": {
                "status": latest_run["silver_status"] if latest_run else "pending",
                "description": "Data validation & quality checks",
                "checks_applied": len(checks)
            },
            "gold": {
                "status": latest_run["gold_status"] if latest_run else "pending",
                "description": "Business-ready data",
                "quality_score": latest_run["quality_score"] if latest_run else 0
            }
        },
        "quality_checks": checks,
        "pipeline_runs": runs
    }

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Watchtower API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        return {
            "status": "healthy",
            "mongodb": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "mongodb": "error",
            "error": str(e)
        }

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
