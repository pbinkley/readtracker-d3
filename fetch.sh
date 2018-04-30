#!/bin/sh
gdrive download `gdrive list --query 'name contains "readtracker.json"' --no-header -m 1 --order 'modifiedTime desc' | awk '{ print $1 }'` --force

