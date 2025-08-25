grep -RIn \
  --include=\*.ts --include=\*.tsx --include=\*.js --include=\*.jsx \
  --exclude-dir=node_modules --exclude-dir=.next \
  'useEffect[[:space:]]*[(]' .
