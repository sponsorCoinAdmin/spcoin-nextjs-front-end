$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outPath = Join-Path $root 'docs/DropDownAccessMethods.xlsx'
$backupPath = Join-Path $root 'docs/DropDownAccessMethods.xlsx.bak'

if (Test-Path $outPath) {
  Copy-Item -LiteralPath $outPath -Destination $backupPath -Force
}

function Read-Text($rel) {
  Get-Content -LiteralPath (Join-Path $root $rel) -Raw
}

function Get-ImportMap($text) {
  $map = @{}
  [regex]::Matches($text, "import\s+(\w+)\s+from\s+'\.\/([^']+)'") | ForEach-Object {
    $map[$_.Groups[1].Value] = $_.Groups[2].Value
  }
  return $map
}

function Get-ObjectKeys($text, $objectName) {
  $start = $text.IndexOf("export const $objectName")
  if ($start -lt 0) { return @() }
  $open = $text.IndexOf('{', $start)
  $depth = 0
  $end = $open
  for ($i = $open; $i -lt $text.Length; $i++) {
    $ch = $text[$i]
    if ($ch -eq '{') { $depth++ }
    elseif ($ch -eq '}') {
      $depth--
      if ($depth -eq 0) {
        $end = $i
        break
      }
    }
  }
  $block = $text.Substring($open + 1, $end - $open - 1)
  $keys = @()
  foreach ($line in ($block -split "`r?`n")) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*,?\s*$') {
      $keys += $matches[1]
    } elseif ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:') {
      $keys += $matches[1]
    }
  }
  return $keys
}

function Get-StringArray($text, $constName) {
  $match = [regex]::Match($text, "export\s+const\s+$constName[\s\S]*?=\s*\[([\s\S]*?)\];")
  if (-not $match.Success) { return @() }
  return @([regex]::Matches($match.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value })
}

function Get-ParamsForDef($rel) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) { return '' }
  $text = Get-Content -LiteralPath $path -Raw
  $labels = @([regex]::Matches($text, "label:\s*'([^']+)'") | ForEach-Object { $_.Groups[1].Value })
  if ($labels.Count -eq 0) { return '' }
  return ($labels -join ', ')
}

function Get-Executable($rel) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) { return 'yes' }
  $text = Get-Content -LiteralPath $path -Raw
  if ($text -match 'executable:\s*false') { return 'no' }
  return 'yes'
}

function Add-MethodRow([System.Collections.Generic.List[object[]]]$rows, [string]$panel, [string]$group, [string]$method, [string]$params, [string]$executable, [string]$visibility, [string]$source) {
  $rows.Add([object[]]@($panel, $group, $method, $params, $executable, $visibility, $source))
}

function XmlEscape($value) {
  return [System.Security.SecurityElement]::Escape([string]$value)
}

function ColName([int]$n) {
  $name = ''
  while ($n -gt 0) {
    $n--
    $name = [char](65 + ($n % 26)) + $name
    $n = [math]::Floor($n / 26)
  }
  return $name
}

$rows = [System.Collections.Generic.List[object[]]]::new()
$rows.Add([object[]]@('Panel', 'Dropdown Group', 'Method Name', 'Parameters', 'Executable', 'Visibility / Notes', 'Source'))

$readIndexRel = 'app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/read/defs/index.ts'
$readText = Read-Text $readIndexRel
$readMap = Get-ImportMap $readText
$readKeys = Get-ObjectKeys $readText 'SPCOIN_READ_METHOD_DEFS'
$readRuntime = Read-Text 'app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/read/index.ts'
$readOffchain = Get-StringArray $readRuntime 'SPCOIN_OFFCHAIN_READ_METHODS'
$readAdmin = Get-StringArray $readRuntime 'SPCOIN_ADMIN_READ_METHODS'
$readSender = Get-StringArray $readRuntime 'SPCOIN_SENDER_READ_METHODS'
foreach ($key in $readKeys) {
  $fileBase = if ($readMap.ContainsKey($key)) { $readMap[$key] } else { $key }
  $rel = "app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/read/defs/$fileBase.ts"
  $group = if ($readAdmin -contains $key) { 'Read Admin' } elseif ($readSender -contains $key) { 'Sender Read' } elseif ($readOffchain -contains $key) { 'Offchain / Compound Read' } else { 'SpCoin Read' }
  Add-MethodRow $rows 'SpCoin Read' $group $key (Get-ParamsForDef $rel) (Get-Executable $rel) 'visible' $rel
}

$writeIndexRel = 'app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/index.ts'
$writeText = Read-Text $writeIndexRel
$writeMap = Get-ImportMap $writeText
$writeKeys = Get-ObjectKeys $writeText 'SPCOIN_WRITE_METHOD_DEFS'
$writeRuntime = Read-Text 'app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/index.ts'
$writeAdmin = Get-StringArray $writeRuntime 'SPCOIN_ADMIN_WRITE_METHODS'
$writeSender = Get-StringArray $writeRuntime 'SPCOIN_SENDER_WRITE_METHODS'
$writeTodo = Get-StringArray $writeRuntime 'SPCOIN_TODO_WRITE_METHODS'
$writeOffchain = Get-StringArray $writeRuntime 'SPCOIN_OFFCHAIN_WRITE_METHODS'
$hiddenMatch = [regex]::Match($writeRuntime, 'SPCOIN_HIDDEN_WRITE_METHODS[\s\S]*?\[([\s\S]*?)\]\)')
$writeHidden = if ($hiddenMatch.Success) { @([regex]::Matches($hiddenMatch.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value }) } else { @() }
foreach ($key in $writeKeys) {
  $fileBase = if ($writeMap.ContainsKey($key)) { $writeMap[$key] } else { $key }
  $rel = "app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/$fileBase.ts"
  $groups = @()
  if ($writeAdmin -contains $key) { $groups += 'Owner Admin' }
  if ($writeSender -contains $key) { $groups += 'SpCoin Write' }
  if ($writeTodo -contains $key) { $groups += 'Todo' }
  if ($writeOffchain -contains $key) { $groups += 'Offchain Utility' }
  if ($groups.Count -eq 0) { $groups += 'World Write' }
  $visibility = if ($writeHidden -contains $key) { 'hidden in standard dropdown' } elseif ($writeTodo -contains $key) { 'todo' } else { 'visible' }
  Add-MethodRow $rows 'SpCoin Write' ($groups -join ' / ') $key (Get-ParamsForDef $rel) (Get-Executable $rel) $visibility $rel
}

foreach ($key in @('allowance', 'balanceOf', 'decimals', 'name', 'symbol', 'totalSupply')) {
  $rel = "app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/erc20/read/methods/$key.ts"
  Add-MethodRow $rows 'ERC20 Read' 'ERC20 Read' $key (Get-ParamsForDef $rel) 'yes' 'visible' $rel
}

foreach ($key in @('approve', 'transfer', 'transferFrom')) {
  $rel = "app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/erc20/write/methods/$key.ts"
  Add-MethodRow $rows 'ERC20 Write' 'ERC20 Write' $key (Get-ParamsForDef $rel) 'yes' 'visible' $rel
}

$serialization = @(
  @('external_getSerializedSPCoinHeader', 'Serialization Test', ''),
  @('external_getSerializedAccountRecord', 'Serialization Test', 'Account Key'),
  @('external_getSerializedAccountRewards', 'Serialization Test', 'Account Key'),
  @('external_getSerializedRecipientRecordList', 'Serialization Test', 'Sponsor Key, Recipient Key'),
  @('external_getSerializedRecipientRateList', 'Serialization Test', 'Sponsor Key, Recipient Key, Recipient Rate Key'),
  @('external_serializeAgentRateRecordStr', 'Serialization Test', 'Sponsor Key, Recipient Key, Recipient Rate Key, Agent Key, Agent Rate Key'),
  @('external_getSerializedRateTransactionList', 'Serialization Test', 'Sponsor Key, Recipient Key, Recipient Rate Key, Agent Key, Agent Rate Key'),
  @('compareSpCoinContractSize', 'Read Admin', 'Previous Release Directory, Latest Release Directory'),
  @('getSponsorAccounts', 'Read Admin', ''),
  @('getMasterSponsorList', 'Read Admin', ''),
  @('getMasterSponsorList_BAK', 'Read Admin', ''),
  @('hhFundAccounts', 'Owner Admin', 'Total Token Amount'),
  @('deleteMasterSponsorships', 'Owner Admin', ''),
  @('deleteSponsorTree', 'Owner Admin', 'Sponsor Key'),
  @('deleteSponsorRecipientBranch', 'Owner Admin', 'Sponsor Key, Recipient Key'),
  @('deleteRecipientRateBranch', 'Owner Admin', 'Sponsor Key, Recipient Key, Recipient Rate Key'),
  @('deleteRecipientAgentBranch', 'Owner Admin', 'Sponsor Key, Recipient Key, Recipient Rate Key, Agent Key'),
  @('deleteAgentRateBranch', 'Owner Admin', 'Sponsor Key, Recipient Key, Recipient Rate Key, Agent Key, Agent Rate Key'),
  @('deleteRecipientSponsorships', 'Owner Admin', 'Sponsor Key, Recipient Key'),
  @('deleteRecipientSponsorshipTree', 'Owner Admin', 'Sponsor Key, Recipient Key, Recipient Rate Key'),
  @('deleteAgentSponsorships', 'Owner Admin', 'Sponsor Key, Recipient Key, Recipient Rate Key, Agent Key')
)
foreach ($item in $serialization) {
  Add-MethodRow $rows 'Serialization / Utilities' $item[1] $item[0] $item[2] 'yes' 'visible unless hidden by utility filter' 'app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts'
}

function Build-SheetXml([object[][]]$sheetRowsInput) {
  $sheetRows = [System.Text.StringBuilder]::new()
  for ($r = 0; $r -lt $sheetRowsInput.Count; $r++) {
    $rowNum = $r + 1
    [void]$sheetRows.Append("<row r=""$rowNum"">")
    for ($c = 0; $c -lt $sheetRowsInput[$r].Count; $c++) {
      $col = ColName ($c + 1)
      $value = XmlEscape $sheetRowsInput[$r][$c]
      [void]$sheetRows.Append("<c r=""$col$rowNum"" t=""inlineStr""><is><t>$value</t></is></c>")
    }
    [void]$sheetRows.Append('</row>')
  }

  $lastRow = [Math]::Max(1, $sheetRowsInput.Count)
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:G$lastRow"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="24" customWidth="1"/>
    <col min="2" max="2" width="28" customWidth="1"/>
    <col min="3" max="3" width="42" customWidth="1"/>
    <col min="4" max="4" width="72" customWidth="1"/>
    <col min="5" max="5" width="12" customWidth="1"/>
    <col min="6" max="6" width="28" customWidth="1"/>
    <col min="7" max="7" width="96" customWidth="1"/>
  </cols>
  <sheetData>$sheetRows</sheetData>
  <autoFilter ref="A1:G$lastRow"/>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>
"@
}

function Sheet-RowsByPanel([string]$panel) {
  $result = [System.Collections.Generic.List[object[]]]::new()
  $result.Add($rows[0])
  foreach ($row in $rows | Select-Object -Skip 1) {
    if ($row[0] -eq $panel) { $result.Add($row) }
  }
  return $result.ToArray()
}

function Sheet-RowsByGroupContains([string]$groupFragment) {
  $result = [System.Collections.Generic.List[object[]]]::new()
  $result.Add($rows[0])
  foreach ($row in $rows | Select-Object -Skip 1) {
    if ([string]$row[1] -like "*$groupFragment*") { $result.Add($row) }
  }
  return $result.ToArray()
}

$sheetSpecs = [System.Collections.Generic.List[object]]::new()
$sheetSpecs.Add([pscustomobject]@{ Name = 'All Methods'; Rows = $rows.ToArray() })
$sheetSpecs.Add([pscustomobject]@{ Name = 'SpCoin Read'; Rows = Sheet-RowsByPanel 'SpCoin Read' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'SpCoin Write'; Rows = Sheet-RowsByPanel 'SpCoin Write' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'ERC20 Read'; Rows = Sheet-RowsByPanel 'ERC20 Read' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'ERC20 Write'; Rows = Sheet-RowsByPanel 'ERC20 Write' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Serialization'; Rows = Sheet-RowsByPanel 'Serialization / Utilities' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Owner Admin'; Rows = Sheet-RowsByGroupContains 'Owner Admin' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Read Admin'; Rows = Sheet-RowsByGroupContains 'Read Admin' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Offchain Read'; Rows = Sheet-RowsByGroupContains 'Offchain / Compound Read' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Offchain Utility'; Rows = Sheet-RowsByGroupContains 'Offchain Utility' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'Todo'; Rows = Sheet-RowsByGroupContains 'Todo' })
$sheetSpecs.Add([pscustomobject]@{ Name = 'World Write'; Rows = Sheet-RowsByGroupContains 'World Write' })

$sheetSpecs = @($sheetSpecs | Where-Object { $_.Rows.Count -gt 1 })

$sheetXmlByPath = [ordered]@{}
$sheetsXml = [System.Text.StringBuilder]::new()
$workbookRelsXml = [System.Text.StringBuilder]::new()
$worksheetContentTypes = [System.Text.StringBuilder]::new()
for ($i = 0; $i -lt $sheetSpecs.Count; $i++) {
  $sheetId = $i + 1
  $sheetName = XmlEscape $sheetSpecs[$i].Name
  $sheetPath = "xl/worksheets/sheet$sheetId.xml"
  $sheetXmlByPath[$sheetPath] = Build-SheetXml $sheetSpecs[$i].Rows
  [void]$sheetsXml.Append("<sheet name=""$sheetName"" sheetId=""$sheetId"" r:id=""rId$sheetId""/>")
  [void]$workbookRelsXml.Append("<Relationship Id=""rId$sheetId"" Type=""http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"" Target=""worksheets/sheet$sheetId.xml""/>")
  [void]$worksheetContentTypes.Append("<Override PartName=""/xl/worksheets/sheet$sheetId.xml"" ContentType=""application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml""/>")
}
$styleRelId = $sheetSpecs.Count + 1

$workbookXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>$sheetsXml</sheets>
</workbook>
"@

$workbookRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $workbookRelsXml
  <Relationship Id="rId$styleRelId" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'@

$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  $worksheetContentTypes
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
'@

$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>
'@

$now = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
$core = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$now</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">$now</dcterms:modified>
</cp:coreProperties>
"@

$app = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>
'@

if (Test-Path $outPath) {
  Remove-Item -LiteralPath $outPath -Force
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($outPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $parts = [ordered]@{
    '[Content_Types].xml' = $contentTypes
    '_rels/.rels' = $rels
    'xl/workbook.xml' = $workbookXml
    'xl/_rels/workbook.xml.rels' = $workbookRels
    'xl/styles.xml' = $styles
    'docProps/core.xml' = $core
    'docProps/app.xml' = $app
  }
  foreach ($name in $sheetXmlByPath.Keys) {
    $parts[$name] = $sheetXmlByPath[$name]
  }
  foreach ($name in $parts.Keys) {
    $entry = $zip.CreateEntry($name)
    $stream = $entry.Open()
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try {
      $writer.Write($parts[$name])
    } finally {
      $writer.Dispose()
    }
  }
} finally {
  $zip.Dispose()
}

Write-Output "Wrote $($rows.Count - 1) method rows to $outPath"
Write-Output "Sheets: $(@($sheetSpecs | ForEach-Object { $_.Name }) -join ', ')"
Write-Output "Backup: $backupPath"
