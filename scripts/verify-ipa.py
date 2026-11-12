#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from ipa_support import verify_ipa

parser = argparse.ArgumentParser(description='Check an IPA targets a real iPhone and embeds its JavaScript.')
parser.add_argument('ipa', type=Path)
args = parser.parse_args()
print(json.dumps(verify_ipa(args.ipa), indent=2))
