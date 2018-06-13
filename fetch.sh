#!/bin/sh
gdrive download `gdrive list --query 'name contains "readtracker-export"' --no-header -m 1 --order 'modifiedTime desc' | awk '{ print $1 }'` --stdout > readtracker.json

