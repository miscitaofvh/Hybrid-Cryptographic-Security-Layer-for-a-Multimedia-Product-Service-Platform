from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)
PKI_SCRIPT = "/usr/local/bin/pki_system.sh"

def run_script(cmd):
    result = subprocess.run([PKI_SCRIPT] + cmd, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else result.stderr.strip(), result.returncode

@app.route("/init", methods=["POST"])
def init():
    output, code = run_script(["init"])
    if code == 0:
        return jsonify({"message": "PKI initialized", "output": output}), 200
    return jsonify({"error": "Initialization failed", "details": output}), 500

@app.route("/generate-user", methods=["POST"])
def generate_user():
    user_id = request.json.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    output, code = run_script(["generate-user", user_id])
    if code == 0:
        return jsonify({"message": f"User '{user_id}' generated successfully", "output": output}), 201
    return jsonify({"error": "User generation failed", "details": output}), 500

@app.route("/sign", methods=["POST"])
def sign():
    user_id = request.json.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    output, code = run_script(["sign-csr", user_id])
    if code == 0:
        return jsonify({"message": f"CSR for '{user_id}' signed successfully", "output": output}), 200
    return jsonify({"error": "CSR signing failed", "details": output}), 500

@app.route("/revoke", methods=["POST"])
def revoke():
    user_id = request.json.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    output, code = run_script(["revoke", user_id])
    if code == 0:
        return jsonify({"message": f"Certificate for '{user_id}' revoked", "output": output}), 200
    return jsonify({"error": "Revocation failed", "details": output}), 500

@app.route("/status", methods=["GET"])
def status():
    return jsonify({"message": "CA service running"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=443, ssl_context=("certs/server_cert.pem", "certs/server_key.pem"))
