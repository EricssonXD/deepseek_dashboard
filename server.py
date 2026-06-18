#!/usr/bin/env python3


#  curl 'https://platform.deepseek.com/api/v0/usage/amount?month=6&year=2026' \
#   -H 'authorization: Bearer <your-deepseek-token>'

"""Static file server + DeepSeek API proxy. Zero dependencies beyond stdlib."""
import csv
import http.server
import io
import json
import urllib.request
import urllib.parse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent
API_BASE = "https://platform.deepseek.com/api/v0/usage"
TOKEN_FILE = ROOT / ".token"

CSV_COLS = ["utc_date", "model", "api_key", "api_key_name", "type", "price", "amount", "cost"]


def _log(msg):
    print(f"[server] {msg}", file=sys.stderr, flush=True)


def _transform_response(cost_raw: str, amount_raw: str) -> tuple:
    """Parse DeepSeek JSON API responses and merge into CSV strings.

    The new DeepSeek API returns JSON with daily per-model usage arrays.
    We merge cost (dollar values) and amount (token counts) by date+model+type,
    then emit CSV rows the frontend can parse with its existing PapaParse flow.
    """
    try:
        cost_data = json.loads(cost_raw)
        amount_data = json.loads(amount_raw)
    except json.JSONDecodeError:
        return cost_raw, amount_raw  # fallback: pass through unchanged

    # Extract cost map: (date, model, type) -> cost_dollars
    cost_map = {}
    cost_biz = cost_data.get("data", {}).get("biz_data", [])
    if isinstance(cost_biz, dict):
        cost_biz = [cost_biz]
    for entry in cost_biz:
        for day in entry.get("days", []):
            date = day.get("date", "")
            for model_entry in day.get("data", []):
                model = model_entry.get("model", "")
                for usage in model_entry.get("usage", []):
                    key = (date, model, usage.get("type", ""))
                    cost_map[key] = float(usage.get("amount", 0))

    # Build amount CSV rows, merging in cost data
    amount_rows = []
    amount_biz = amount_data.get("data", {}).get("biz_data", {})
    if isinstance(amount_biz, list):
        amount_biz = amount_biz[0] if amount_biz else {}
    for day in amount_biz.get("days", []):
        date = day.get("date", "")
        for model_entry in day.get("data", []):
            model = model_entry.get("model", "")
            for usage in model_entry.get("usage", []):
                utype = usage.get("type", "")
                token_count = float(usage.get("amount", 0))
                cost_val = cost_map.get((date, model, utype), 0)
                # For amount rows: parseAndStore computes cost = price * amount.
                # Set price = cost_val so cost = cost_val * 1 = cost_val.
                # Set amount = token_count for token stats (KeyDetail table).
                amount_rows.append({
                    "utc_date": date,
                    "model": model,
                    "api_key": "N/A",
                    "api_key_name": "N/A",
                    "type": utype,
                    "price": "0",
                    "amount": str(int(token_count)),
                    "cost": str(cost_val),
                })

    # Generate CSV strings
    def to_csv(rows):
        if not rows:
            return ""
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=CSV_COLS)
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()

    # "cost" CSV: only cost rows (rowType=cost) — for completeness
    cost_rows = [
        {**r, "price": "0", "amount": "0", "cost": r["price"]}
        for r in amount_rows
    ]
    return to_csv(cost_rows), to_csv(amount_rows)


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    # In-memory token store shared across requests
    _stored_token = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == "/api/fetch":
            self._handle_fetch()
        elif self.path == "/api/set-token":
            self._handle_set_token()
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path == "/api/get-token":
            self._handle_get_token()
        else:
            super().do_GET()

    def _handle_set_token(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            token = body.get("token", "").strip()
        except Exception:
            self._json({"error": "Invalid request"}, 400)
            return
        if not token:
            self._json({"error": "Token required"}, 400)
            return
        # Strip "Bearer " prefix if present — we only need the raw token
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        ProxyHandler._stored_token = token
        # Persist to file so token survives server restart
        try:
            TOKEN_FILE.write_text(token)
        except Exception as e:
            _log(f"failed to persist token: {e}")
        _log(f"token set (prefix: {token[:10]}..., len={len(token)})")
        self._json({"ok": True, "prefix": token[:20] + "..."})

    def _handle_get_token(self):
        if ProxyHandler._stored_token:
            self._json({"token": ProxyHandler._stored_token, "prefix": ProxyHandler._stored_token[:20] + "..."})
        else:
            self._json({"token": None})

    def _handle_fetch(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            month = str(body.get("month", 1))
            year = str(body.get("year", 2026))
        except Exception:
            self._json({"error": "Invalid request body"}, 400)
            return

        # Always use stored token — token is set once via /api/set-token
        token = ProxyHandler._stored_token
        if not token:
            self._json({"error": "No token stored. Use bookmarklet or paste token first."}, 400)
            return

        _log(f"fetching {year}-{month} with token prefix {token[:10]}... (len={len(token)})")

        results = {}
        for kind in ("cost", "amount"):
            url = f"{API_BASE}/{kind}?month={month}&year={year}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    results[kind] = resp.read().decode("utf-8")
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                _log(f"DeepSeek API {e.code} for {kind}: {body[:200]}")
                self._json({"error": f"DeepSeek API {e.code}: {body[:300]}"}, 502)
                return
            except Exception as e:
                _log(f"fetch failed for {kind}: {e}")
                self._json({"error": f"Fetch failed: {str(e)}"}, 502)
                return

        # Transform JSON API response to CSV format frontend expects
        cost_csv, amount_csv = _transform_response(results["cost"], results["amount"])
        _log(f"transformed: {len(cost_csv.splitlines())} cost rows, {len(amount_csv.splitlines())} amount rows")
        self._json({"cost": cost_csv, "amount": amount_csv})

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

    # Restore persisted token from previous run
    if TOKEN_FILE.exists():
        try:
            persisted = TOKEN_FILE.read_text().strip()
            if persisted:
                ProxyHandler._stored_token = persisted
                _log(f"restored token from .token (prefix: {persisted[:10]}..., len={len(persisted)})")
        except Exception as e:
            _log(f"failed to restore token: {e}")

    server = http.server.HTTPServer(("0.0.0.0", port), ProxyHandler)
    print(f"Server running at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()
