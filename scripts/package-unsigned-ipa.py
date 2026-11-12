#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from ipa_support import package_ipa

parser = argparse.ArgumentParser(description='Package a compiled unsigned iPhone app for personal signing.')
parser.add_argument('app', type=Path)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
print(json.dumps(package_ipa(args.app, args.destination), indent=2))
