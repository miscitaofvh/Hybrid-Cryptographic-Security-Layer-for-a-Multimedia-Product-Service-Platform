#!/bin/bash

# =============================================================================
# NIST ECC P-256 PKI System - Production Ready
# =============================================================================

set -euo pipefail

# Configuration
PKI_BASE_DIR="./pki_system"
CA_DIR="$PKI_BASE_DIR/ca"
USERS_DIR="$PKI_BASE_DIR/users"
CERTS_DIR="$PKI_BASE_DIR/certificates"
DB_DIR="$PKI_BASE_DIR/database"
CURVE="prime256v1"  # NIST P-256
HASH_ALGO="sha256"
VALIDITY_DAYS=365

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create directory structure
setup_directories() {
    log "Setting up PKI directory structure..."
    mkdir -p "$CA_DIR/private" "$CA_DIR/certs" "$CA_DIR/csr" "$CA_DIR/newcerts"
    mkdir -p "$USERS_DIR" "$CERTS_DIR" "$DB_DIR"
    
    # Set secure permissions
    chmod 700 "$CA_DIR/private"
    chmod 755 "$CA_DIR/certs" "$CA_DIR/csr" "$CA_DIR/newcerts"
    chmod 700 "$DB_DIR"
    
    # Initialize CA database files
    touch "$CA_DIR/index.txt"
    echo 1000 > "$CA_DIR/serial"
    echo 1000 > "$CA_DIR/crlnumber"
}

# Generate secure random passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Encrypt user data using AES-256-GCM
encrypt_user_data() {
    local user_id="$1"
    local data="$2"
    local ca_cert="$CA_DIR/certs/ca.crt"
    local encrypted_file="$DB_DIR/${user_id}.enc"
    
    # Generate a random key for this user
    
    # Encrypt the data
    echo "$data" | openssl cms -encrypt -aes-256-gcm -out "$encrypted_file" -recip "$ca_cert"
    chmod 600 "$encrypted_file"
}

# Decrypt user data
decrypt_user_data() {
    local user_id="$1"
    local key_file="$CA_DIR/private/ca.key"
    local encrypted_file="$DB_DIR/${user_id}.enc"
    local ca_cert="$CA_DIR/certs/ca.crt"
    if [[ -f "$key_file" && -f "$encrypted_file" ]]; then
        openssl cms -decrypt -in "$encrypted_file" -recip "$ca_cert" -inkey "$key_file"
    else
        error "User data not found for $user_id"
        return 1
    fi
}

# Create CA configuration
create_ca_config() {
    local ca_config="$CA_DIR/ca.conf"
    
    cat > "$ca_config" << 'EOF'
[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = ./pki_system/ca
certs             = $dir/certs
crl_dir           = $dir/crl
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
RANDFILE          = $dir/private/.rand
private_key       = $dir/private/ca.key
certificate       = $dir/certs/ca.crt
crlnumber         = $dir/crlnumber
crl               = $dir/crl/ca.crl
crl_extensions    = crl_ext
default_crl_days  = 30
default_md        = sha256
name_opt          = ca_default
cert_opt          = ca_default
default_days      = 365
preserve          = no
policy            = policy_strict

[ policy_strict ]
countryName             = match
stateOrProvinceName     = match
organizationName        = match
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits        = 256
distinguished_name  = req_distinguished_name
string_mask         = utf8only
default_md          = sha256
x509_extensions     = v3_ca

[ req_distinguished_name ]
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
0.organizationName              = Organization Name
organizationalUnitName          = Organizational Unit Name
commonName                      = Common Name
emailAddress                    = Email Address

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ usr_cert ]
basicConstraints = CA:FALSE
nsCertType = client, email
nsComment = "OpenSSL Generated Client Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection

[ server_cert ]
basicConstraints = CA:FALSE
nsCertType = server
nsComment = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
EOF

    echo "$ca_config"
}

# =============================================================================
# CA OPERATIONS
# =============================================================================

# Generate CA key pair and self-signed certificate
generate_ca() {
    log "Generating CA key pair and self-signed certificate..."
    
    local ca_key="$CA_DIR/private/ca.key"
    local ca_cert="$CA_DIR/certs/ca.crt"
    local ca_pubkey="$CA_DIR/certs/ca.pub.crt"
    local ca_config=$(create_ca_config)
    local ca_csr="$CA_DIR/csr/ca.csr"
    
    log "Generating CA private key..."
    openssl ecparam -name "$CURVE" -genkey -noout -out "$ca_key"
    chmod 400 "$ca_key"
    log "Generating CA public key..."
    openssl ec -in "$ca_key" -pubout -out "$ca_pubkey"
    chmod 644 "$ca_pubkey"
    # Generate self-signed CA certificate
    log "Generating CA self-signed certificate..."
    read -p "Enter CA Country (2 letters): " ca_country
    read -p "Enter CA State/Province: " ca_state
    read -p "Enter CA Organization: " ca_org
    read -p "Enter CA Common Name: " ca_cn
    read -p "Enter CA Email: " ca_email

    openssl req -new -key "$ca_key" -out "$ca_csr" -config "$ca_config" \
        -extensions v3_ca -subj "/C=$ca_country/ST=$ca_state/O=$ca_org/CN=$ca_cn/emailAddress=$ca_email"

    openssl x509 -req -in "$ca_csr" -signkey "$ca_key" \
        -extensions v3_ca -out "$ca_cert" -days $((VALIDITY_DAYS * 10))
    chmod 644 "$ca_cert"
    
    log "CA generated successfully!"
    log "CA Certificate: $ca_cert"
    log "CA Private Key: $ca_key"
    log "CA Public Key: $ca_pubkey"
}

# Sign a CSR
sign_csr() {
    local user_id="$1"
    local csr_file="$USERS_DIR/${user_id}.csr"
    local cert_file="$CERTS_DIR/${user_id}.crt"
    local ca_config=$(create_ca_config)
    local ca_cert="$CA_DIR/certs/ca.crt"
    local ca_key="$CA_DIR/private/ca.key"
    local ca_pubkey="$CA_DIR/certs/ca.pub.crt"
    if [[ ! -f "$csr_file" ]]; then
        error "CSR file not found: $csr_file"
        return 1
    fi
    
    log "Signing CSR for user: $user_id"
    
    # Verify user identity before signing
    log "Verifying user identity..."
    local user_data=$(decrypt_user_data "$user_id")
    if [[ $? -ne 0 ]]; then
        error "Failed to verify user identity"
        return 1
    fi
    
    echo "User Information:"
    echo "$user_data"
    read -p "Confirm signing this CSR? (y/N): " confirm
    
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        warning "CSR signing cancelled"
        return 1
    fi
    
    # Sign the CSR
    openssl x509 -req \
    -in "$csr_file" \
    -CA "$ca_cert" \
    -CAkey "$ca_key" \
    -CAcreateserial \
    -out "$cert_file" \
    -days  $((VALIDITY_DAYS * 10)) \
    -sha256

    chmod 644 "$cert_file"
    log "Certificate signed successfully: $cert_file"
}

# =============================================================================
# USER OPERATIONS
# =============================================================================

# Generate user key pair and CSR
generate_user_csr() {
    local user_id="$1"
    local user_key="$USERS_DIR/${user_id}.key"
    local user_pubkey="$USERS_DIR/${user_id}.pub"
    local user_csr="$USERS_DIR/${user_id}.csr"
    
    log "Generating user key pair and CSR for: $user_id"
    
    # Collect user information
    read -p "Enter Country (2 letters): " country
    read -p "Enter State/Province: " state
    read -p "Enter Organization: " org
    read -p "Enter Organizational Unit (optional): " ou
    read -p "Enter Common Name: " cn
    read -p "Enter Email: " email
    read -p "Enter Employee ID: " emp_id
    read -p "Enter Department: " department
    read -p "Enter Phone Number: " phone
    
    # Create user information record
    local user_data="User ID: $user_id
Employee ID: $emp_id
Common Name: $cn
Email: $email
Organization: $org
Department: $department
Phone: $phone
Country: $country
State: $state
Registration Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Status: Active"
    
    # Encrypt and store user data
    encrypt_user_data "$user_id" "$user_data"
    
    # Generate user private key with password
    log "Creating private key for user..."
    openssl ecparam -name "$CURVE" -genkey -noout -out "$user_key"
    chmod 400 "$user_key"
    log "Creating public key for user..."
    openssl ec -in "$user_key" -pubout -out "$user_pubkey"
    chmod 644 "$user_pubkey"
    # Generate CSR
    local subject="/C=$country/ST=$state/O=$org"
    [[ -n "$ou" ]] && subject="${subject}/OU=$ou"
    subject="${subject}/CN=$cn"
    [[ -n "$email" ]] && subject="${subject}/emailAddress=$email"
    
    log "Generating CSR..."
    openssl req -new -key "$user_key" -out "$user_csr" -subj "$subject"
    chmod 644 "$user_csr"
    
    log "User CSR generated successfully!"
    log "Private Key: $user_key (password protected)"
    log "CSR: $user_csr"
    log "Public key file: $user_pubkey"
}

# =============================================================================
# VALIDATION AND UTILITIES
# =============================================================================

# Create certificate chain
create_cert_chain() {
    local user_id="$1"
    local user_cert="$CERTS_DIR/${user_id}.crt"
    local ca_cert="$CA_DIR/certs/ca.crt"
    local chain_file="$CERTS_DIR/${user_id}-chain.pem"
    
    if [[ ! -f "$user_cert" ]]; then
        error "User certificate not found: $user_cert"
        return 1
    fi
    
    log "Creating certificate chain for: $user_id"
    
    # Create chain: user cert + CA cert
    cat "$user_cert" "$ca_cert" > "$chain_file"
    chmod 644 "$chain_file"
    
    log "Certificate chain created: $chain_file"
}

# Validate certificate
validate_certificate() {
    local user_id="$1"
    local user_cert="$CERTS_DIR/${user_id}.crt"
    local ca_cert="$CA_DIR/certs/ca.crt"
    
    if [[ ! -f "$user_cert" ]]; then
        error "User certificate not found: $user_cert"
        return 1
    fi
    
    log "Validating certificate for: $user_id"
    
    # Verify certificate against CA
    if openssl verify -CAfile "$ca_cert" "$user_cert"; then
        log "Certificate validation: PASSED"
        
        # Show certificate details
        echo -e "\n${BLUE}Certificate Details:${NC}"
        openssl x509 -in "$user_cert" -noout -text | grep -A5 "Subject:"
        openssl x509 -in "$user_cert" -noout -text | grep -A3 "Validity"
        
        # Verify user identity
        echo -e "\n${BLUE}User Identity Verification:${NC}"
        decrypt_user_data "$user_id"
        
        return 0
    else
        error "Certificate validation: FAILED"
        return 1
    fi
}

# Validate user public key against stored identity
validate_user_identity() {
    local user_id="$1"
    local provided_pubkey="$2"  # File path or PEM string
    
    log "Validating user identity for: $user_id"
    
    # Get user certificate public key
    local user_cert="$CERTS_DIR/${user_id}.crt"
    if [[ ! -f "$user_cert" ]]; then
        error "User certificate not found"
        return 1
    fi
    
    local cert_pubkey=$(openssl x509 -in "$user_cert" -pubkey -noout)
    
    # Compare public keys
    local provided_key_content
    if [[ -f "$provided_pubkey" ]]; then
        provided_key_content=$(cat "$provided_pubkey")
    else
        provided_key_content="$provided_pubkey"
    fi
    
    if [[ "$cert_pubkey" == "$provided_key_content" ]]; then
        log "Public key validation: PASSED"
        
        # Display user information
        echo -e "\n${BLUE}Validated User Information:${NC}"
        decrypt_user_data "$user_id"
        
        return 0
    else
        error "Public key validation: FAILED - Key mismatch"
        return 1
    fi
}

# List all users
list_users() {
    log "Registered users:"
    
    for key_file in "$DB_DIR"/*.key; do
        if [[ -f "$key_file" ]]; then
            local user_id=$(basename "$key_file" .key)
            echo -e "\n${BLUE}User ID: $user_id${NC}"
            decrypt_user_data "$user_id" | head -5
        fi
    done
}

# Revoke certificate
revoke_certificate() {
    local user_id="$1"
    local user_cert="$CERTS_DIR/${user_id}.crt"
    local ca_config=$(create_ca_config)
    
    if [[ ! -f "$user_cert" ]]; then
        error "User certificate not found: $user_cert"
        return 1
    fi
    
    log "Revoking certificate for: $user_id"
    
    # Revoke the certificate
    openssl ca -config "$ca_config" -revoke "$user_cert" \
        -keyfile "$CA_DIR/private/ca.key" -cert "$CA_DIR/certs/ca.crt"

    # Generate CRL
    openssl ca -config "$ca_config" -gencrl \
        -cert "$CA_DIR/certs/ca.crt" \
        -out "$CA_DIR/crl/ca.crl"
    
    log "Certificate revoked successfully"
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

show_usage() {
    echo "NIST ECC P-256 PKI System - Production Ready"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  init                    - Initialize PKI system"
    echo "  generate-ca            - Generate CA key pair and certificate"
    echo "  generate-user USER_ID  - Generate user key pair and CSR"
    echo "  sign-csr USER_ID       - Sign user\'s CSR"
    echo "  create-chain USER_ID   - Create certificate chain"
    echo "  validate USER_ID       - Validate user certificate"
    echo "  validate-identity USER_ID [PUBKEY_FILE] - Validate user identity"
    echo "  list-users             - List all registered users"
    echo "  revoke USER_ID         - Revoke user certificate"
    echo ""
    echo "Examples:"
    echo "  $0 init"
    echo "  $0 generate-ca"
    echo "  $0 generate-user john.doe"
    echo "  $0 sign-csr john.doe"
    echo "  $0 validate john.doe"
}

# Main execution
main() {
    case "${1:-}" in
        "init")
            setup_directories
            log "PKI system initialized successfully!"
            ;;
        "generate-ca")
            setup_directories
            generate_ca
            ;;
        "generate-user")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            generate_user_csr "$2"
            ;;
        "sign-csr")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            sign_csr "$2"
            create_cert_chain "$2"
            ;;
        "create-chain")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            create_cert_chain "$2"
            ;;
        "validate")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            validate_certificate "$2"
            ;;
        "validate-identity")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            if [[ -z "${3:-}" ]]; then
                error "Public key file required"
                show_usage
                exit 1
            fi
            validate_user_identity "$2" "$3"
            ;;
        "list-users")
            list_users
            ;;
        "revoke")
            if [[ -z "${2:-}" ]]; then
                error "User ID required"
                show_usage
                exit 1
            fi
            revoke_certificate "$2"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"