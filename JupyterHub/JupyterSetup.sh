#!/bin/bash

# Oracle Client Install (UbuntuInstallOracleClient)
sudo mkdir -p /opt/oracle
if [ ! -d "/opt/oracle/instantclient_21_13" ]; then
    if [ -d "/home/jovyan/instantclient_21_13" ]; then
        echo "Copying instant client into /opt/oracle/"
        sudo cp -r /home/jovyan/instantclient_21_13 /opt/oracle/
    else
        echo "Dowloading and copying instant client into /opt/oracle/"
        sudo curl -o basic https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip
        sudo unzip basic
        sudo rm -rf basic
        sudo cp -r /home/jovyan/instantclient_21_13 /opt/oracle/
    fi
fi
if [ ! -e "/usr/lib/x86_64-linux-gnu/libaio.so.1" ]; then
    if [ ! -e "/home/jovyan/lib/libaio.so.1" ]; then
        echo "Installing libaio1t64 and saving it locally"
        sudo apt-get update
        sudo apt-get install libaio1t64

        mkdir -p /home/jovyan/lib
        sudo cp /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /home/jovyan/lib/libaio.so.1
        sudo cp /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
        sudo cp /usr/lib/x86_64-linux-gnu/libaio.so.1 /home/jovyan/lib/libaio.so.1
    else
        echo "Copying libaio.so.1 into /usr/lib/x86_64-linux-gnu/libaio.so.1"
        sudo cp /home/jovyan/lib/libaio.so.1 /usr/lib/x86_64-linux-gnu/libaio.so.1
    fi
fi

sudo sh -c "echo /opt/oracle/instantclient_21_13 > \
      /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig

#Env var for ROracle
if ! grep -q "LD_LIBRARY_PATH" /opt/conda/share/jupyter/kernels/ir/kernel.json; then
  sed -i '$i \  ,\"env\": {\n \    \"LD_LIBRARY_PATH\": \"/home/jovyan/instantclient_21_13\",\n \    \"OCI_LIB\": \"/home/jovyan/instantclient_21_13\"\n }' /opt/conda/share/jupyter/kernels/ir/kernel.json
fi

#Lib for RPosgreSQL
sudo apt update
sudo apt-get install -y libpq-dev

# uv Install
if [ ! -e "/home/jovyan/.local/bin/uv" ]; then
  sudo curl -LsSf https://astral.sh/uv/0.7.21/install.sh | sh
fi

export PATH="/home/jovyan/.local/bin:$PATH"

# Python Kernel Install
if [ ! -d "/home/jovyan/.local/share/uv/python/cpython-3.12.11-linux-x86_64-gnu" ]; then
  venv_folder="/home/jovyan/.venv3-12-11"

  # Setup python version for the kernel.
  uv python install 3.12.11
  uv venv $venv_folder -p 3.12.11
  uv pip install -p $venv_folder/bin/python3 ipykernel pip

  # Install all the default libs.
  uv pip install -p $venv_folder/bin/python3 -r requirement.txt

  uv run -p $venv_folder/bin/python3 -m ipykernel install --name python3.12.11 --user
fi
