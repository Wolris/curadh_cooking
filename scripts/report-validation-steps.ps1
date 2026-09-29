[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$LogFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $LogFile -PathType Leaf)) {
    Write-Host "[FAIL] Validation stage report unavailable: $LogFile"
    exit 0
}

$currentStep = $null
$reported = 0

foreach ($line in Get-Content -LiteralPath $LogFile) {
    if ($line -match '^===== Step (?<number>\d+) of (?<total>\d+) - (?<command>.*) =====$') {
        $currentStep = [PSCustomObject]@{
            Number = [int]$Matches['number']
            Total = [int]$Matches['total']
            Command = $Matches['command']
        }
        continue
    }

    if ($null -ne $currentStep -and $line -match '^Exit code: (?<code>-?\d+)$') {
        $exitCode = [int]$Matches['code']
        $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
        Write-Host "[$status] Step $($currentStep.Number)/$($currentStep.Total): $($currentStep.Command) (exit $exitCode)"
        $reported++
        $currentStep = $null
    }
}

if ($reported -eq 0) {
    $statusLine = Get-Content -LiteralPath $LogFile |
        Where-Object { $_ -match '^Status: ' } |
        Select-Object -First 1

    if ($null -ne $statusLine) {
        Write-Host "[INFO] No command stage completed. $statusLine"
    } else {
        Write-Host "[INFO] No completed validation command stages were recorded."
    }
}
