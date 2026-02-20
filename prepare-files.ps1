'export default [' | Set-Content src/files.ts -Encoding UTF8

Get-ChildItem -Path 'public/media' -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Replace((Get-Item 'public').FullName, '').Replace('\', '/')
    "'$rel',"
} | Add-Content src/files.ts -Encoding UTF8

']' | Add-Content src/files.ts -Encoding UTF8

pnpm prettier -w src/files.ts
