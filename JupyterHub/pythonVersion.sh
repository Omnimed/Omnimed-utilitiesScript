#!/bin/bash

if [ ! -d "/home/jovyan/.local/share/uv" ]; then
  sudo curl -LsSf https://astral.sh/uv/0.7.21/install.sh | sh
  uv python install 3.12.11
  uv venv /home/jovyan/.venv31211 --python 3.12.11
  uv pip install -p /home/jovyan/.venv31211/bin/python ipykernel pip
  uv run -p /home/jovyan/.venv31211/bin/python -m ipykernel install --name python3.12.11 --user
fi