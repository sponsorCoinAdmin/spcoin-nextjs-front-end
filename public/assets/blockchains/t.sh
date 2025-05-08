#!/bin/bash

for dir in */; do
  info_json="${dir}contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/info.json"
  backup_json="${info_json}.bak"

  if [[ -f "$info_json" && -f "$backup_json" ]]; then
    node -e "
      const fs = require('fs');
      const infoPath = '$info_json';
      const backupPath = '$backup_json';
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

      if (backup.name) {
        info.name = backup.name;
        fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
        console.log('✅ Replaced name in: ' + infoPath);
      } else {
        console.warn('⚠️ No name field in: ' + backupPath);
      }
    "
  else
    echo "❌ Missing file in $dir"
  fi
done

