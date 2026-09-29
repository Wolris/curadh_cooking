[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Mode = "all",

    [string]$Branch,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Commands
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$launcherPath = $MyInvocation.MyCommand.Path
$launcherStartHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
$logDirectory = Join-Path $repositoryRoot "validation-logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$logFile = Join-Path $logDirectory "validation-$timestamp.txt"
$latestLogFile = Join-Path $logDirectory "latest.txt"
$technicalLogFile = Join-Path $logDirectory ".technical-$timestamp-$PID.txt"
$tailLineCount = 30
$minimumNodeMajor = 24
$runStartedAt = Get-Date
$script:runStatus = "NOT COMPLETED"
$script:failureSummary = $null
$script:failedStepNumber = $null
$script:nextAction = $null
$script:failureExitCode = 1

$presets = @{
    all = @(
        "git pull --ff-only",
        "npm install",
        "npm run typecheck",
        "npm run test",
        "npm run build",
        "npm run test:e2e"
    )
    quick = @(
        "npm run typecheck",
        "npm run test",
        "npm run build"
    )
    browser = @(
        "npm run test:e2e"
    )
    test = @(
        "npm run test"
    )
    build = @(
        "npm run build"
    )
    typecheck = @(
        "npm run typecheck"
    )
    install = @(
        "npm install"
    )
    audit = @(
        "npm audit"
    )
}

function Show-Usage {
    Write-Host "Curadh Cooking validation"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\validate.cmd                 Full validation (pull/install/typecheck/test/build/browser)"
    Write-Host "  .\validate.cmd quick           Typecheck/test/build without pull, install, or browser"
    Write-Host "  .\validate.cmd browser         Playwright browser validation only"
    Write-Host "  .\validate.cmd test            API/domain tests only"
    Write-Host "  .\validate.cmd build           Production build only"
    Write-Host "  .\validate.cmd typecheck       TypeScript typecheck only"
    Write-Host "  .\validate.cmd install         npm install only"
    Write-Host "  .\validate.cmd audit           npm audit"
    Write-Host "  .\validate.cmd -Branch <name>  Fetch/switch branch, then run full validation"
    Write-Host "  .\validate.cmd quick -Branch <name>"
    Write-Host "                                Fetch/switch branch, then run quick validation"
    Write-Host "  .\validate.cmd custom ""cmd""   Run one or more quoted custom commands"
}

if ($Mode -ieq "help" -or $Mode -ieq "--help" -or $Mode -ieq "-h") {
    Show-Usage
    exit 0
}

if ($Mode -ieq "custom") {
    if ($null -eq $Commands -or $Commands.Count -eq 0) {
        Show-Usage
        throw "Custom validation requires at least one quoted command."
    }
    $requestedCommands = @($Commands)
} elseif ($presets.ContainsKey($Mode)) {
    $requestedCommands = @($presets[$Mode])
} else {
    Show-Usage
    throw "Unknown validation mode: $Mode"
}

if (-not [string]::IsNullOrWhiteSpace($Branch)) {
    if ($Branch -notmatch '^[A-Za-z0-9._/-]+$' -or $Branch.Contains('..')) {
        throw "Invalid branch name: $Branch"
    }

    $switchCommand =
        'git show-ref --verify --quiet "refs/heads/{0}" && git switch "{0}" || git switch --track "origin/{0}"' -f $Branch

    $requestedCommands = @(
        "git fetch origin",
        $switchCommand,
        "git pull --ff-only"
    ) + @(
        $requestedCommands | Where-Object { $_ -ne "git pull --ff-only" }
    )
}

$script:stepResults = @()
for ($index = 0; $index -lt $requestedCommands.Count; $index++) {
    $script:stepResults += [PSCustomObject]@{
        Number = $index + 1
        Command = $requestedCommands[$index]
        Status = "NOT RUN"
        ExitCode = $null
    }
}

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
Set-Location $repositoryRoot

function Get-GitIdentity {
    $branch = (& git branch --show-current 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) {
        $branch = "(unknown or detached)"
    }

    $fullSha = (& git rev-parse HEAD 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($fullSha)) {
        $fullSha = "(unknown)"
    }

    $shortSha = (& git rev-parse --short=12 HEAD 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($shortSha)) {
        $shortSha = "(unknown)"
    }

    $subject = (& git log -1 --pretty=format:%s 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($subject)) {
        $subject = "(unknown)"
    }

    return [PSCustomObject]@{
        Branch = $branch
        FullSha = $fullSha
        ShortSha = $shortSha
        Subject = $subject
    }
}

function Get-WorkingTreeLines {
    $output = @(& git status --short 2>$null)
    if ($LASTEXITCODE -ne 0) {
        return @("(unavailable)")
    }

    if ($output.Count -eq 0) {
        return @("(clean)")
    }

    return $output
}

function Format-HumanTimestamp {
    param([datetime]$Value)
    return $Value.ToString("MMM d, yyyy h:mm:ss tt")
}

function Format-Elapsed {
    param([timespan]$Elapsed)

    if ($Elapsed.TotalHours -ge 1) {
        return "{0}:{1:00}:{2:00}" -f [int][Math]::Floor($Elapsed.TotalHours), $Elapsed.Minutes, $Elapsed.Seconds
    }

    return "{0}:{1:00}" -f [int][Math]::Floor($Elapsed.TotalMinutes), $Elapsed.Seconds
}

function Save-LatestLog {
    $finishedAt = Get-Date
    $finalIdentity = Get-GitIdentity
    $sourceMoved = (
        $startingIdentity.FullSha -ne $finalIdentity.FullSha -or
        $startingIdentity.Branch -ne $finalIdentity.Branch
    )

    $summary = [System.Collections.Generic.List[string]]::new()
    $summary.Add("CURADH COOKING VALIDATION - RUN SUMMARY")
    $summary.Add("=======================================")
    $summary.Add("Status: $script:runStatus")
    $summary.Add("Mode: $Mode")
    if (-not [string]::IsNullOrWhiteSpace($Branch)) {
        $summary.Add("Target branch: $Branch")
    }
    $summary.Add("Started: $(Format-HumanTimestamp $runStartedAt)")
    $summary.Add("Finished: $(Format-HumanTimestamp $finishedAt)")
    $summary.Add("Elapsed: $(Format-Elapsed ($finishedAt - $runStartedAt))")
    $summary.Add("")
    $summary.Add("Node: $nodeVersion")
    $summary.Add("npm: $npmVersion")
    $summary.Add("")
    $summary.Add("Commit Start: $($startingIdentity.Subject) [$($startingIdentity.Branch) @ $($startingIdentity.ShortSha)]")
    $summary.Add("Commit End:   $($finalIdentity.Subject) [$($finalIdentity.Branch) @ $($finalIdentity.ShortSha)]")
    $summary.Add("Source moved during run: $(if ($sourceMoved) { "YES" } else { "NO" })")
    $summary.Add("")
    $summary.Add("Requested validation:")

    foreach ($step in $script:stepResults) {
        $exitText = if ($null -ne $step.ExitCode) { " (exit $($step.ExitCode))" } else { "" }
        $summary.Add("  [$($step.Status)] $($step.Number)/$($script:stepResults.Count): $($step.Command)$exitText")
    }

    if (-not [string]::IsNullOrWhiteSpace($script:failureSummary)) {
        $summary.Add("")
        if ($null -ne $script:failedStepNumber) {
            $summary.Add("Stopped at: Step $script:failedStepNumber - $script:failureSummary")
        } else {
            $summary.Add("Stopped: $script:failureSummary")
        }
    }

    $summary.Add("")
    $summary.Add("Working tree at finish:")
    foreach ($line in @(Get-WorkingTreeLines)) {
        $summary.Add("  $line")
    }

    if (-not [string]::IsNullOrWhiteSpace($script:nextAction)) {
        $summary.Add("")
        $summary.Add("Next: $script:nextAction")
    }

    $summary.Add("")
    $summary.Add("TECHNICAL DETAILS")
    $summary.Add("=================")
    $summary.Add("")

    $summary | Set-Content -Path $logFile -Encoding UTF8
    if (Test-Path -LiteralPath $technicalLogFile -PathType Leaf) {
        Get-Content -LiteralPath $technicalLogFile | Add-Content -Path $logFile -Encoding UTF8
    }

    Copy-Item -Path $logFile -Destination $latestLogFile -Force
    Remove-Item -LiteralPath $technicalLogFile -Force -ErrorAction SilentlyContinue
}

function Invoke-LoggedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Number,

        [Parameter(Mandatory = $true)]
        [int]$Total,

        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    if ([string]::IsNullOrWhiteSpace($Command)) {
        throw "Validation command $Number is blank."
    }

    $stepLogFile = Join-Path (
        [System.IO.Path]::GetTempPath()
    ) "curadh-cooking-validation-$PID-$([Guid]::NewGuid().ToString('N')).txt"

    $heading = "Step $Number of $Total - $Command"
    Write-Host ""
    Write-Host $heading

    @(
        ""
        "===== $heading ====="
        "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
    ) | Add-Content -Path $technicalLogFile -Encoding UTF8

    try {
        $quotedStepLogFile = '"' + $stepLogFile + '"'
        $wrappedCommand = "$Command > $quotedStepLogFile 2>&1"
        & $env:ComSpec /d /s /c $wrappedCommand
        $exitCode = $LASTEXITCODE

        if (Test-Path -LiteralPath $stepLogFile) {
            Get-Content -LiteralPath $stepLogFile |
                Add-Content -Path $technicalLogFile -Encoding UTF8
        }

        @(
            "Exit code: $exitCode"
            "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
        ) | Add-Content -Path $technicalLogFile -Encoding UTF8

        $stepResult = $script:stepResults[$Number - 1]
        $stepResult.ExitCode = $exitCode
        $stepResult.Status = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }

        Write-Host "Exit code: $exitCode"
        Write-Host "Last $tailLineCount output lines:"

        if ((Test-Path -LiteralPath $stepLogFile) -and (Get-Item -LiteralPath $stepLogFile).Length -gt 0) {
            Get-Content -LiteralPath $stepLogFile -Tail $tailLineCount
        } else {
            Write-Host "(No command output.)"
        }

        if ($exitCode -ne 0) {
            $script:failureExitCode = $exitCode
            $script:failedStepNumber = $Number
            $script:failureSummary = "Command failed with exit code $($exitCode): $Command"
            $script:nextAction = "Share validation-logs\latest.txt or correct the failed step, then rerun validation."
            throw "Command failed with exit code $exitCode."
        }
    } finally {
        $ErrorActionPreference = "Stop"
        Remove-Item -LiteralPath $stepLogFile -Force -ErrorAction SilentlyContinue
    }
}

$startingIdentity = Get-GitIdentity
$nodeVersion = (& node --version 2>$null | Out-String).Trim()
$nodeExitCode = $LASTEXITCODE
$npmVersion = (& npm --version 2>$null | Out-String).Trim()
$npmExitCode = $LASTEXITCODE

@(
    "Curadh Cooking validation run"
    "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
    "Repository: $repositoryRoot"
    "Mode: $Mode"
    "Target branch: $(if ([string]::IsNullOrWhiteSpace($Branch)) { "(current branch)" } else { $Branch })"
    "Branch: $($startingIdentity.Branch)"
    "HEAD: $($startingIdentity.FullSha)"
    "Commit: $($startingIdentity.ShortSha) $($startingIdentity.Subject)"
    "Node: $nodeVersion"
    "npm: $npmVersion"
    "Command count: $($requestedCommands.Count)"
    "Commands: $($requestedCommands -join ' ; ')"
    ""
) | Set-Content -Path $technicalLogFile -Encoding UTF8

Write-Host "Validation target: $($startingIdentity.Branch) @ $($startingIdentity.ShortSha)"
Write-Host "Commit: $($startingIdentity.Subject)"
Write-Host "Mode: $Mode"
if (-not [string]::IsNullOrWhiteSpace($Branch)) {
    Write-Host "Target branch: $Branch"
}
Write-Host "Node: $nodeVersion"
Write-Host "npm: $npmVersion"

try {
    if ($nodeExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($nodeVersion)) {
        $script:failureSummary = "Node.js could not be resolved."
        $script:nextAction = "Install/configure Node.js 24 or newer, then rerun validation."
        throw $script:failureSummary
    }

    if ($npmExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($npmVersion)) {
        $script:failureSummary = "npm could not be resolved."
        $script:nextAction = "Install/configure npm, then rerun validation."
        throw $script:failureSummary
    }

    if ($nodeVersion -notmatch '^v(?<major>\d+)') {
        $script:failureSummary = "Node.js version could not be parsed: $nodeVersion"
        $script:nextAction = "Use Node.js 24 or newer, then rerun validation."
        throw $script:failureSummary
    }

    $nodeMajor = [int]$Matches['major']
    if ($nodeMajor -lt $minimumNodeMajor) {
        $script:failureSummary = "Node.js $minimumNodeMajor or newer is required; found $nodeVersion."
        $script:nextAction = "Switch to Node.js 24 or newer, then rerun validation."
        throw $script:failureSummary
    }

    for ($index = 0; $index -lt $requestedCommands.Count; $index++) {
        Invoke-LoggedCommand -Number ($index + 1) -Total $requestedCommands.Count -Command $requestedCommands[$index]

        if ($requestedCommands[$index] -ieq "git pull --ff-only") {
            $launcherCurrentHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
            if ($launcherCurrentHash -ne $launcherStartHash) {
                @(
                    ""
                    "Validation launcher changed during git pull."
                    "Old launcher hash: $launcherStartHash"
                    "New launcher hash: $launcherCurrentHash"
                    "Restarting validation under the updated launcher."
                    "Restarted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
                ) | Add-Content -Path $technicalLogFile -Encoding UTF8

                $script:runStatus = "NOT COMPLETED"
                $script:nextAction = "Validation is restarting automatically under the updated launcher."
                Save-LatestLog

                Write-Host ""
                Write-Host "Validation launcher changed during git pull; restarting with the updated script."

                $restartArguments = @(
                    "-NoLogo",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    $launcherPath,
                    $Mode
                )

                if (-not [string]::IsNullOrWhiteSpace($Branch)) {
                    $restartArguments += @("-Branch", $Branch)
                }

                if ($Mode -ieq "custom" -and $null -ne $Commands) {
                    $restartArguments += @($Commands)
                }

                & powershell.exe @restartArguments
                exit $LASTEXITCODE
            }
        }
    }

    $script:runStatus = "PASS"
    Save-LatestLog

    $finalIdentity = Get-GitIdentity
    Write-Host ""
    Write-Host "All validation commands passed."
    Write-Host "Validated: $($finalIdentity.Branch) @ $($finalIdentity.ShortSha)"
    Write-Host "Latest log: $latestLogFile"
    Write-Host "Archived log: $logFile"
} catch {
    if ([string]::IsNullOrWhiteSpace($script:failureSummary)) {
        $script:failureSummary = $_.Exception.Message
    }
    if ([string]::IsNullOrWhiteSpace($script:nextAction)) {
        $script:nextAction = "Share validation-logs\latest.txt, correct the failure, then rerun validation."
    }

    $script:runStatus = "FAIL"
    Save-LatestLog

    $finalIdentity = Get-GitIdentity
    Write-Host ""
    Write-Host "Validation stopped after a failure."
    Write-Host "Failed on: $($finalIdentity.Branch) @ $($finalIdentity.ShortSha)"
    Write-Host "Latest log: $latestLogFile"
    Write-Host "Archived log: $logFile"

    exit $script:failureExitCode
}
