$root = 'spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist'

Get-ChildItem -Recurse -File $root -Filter *.js | ForEach-Object {
    $jsPath = $_.FullName
    $tsPath = [System.IO.Path]::ChangeExtension($jsPath, '.ts')
    $content = Get-Content -LiteralPath $jsPath -Raw

    $content = $content -replace '"use strict";\r?\n', ''
    $content = $content -replace 'Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\r?\n', ''
    $content = $content -replace '(?m)^exports\..*$\r?\n?', ''

    $aliasMap = @{}

    $content = [regex]::Replace(
        $content,
        '(?m)^(const|var)\s+([A-Za-z0-9_]+)\s*=\s*require\("([^"]+)"\);\s*$',
        {
            param($m)
            $alias = $m.Groups[2].Value
            $spec = $m.Groups[3].Value
            $aliasMap[$alias] = $spec
            return ('import * as ' + $alias + ' from "' + $spec + '";')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?m)^const\s+\{\s*([^}]+?)\s*\}\s*=\s*require\("([^"]+)"\);\s*$',
        {
            param($m)
            $names = ($m.Groups[1].Value -replace '\s+', ' ').Trim()
            $spec = $m.Groups[2].Value
            return ('import { ' + $names + ' } from "' + $spec + '";')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?m)^Object\.defineProperty\(exports, "([A-Za-z0-9_]+)", \{ enumerable: true, get: function \(\) \{ return ([A-Za-z0-9_]+)\.([A-Za-z0-9_]+); \} \}\);\s*$',
        {
            param($m)
            $exportName = $m.Groups[1].Value
            $alias = $m.Groups[2].Value
            $member = $m.Groups[3].Value
            $spec = $aliasMap[$alias]
            if ($spec) {
                return ('export { ' + $member + ' as ' + $exportName + ' } from "' + $spec + '";')
            }
            return ''
        }
    )

    $content = $content -replace '__exportStar\(require\("([^"]+)"\), exports\);', 'export * from "$1";'

    $content = [regex]::Replace(
        $content,
        '(?m)^class\s+([A-Za-z0-9_]+)\s*\{',
        {
            param($m)
            return ('export class ' + $m.Groups[1].Value + ' {')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?m)^(async\s+function|function)\s+([A-Za-z0-9_]+)\s*\(',
        {
            param($m)
            return ('export ' + $m.Groups[1].Value + ' ' + $m.Groups[2].Value + '(')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?m)^const\s+([A-Za-z0-9_]+)\s*=\s*',
        {
            param($m)
            return ('export const ' + $m.Groups[1].Value + ' = ')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?m)^let\s+([A-Za-z0-9_]+)\s*=\s*',
        {
            param($m)
            return ('export let ' + $m.Groups[1].Value + ' = ')
        }
    )

    $content = [regex]::Replace(
        $content,
        '(?s)module\.exports\s*=\s*\{\s*(.*?)\s*\};\s*$',
        {
            param($m)
            return ''
        }
    )

    $content = $content -replace 'exports\.', ''

    $content = "// @ts-nocheck`r`n" + $content
    Set-Content -LiteralPath $tsPath -Value $content -NoNewline
}
