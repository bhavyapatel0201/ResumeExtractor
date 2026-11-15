#!/usr/bin/env python3
import http.server
import socketserver
import ssl
import os
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
os.chdir(SCRIPT_DIR)

PORT = 8443
CERT_FILE = "cert.pem"
KEY_FILE = "key.pem"

# Verify certificate and key files exist
if not os.path.exists(CERT_FILE):
    print(f"Error: {CERT_FILE} not found")
    exit(1)
if not os.path.exists(KEY_FILE):
    print(f"Error: {KEY_FILE} not found")
    exit(1)

# Create SSL context
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(CERT_FILE, KEY_FILE)

# Create handler
Handler = http.server.SimpleHTTPRequestHandler

# Create server with SSL context
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"🔒 HTTPS Server running at https://127.0.0.1:{PORT}")
    print(f"📂 Serving directory: {SCRIPT_DIR}")
    print(f"Note: You may see a certificate warning in your browser (expected for self-signed cert)")
    print(f"Press Ctrl+C to stop the server")
    
    # Wrap the socket with SSL
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
