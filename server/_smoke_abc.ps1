$ErrorActionPreference = 'Continue'
Set-Location 'E:\plate_esnas\esnas_drc'
$node = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path $node)) { $node = (Get-Command node).Source }
$base = 'http://127.0.0.1:5000/api'

Write-Output '--- restart api ---'
Get-NetTCPConnection -LocalPort 5000 -State Listen -EA 0 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -EA 0 }
Start-Sleep -Seconds 2
Remove-Item server\_out.log,server\_err.log -Force -EA 0
Start-Process -FilePath $node -ArgumentList 'server/index.js' -WorkingDirectory 'E:\plate_esnas\esnas_drc' -RedirectStandardOutput 'E:\plate_esnas\esnas_drc\server\_out.log' -RedirectStandardError 'E:\plate_esnas\esnas_drc\server\_err.log' -WindowStyle Hidden
Start-Sleep -Seconds 4

try {
  $h = Invoke-RestMethod "$base/health"
  Write-Output ("HEALTH " + ($h | ConvertTo-Json -Compress))
} catch {
  Write-Output ('HEALTH_FAIL ' + $_.Exception.Message)
  Get-Content server\_err.log -EA 0 | Select-Object -Last 20
  exit 1
}

$email = ("abc{0}@esnas.local" -f (Get-Random))
$regBody = @{ firstName='Abc'; lastName='Flow'; email=$email; password='Test1234'; country='France' } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $regBody
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{ email=$email; password='Test1234' } | ConvertTo-Json)
$token = $login.token
$hdr = @{ Authorization = "Bearer $token" }
Write-Output ("LOGIN role=" + $login.user.role + " id=" + $login.user.id)

# Promote admin via script
& $node server/scripts/promoteAdmin.js $email admin
$login2 = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{ email=$email; password='Test1234' } | ConvertTo-Json)
$hdr = @{ Authorization = ("Bearer " + $login2.token) }
Write-Output ("PROMOTED role=" + $login2.user.role)

# A health-db
try {
  $db = Invoke-RestMethod -Headers $hdr -Uri "$base/admin/health-db"
  Write-Output ("A_HEALTH_DB ok tables=" + $db.tables.Count + " usersMissing=" + (($db.schemaCheck.Users.missing -join ',') ))
} catch {
  Write-Output ('A_HEALTH_DB_FAIL ' + $_.Exception.Message)
}

# B payment intent + confirm
$intentBody = @{
  beneficiary = @{ lastName='Mbuyi'; firstName='Therese'; phone='+243810000111'; city='Kinshasa'; address='Gombe'; nationalID='N-TEST-1' }
  productDetails = @{ branch='Sante'; coverageLevel='Confort'; price=45 }
  gateway = 'simulation'
  currency = 'USD'
} | ConvertTo-Json -Depth 5
$intent = Invoke-RestMethod -Method Post -Uri "$base/payment/intent" -Headers $hdr -ContentType 'application/json' -Body $intentBody
Write-Output ("B_INTENT tx=" + $intent.transactionReference + " pol=" + $intent.policyNumber + " sim=" + $intent.simulation)
$confirm = Invoke-RestMethod -Method Post -Uri "$base/payment/confirm" -Headers $hdr -ContentType 'application/json' -Body (@{ transactionReference = $intent.transactionReference } | ConvertTo-Json)
Write-Output ("B_CONFIRM pol=" + $confirm.policyNumber + " msg=" + $confirm.message)

$verify = Invoke-RestMethod -Headers $hdr -Uri ($base + '/admin/verify/policy/' + $confirm.policyNumber)
Write-Output ("B_VERIFY valid=" + $verify.valid + " remaining=" + $verify.policy.remainingLimitUSD)

# C claim file + status
$claimBody = @{
  policyNumber = $confirm.policyNumber
  description = 'Consultation test automatise ABC'
  estimatedCost = 50
  eventDate = (Get-Date).ToString('o')
} | ConvertTo-Json
$claim = Invoke-RestMethod -Method Post -Uri "$base/claim/file-claim" -Headers $hdr -ContentType 'application/json' -Body $claimBody
Write-Output ("C_FILE claim=" + $claim.claimNumber + " status=" + $claim.claim.ClaimStatus)
$review = Invoke-RestMethod -Method Patch -Uri ($base + '/claims/' + $claim.claimNumber + '/status') -Headers $hdr -ContentType 'application/json' -Body (@{ status='under_review'; reviewerNotes='prise en charge' } | ConvertTo-Json)
Write-Output ("C_REVIEW status=" + $review.claim.ClaimStatus)
$approve = Invoke-RestMethod -Method Patch -Uri ($base + '/claims/' + $claim.claimNumber + '/status') -Headers $hdr -ContentType 'application/json' -Body (@{ status='approved'; approvedAmount=40; reviewerNotes='ok 40usd' } | ConvertTo-Json)
Write-Output ("C_APPROVE status=" + $approve.claim.ClaimStatus + " amt=" + $approve.claim.ApprovedAmountUSD)
$v2 = Invoke-RestMethod -Headers $hdr -Uri ($base + '/admin/verify/policy/' + $confirm.policyNumber)
Write-Output ("C_LIMIT_AFTER remaining=" + $v2.policy.remainingLimitUSD)

$list = Invoke-RestMethod -Headers $hdr -Uri "$base/claims?status=approved"
Write-Output ("C_LIST approved=" + $list.claims.Count)
Write-Output '--- DONE ABC ---'
Get-Content server\_out.log -EA 0 | Select-Object -Last 8
