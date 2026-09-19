#!/usr/bin/env python3
import sys, json, jsonschema
sc=json.load(open(sys.argv[1])); schema=json.load(open(sys.argv[2] if len(sys.argv)>2 else 'schema/scenario.schema.json'))
jsonschema.validate(sc, schema); print('OK:', sys.argv[1])
