FROM python:3.11-slim

# Install OpenSSL and shell tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl bash ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application and certs
COPY app.py /app/
COPY pki_system.sh /usr/local/bin/pki_system.sh

# Set permissions
RUN chmod +x /usr/local/bin/pki_system.sh

# Create data directory (can be volume-mounted)
RUN mkdir -p /pki-data

# Install Flask
RUN pip install --no-cache-dir flask

# Expose HTTPS port
EXPOSE 443

# Run the Flask app with ECC TLS certs
CMD ["python", "app.py"]