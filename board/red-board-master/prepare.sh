#!/bin/sh
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential python3-dev python3-pip libffi-dev
pip install -r requirements.txt
