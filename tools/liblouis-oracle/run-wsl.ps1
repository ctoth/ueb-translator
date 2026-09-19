param(
    [Parameter(Mandatory)][ValidateSet('dictionary', 'corpus', 'inventory', 'fuzz', 'scan', 'audit-dictionary', 'audit-corpus')][string]$Channel,
    [Parameter(Mandatory)][string]$Output,
    [Parameter(Mandatory)][string]$OracleBinary,
    [string]$NodeBinary = 'node',
    [int]$Seed = 628265697,
    [int]$Runs = 100000,
    [string]$Sweep,
    [string]$BaselineModule
)
$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$linuxRoot = & wsl.exe --exec wslpath -a $repository.Replace('\', '/')
if ($LASTEXITCODE -ne 0) { throw 'Could not resolve the repository in WSL' }
$compiled = 'node_modules/.cache/ueb-translator/liblouis-oracle/tools/liblouis-oracle/src'
[string[]]$channelArguments = switch ($Channel) {
    'dictionary' { @("$compiled/empirical-sweep.js", 'dictionary', '.corpus-cache/scowl/2020.12.07-level-95/words.txt') }
    'corpus' { @("$compiled/empirical-sweep.js", 'corpus',
        '.corpus-cache/prepared/gutenberg-1342-74f2665d6e6925fc2c17dec644bec9e87df478a0f1836822125e8acbb3777806',
        '.corpus-cache/prepared/wikinews-20260801') }
    'inventory' { @("$compiled/inventory-sweep.js") }
    'fuzz' { @("$compiled/fuzz-sweep.js") }
    'scan' { @("$compiled/fuzz-scan-cli.js") }
}
if ($Channel.StartsWith('audit-')) {
    if (!$Sweep -or !$BaselineModule) { throw 'Audit requires -Sweep and -BaselineModule (WSL paths)' }
    $kind = $Channel.Substring(6)
    $ledger = if ($kind -eq 'dictionary') { 'empirical-disagreements.json' } else { 'empirical-corpus-disagreements.json' }
    $inputs = if ($kind -eq 'dictionary') { @('.corpus-cache/scowl/2020.12.07-level-95/words.txt') } else {
        @('.corpus-cache/prepared/gutenberg-1342-74f2665d6e6925fc2c17dec644bec9e87df478a0f1836822125e8acbb3777806',
          '.corpus-cache/prepared/wikinews-20260801')
    }
    $channelArguments = @("$compiled/reconcile-audit-cli.js", "tools/liblouis-oracle/$ledger", $Sweep, $BaselineModule, $kind) + $inputs
}
$destination = [IO.Path]::GetFullPath($Output)
if (Test-Path -LiteralPath $destination) { throw "Refusing to replace $destination" }
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
$linuxResult = & wsl.exe --exec wslpath -a "$destination.result.json".Replace('\', '/')
& wsl.exe --cd $linuxRoot --exec env "LIBLOUIS_ORACLE_BIN=$OracleBinary" `
    "ORACLE_FUZZ_SEED=$Seed" "ORACLE_FUZZ_NUM_RUNS=$Runs" "ORACLE_FUZZ_RESULT=$linuxResult" `
    "ORACLE_SCAN_DIRECTORY=$linuxResult.scan" `
    $NodeBinary @channelArguments | Out-File -LiteralPath $destination -Encoding utf8
exit $LASTEXITCODE
