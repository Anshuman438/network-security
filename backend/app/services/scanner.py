import datetime
import socket
import ssl
import time
import urllib.parse
import urllib.request
from typing import Any
from urllib.error import HTTPError, URLError

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import NormalizedEvent, RawLog
from app.rules import evaluate_rules_for_events


SECURITY_HEADERS_DEF = [
    {
        "key": "strict-transport-security",
        "name": "Strict-Transport-Security (HSTS)",
        "description": "Enforces secure HTTPS connections and prevents SSL stripping attacks.",
        "weight": 15,
        "recommendation": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to your web server headers.",
    },
    {
        "key": "content-security-policy",
        "name": "Content-Security-Policy (CSP)",
        "description": "Restricts where scripts, styles, and media can load from, preventing XSS attacks.",
        "weight": 20,
        "recommendation": "Define a robust Content-Security-Policy header restricting script-src and object-src.",
    },
    {
        "key": "x-frame-options",
        "name": "X-Frame-Options",
        "description": "Protects against clickjacking by preventing your site from being embedded in iframes.",
        "weight": 15,
        "recommendation": "Set 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN'.",
    },
    {
        "key": "x-content-type-options",
        "name": "X-Content-Type-Options",
        "description": "Prevents MIME-sniffing vulnerabilities where browsers execute non-script files as scripts.",
        "weight": 10,
        "recommendation": "Set 'X-Content-Type-Options: nosniff'.",
    },
    {
        "key": "referrer-policy",
        "name": "Referrer-Policy",
        "description": "Protects privacy by controlling how much referrer information is sent with requests.",
        "weight": 5,
        "recommendation": "Set 'Referrer-Policy: strict-origin-when-cross-origin'.",
    },
    {
        "key": "permissions-policy",
        "name": "Permissions-Policy",
        "description": "Controls browser features such as camera, microphone, geolocation, and payment APIs.",
        "weight": 5,
        "recommendation": "Configure 'Permissions-Policy: geolocation=(), camera=(), microphone=()'.",
    },
]

PROBE_PATHS = [
    {"path": "/.env", "name": "Environment Secrets File", "risk": "critical", "description": "Exposes database passwords, API keys, and server secrets."},
    {"path": "/.git/HEAD", "name": "Git Repository Metadata", "risk": "critical", "description": "Allows attackers to download the entire application source code."},
    {"path": "/admin", "name": "Administrative Portal", "risk": "medium", "description": "Generic administrative authentication interface."},
    {"path": "/robots.txt", "name": "Robots Exclusion Protocol", "risk": "low", "description": "May disclose hidden directory paths in disallow entries."},
]


def audit_website(db: Session, target_url: str, user_id: int | None = None) -> dict[str, Any]:
    url = target_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid target URL or hostname")

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    # 1. Resolve Hostname to IP
    try:
        ip_address = socket.gethostbyname(hostname)
    except socket.gaierror:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot resolve hostname: {hostname}")

    # 2. SSL/TLS Certificate Analysis
    ssl_info = analyze_ssl(hostname, port)

    # 3. Main Request & Latency
    start_time = time.perf_counter()
    headers_dict: dict[str, str] = {}
    http_status: int = 0
    server_banner: str | None = None
    powered_by: str | None = None

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Spectre-Security-Scanner/1.0 (Defensive Cybersecurity Auditor)",
                "Accept": "*/*",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
            http_status = response.status
            for key, val in response.headers.items():
                headers_dict[key.lower()] = val
    except HTTPError as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        http_status = e.code
        for key, val in e.headers.items():
            headers_dict[key.lower()] = val
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        http_status = 502

    server_banner = headers_dict.get("server")
    powered_by = headers_dict.get("x-powered-by")

    # 4. Security Headers Audit
    headers_results = []
    headers_score_lost = 0
    for h_def in SECURITY_HEADERS_DEF:
        val = headers_dict.get(h_def["key"])
        if val:
            headers_results.append({
                "name": h_def["name"],
                "present": True,
                "value": val,
                "status": "PASS",
                "description": h_def["description"],
                "recommendation": None,
            })
        else:
            headers_score_lost += h_def["weight"]
            headers_results.append({
                "name": h_def["name"],
                "present": False,
                "value": None,
                "status": "FAIL",
                "description": h_def["description"],
                "recommendation": h_def["recommendation"],
            })

    # 5. Sensitive Endpoint Probing
    path_results = probe_sensitive_paths(parsed.scheme, hostname, port)

    # 6. Score & Grade Computation
    score = 100 - headers_score_lost
    if not ssl_info["valid"]:
        score -= 25
    elif ssl_info.get("days_remaining", 100) < 14:
        score -= 10

    # Penalties for exposed sensitive paths
    critical_paths_found = [p for p in path_results if p["status"] == "VULNERABLE" and p["risk"] == "critical"]
    if critical_paths_found:
        score -= 30

    score = max(5, min(100, score))
    grade = get_grade(score)

    # 7. Ingest Findings as NormalizedEvents & Trigger SIEM Alerts
    generated_events = record_scanner_events(
        db,
        user_id=user_id,
        target_url=url,
        hostname=hostname,
        ip_address=ip_address,
        ssl_info=ssl_info,
        headers_results=headers_results,
        path_results=path_results,
        score=score,
        grade=grade,
    )

    return {
        "target_url": url,
        "hostname": hostname,
        "ip_address": ip_address,
        "latency_ms": latency_ms,
        "http_status": http_status,
        "server_banner": server_banner,
        "powered_by": powered_by,
        "score": score,
        "grade": grade,
        "ssl": ssl_info,
        "headers": headers_results,
        "paths": path_results,
        "events_generated": len(generated_events),
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
    }


def analyze_ssl(hostname: str, port: int) -> dict[str, Any]:
    if port != 443:
        return {"valid": False, "reason": "Non-SSL Port", "days_remaining": 0, "protocol": None, "issuer": None}

    ctx = ssl.create_default_context()
    try:
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(5.0)
            s.connect((hostname, port))
            cert = s.getpeercert()
            protocol = s.version()

            if not cert:
                return {"valid": False, "reason": "No certificate returned", "days_remaining": 0, "protocol": protocol, "issuer": None}

            not_after_str = cert.get("notAfter")
            not_after_dt = datetime.datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=datetime.UTC)
            days_remaining = (not_after_dt - datetime.datetime.now(datetime.UTC)).days

            issuer_dict = dict(x[0] for x in cert.get("issuer", []))
            issuer = issuer_dict.get("organizationName") or issuer_dict.get("commonName") or "Unknown"

            return {
                "valid": days_remaining > 0,
                "protocol": protocol,
                "days_remaining": days_remaining,
                "expires_at": not_after_dt.strftime("%Y-%m-%d"),
                "issuer": issuer,
                "subject": dict(x[0] for x in cert.get("subject", [])).get("commonName", hostname),
            }
    except ssl.SSLError as e:
        return {"valid": False, "reason": f"SSL Error: {e.reason}", "days_remaining": 0, "protocol": None, "issuer": None}
    except Exception as e:
        return {"valid": False, "reason": f"Connection failed: {str(e)}", "days_remaining": 0, "protocol": None, "issuer": None}


def probe_sensitive_paths(scheme: str, hostname: str, port: int) -> list[dict[str, Any]]:
    results = []
    base = f"{scheme}://{hostname}" if (port in (80, 443)) else f"{scheme}://{hostname}:{port}"

    for probe in PROBE_PATHS:
        probe_url = base + probe["path"]
        try:
            req = urllib.request.Request(
                probe_url,
                headers={"User-Agent": "Spectre-Security-Scanner/1.0", "Accept": "*/*"},
            )
            with urllib.request.urlopen(req, timeout=2.5) as res:
                code = res.status
                if probe["path"] in ("/.env", "/.git/HEAD"):
                    status_label = "VULNERABLE" if code in (200, 206) else ("PROTECTED" if code in (401, 403) else "SAFE")
                elif probe["path"] == "/admin":
                    status_label = "EXPOSED" if code in (200, 301, 302) else ("PROTECTED" if code in (401, 403) else "SAFE")
                elif probe["path"] == "/robots.txt":
                    status_label = "EXISTS" if code == 200 else "NOT_FOUND"
                else:
                    status_label = "SAFE"

                results.append({
                    "path": probe["path"],
                    "name": probe["name"],
                    "risk": probe["risk"],
                    "status_code": code,
                    "status": status_label,
                    "description": probe["description"],
                })
        except HTTPError as e:
            code = e.code
            status_label = "PROTECTED" if code in (401, 403) else ("SAFE" if code == 404 else f"HTTP {code}")
            results.append({
                "path": probe["path"],
                "name": probe["name"],
                "risk": probe["risk"],
                "status_code": code,
                "status": status_label,
                "description": probe["description"],
            })
        except Exception:
            results.append({
                "path": probe["path"],
                "name": probe["name"],
                "risk": probe["risk"],
                "status_code": 0,
                "status": "SAFE",
                "description": probe["description"],
            })
    return results


def get_grade(score: int) -> str:
    if score >= 95:
        return "A+"
    if score >= 85:
        return "A"
    if score >= 75:
        return "B"
    if score >= 60:
        return "C"
    if score >= 45:
        return "D"
    return "F"


def record_scanner_events(
    db: Session,
    *,
    user_id: int | None,
    target_url: str,
    hostname: str,
    ip_address: str,
    ssl_info: dict[str, Any],
    headers_results: list[dict[str, Any]],
    path_results: list[dict[str, Any]],
    score: int,
    grade: str,
) -> list[NormalizedEvent]:
    raw_log = RawLog(
        source_type="web_audit",
        original_content=f"Security audit executed for {target_url} (Score: {score}/100, Grade: {grade})",
        file_name=f"audit_{hostname}.log",
        uploaded_by=user_id,
    )
    db.add(raw_log)
    db.flush()

    events: list[NormalizedEvent] = []
    now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)

    # 1. Overall Audit Summary Event
    events.append(
        NormalizedEvent(
            raw_log_id=raw_log.id,
            timestamp=now,
            source_ip=ip_address,
            hostname=hostname,
            event_type="web_audit_summary",
            event_category="security_audit",
            severity="low" if score >= 80 else ("medium" if score >= 60 else "high"),
            message=f"Spectre Web Audit completed for {hostname}: Score {score}/100 (Grade {grade})",
            request_path="/",
            http_method="GET",
        )
    )

    # 2. SSL/TLS Events
    if not ssl_info.get("valid"):
        events.append(
            NormalizedEvent(
                raw_log_id=raw_log.id,
                timestamp=now,
                source_ip=ip_address,
                hostname=hostname,
                event_type="ssl_invalid",
                event_category="security_audit",
                severity="high",
                message=f"SSL Validation Failure on {hostname}: {ssl_info.get('reason', 'Invalid SSL certificate')}",
            )
        )
    elif ssl_info.get("days_remaining", 100) <= 14:
        events.append(
            NormalizedEvent(
                raw_log_id=raw_log.id,
                timestamp=now,
                source_ip=ip_address,
                hostname=hostname,
                event_type="ssl_expiring",
                event_category="security_audit",
                severity="medium",
                message=f"SSL certificate for {hostname} expires in {ssl_info['days_remaining']} days ({ssl_info['expires_at']})",
            )
        )

    # 3. Missing Critical Security Headers
    missing_headers = [h["name"] for h in headers_results if h["status"] == "FAIL"]
    if missing_headers:
        events.append(
            NormalizedEvent(
                raw_log_id=raw_log.id,
                timestamp=now,
                source_ip=ip_address,
                hostname=hostname,
                event_type="missing_security_headers",
                event_category="security_audit",
                severity="medium",
                message=f"Missing recommended security headers on {hostname}: {', '.join(missing_headers[:3])}",
            )
        )

    # 4. Sensitive Path Exposures
    for path in path_results:
        if path["status"] == "VULNERABLE":
            events.append(
                NormalizedEvent(
                    raw_log_id=raw_log.id,
                    timestamp=now,
                    source_ip=ip_address,
                    hostname=hostname,
                    event_type="sensitive_path_exposed",
                    event_category="security_audit",
                    severity="critical" if path["risk"] == "critical" else "high",
                    message=f"Exposed {path['name']} ({path['path']}) returned HTTP {path['status_code']}",
                    request_path=path["path"],
                )
            )

    for ev in events:
        db.add(ev)
    db.flush()

    evaluate_rules_for_events(db, events)
    db.commit()
    return events
