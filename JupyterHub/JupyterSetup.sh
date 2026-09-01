#!/bin/sh
#
# JupyterHub post-start provisioning (Oracle client, R env vars, uv, Python kernel).
#
# This script MUST always exit 0: the calling hook aborts the container startup
# on any non-zero status. Every step is best-effort and only warns on failure.
#
# POSIX sh only — the lifecycle hook runs it through `curl ... | sh` (dash on the
# jupyter images), so the shebang above is never honoured and bashisms would
# abort the whole script.

# Both matter: the hook could invoke us as `sh -e` / `sh -u`. No pipefail here —
# it is a bashism dash aborts on, and it is off by default anyway.
set +e
set +u

log() { printf '%s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }

# Safety net: exit 0 whatever happens below — a failing last command, an
# unexpected `set -e`, or a signal sent by a hook timeout. Must be executed
# (`sh script.sh`), not sourced, otherwise this would exit the parent shell.
finish() {
    status=$?
    if [ "$status" -ne 0 ]; then
        warn "script ended with status ${status}, forcing 0"
    fi
    exit 0
}
trap finish EXIT HUP INT TERM

# Runs a command, logs a warning if it fails, never propagates the failure.
try() {
    "$@"
    local status=$?
    if [ "$status" -ne 0 ]; then
        warn "command failed (ignored, status ${status}): $*"
    fi
    return 0
}

# Oracle Client Install (UbuntuInstallOracleClient)
install_oracle_client() {
    try sudo mkdir -p /opt/oracle

    if [ -d "/opt/oracle/instantclient_21_13" ]; then
        log "Oracle instant client already present in /opt/oracle/"
        return 0
    fi

    if [ -d "/home/jovyan/instantclient_21_13" ]; then
        log "Copying instant client into /opt/oracle/"
        try sudo cp -r /home/jovyan/instantclient_21_13 /opt/oracle/
        return 0
    fi

    log "Downloading and copying instant client into /opt/oracle/"
    local archive="/tmp/instantclient-basic.zip"
    try curl -fsSL -o "$archive" \
        https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip
    if [ ! -s "$archive" ]; then
        warn "instant client download failed, skipping Oracle client install"
        try rm -f "$archive"
        return 0
    fi

    try sudo unzip -q -o "$archive" -d /opt/oracle
    try rm -f "$archive"

    if [ ! -d "/opt/oracle/instantclient_21_13" ]; then
        warn "instant client not found in /opt/oracle after unzip"
    fi
    return 0
}

install_libaio() {
    if [ -e "/usr/lib/x86_64-linux-gnu/libaio.so.1" ]; then
        return 0
    fi

    if [ -e "/home/jovyan/lib/libaio.so.1" ]; then
        log "Copying libaio.so.1 into /usr/lib/x86_64-linux-gnu/libaio.so.1"
        try sudo cp /home/jovyan/lib/libaio.so.1 /usr/lib/x86_64-linux-gnu/libaio.so.1
        return 0
    fi

    log "Installing libaio1t64 and saving it locally"
    try sudo apt-get update
    try sudo apt-get install -y libaio1t64

    if [ ! -e "/usr/lib/x86_64-linux-gnu/libaio.so.1t64" ]; then
        warn "libaio.so.1t64 not found after install, skipping libaio setup"
        return 0
    fi

    try mkdir -p /home/jovyan/lib
    try sudo cp /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /home/jovyan/lib/libaio.so.1
    try sudo cp /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
    return 0
}

configure_ld() {
    try sudo sh -c "echo /opt/oracle/instantclient_21_13 > /etc/ld.so.conf.d/oracle-instantclient.conf"
    try sudo ldconfig
    return 0
}

# Env var for ROracle
configure_r_kernel() {
    local kernel="/opt/conda/share/jupyter/kernels/ir/kernel.json"
    if [ ! -f "$kernel" ]; then
        log "R kernel not found ($kernel), skipping LD_LIBRARY_PATH patch"
        return 0
    fi
    if grep -q "LD_LIBRARY_PATH" "$kernel"; then
        return 0
    fi
    try sed -i '$i \  ,\"env\": {\n \    \"LD_LIBRARY_PATH\": \"/home/jovyan/instantclient_21_13\",\n \    \"OCI_LIB\": \"/home/jovyan/instantclient_21_13\"\n }' "$kernel"
    return 0
}

# Lib for RPostgreSQL
install_libpq() {
    try sudo apt-get update
    try sudo apt-get install -y libpq-dev
    return 0
}

install_uv() {
    if [ -x "/home/jovyan/.local/bin/uv" ]; then
        return 0
    fi
    log "Installing uv"
    curl -LsSf https://astral.sh/uv/0.7.21/install.sh | sh
    if [ $? -ne 0 ] || [ ! -x "/home/jovyan/.local/bin/uv" ]; then
        warn "uv install failed"
    fi
    return 0
}

venv_folder="/home/jovyan/.venv3-12-11"

install_python_kernel() {
    if ! command -v uv >/dev/null 2>&1; then
        warn "uv unavailable, skipping Python kernel and libs"
        return 1
    fi
    if [ -d "/home/jovyan/.local/share/uv/python/cpython-3.12.11-linux-x86_64-gnu" ]; then
        return 0
    fi
    # Setup python version for the kernel.
    try uv python install 3.12.11
    try uv venv "$venv_folder" -p 3.12.11
    try uv pip install -p "$venv_folder/bin/python3" ipykernel pip
    try uv run -p "$venv_folder/bin/python3" -m ipykernel install --name python3.12.11 --user
    return 0
}

# Install all the default libs.
install_default_libs() {
    if [ ! -x "$venv_folder/bin/python3" ]; then
        warn "venv $venv_folder missing, skipping default libs"
        return 0
    fi
    try uv pip install -p "$venv_folder/bin/python3" \
        google-genai==1.57.0 \
        minio==7.2.20 \
        mlflow==3.1.1 \
        openai==2.14.0 \
        pandas==2.3.3 \
        plotly==6.5.1 \
        matplotlib==3.10.8 \
        python-dotenv==1.2.1 \
        scikit-learn==1.8.0 \
        vertexai==1.71.1 \
        tqdm==4.67.1
    return 0
}

install_oracle_client
install_libaio
configure_ld
configure_r_kernel
install_libpq
install_uv

export PATH="/home/jovyan/.local/bin:$PATH"

if install_python_kernel; then
    install_default_libs
fi

log "Provisioning finished (best-effort)."
exit 0
