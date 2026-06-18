#!/usr/bin/env python3
"""Static file server + DeepSeek API proxy. Zero dependencies beyond stdlib."""
import http.server
import json
import urllib.request
import urllib.parse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent
API_BASE = "https://platform.deepseek.com/api/v0/usage"


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
        ProxyHandler._stored_token = token
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
            token = body.get("token", "").strip()
            month = str(body.get("month", 1))
            year = str(body.get("year", 2026))
        except Exception:
            self._json({"error": "Invalid request body"}, 400)
            return

        if not token:
            token = ProxyHandler._stored_token
        if not token:
            self._json({"error": "Bearer token required"}, 400)
            return

        results = {}
        for kind in ("cost", "amount"):
            url = f"{API_BASE}/{kind}?month={month}&year={year}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    results[kind] = resp.read().decode("utf-8")
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                self._json({"error": f"DeepSeek API {e.code}: {body[:300]}"}, 502)
                return
            except Exception as e:
                self._json({"error": f"Fetch failed: {str(e)}"}, 502)
                return

        self._json({"cost": results["cost"], "amount": results["amount"]})

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
    server = http.server.HTTPServer(("0.0.0.0", port), ProxyHandler)
    print(f"Server running at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()
