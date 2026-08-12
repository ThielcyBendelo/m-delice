$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:5000/api'
$node = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path $node)) { $node = (Get-Command node).Source }

try {
  $h = Invoke-RestMethod "$base/health"
  Write-Output ("HEALTH " + $h.status + " automation=" + $h.automation)
} catch {
  Write-Output 'API down - starting...'
  Start-Process -FilePath $node -ArgumentList 'server/index.js' -WorkingDirectory 'E:\plate_esnas\esnas_drc' -WindowStyle Hidden
  Start-Sleep -Seconds 6
  $h = Invoke-RestMethod "$base/health"
  Write-Output ("HEALTH " + $h.status)
}

$email = ("abc{0}@esnas.local" -f (Get-Random))
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body (@{
  firstName = 'Abc'; lastName = 'Flow'; email = $email; password = 'Test1234'; country = 'France'
} | ConvertTo-Json) | Out-Null

& $node 'E:\plate_esnas\esnas_drc\server\scripts\promoteAdmin.js' $email admin | Write-Output

$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{
  email = $email; password = 'Test1234'
} | ConvertTo-Json)
$hdr = @{ Authorization = ('Bearer ' + $login.token) }
Write-Output ("ROLE=" + $login.user.role)

$db = Invoke-RestMethod -Headers $hdr -Uri "$base/admin/health-db"
Write-Output ("A_OK tables=" + $db.tables.Count + " db=" + $db.connection.DbName)

$intent = Invoke-RestMethod -Method Post -Uri "$base/payment/intent" -Headers $hdr -ContentType 'application/json' -Body (@{
  beneficiary = @{ lastName = 'Mbuyi'; firstName = 'Therese'; phone = '+243810000111'; city = 'Kinshasa'; address = 'Gombe'; nationalID = 'N1' }
  productDetails = @{ branch = 'Sante'; coverageLevel = 'Confort'; price = 45 }
  gateway = 'simulation'
  currency = 'USD'
} | ConvertTo-Json -Depth 5)
Write-Output ("B_INTENT pol=" + $intent.policyNumber + " tx=" + $intent.transactionReference)

$confirm = Invoke-RestMethod -Method Post -Uri "$base/payment/confirm" -Headers $hdr -ContentType 'application/json' -Body (@{
  transactionReference = $intent.transactionReference
} | ConvertTo-Json)
Write-Output ("B_CONFIRM pol=" + $confirm.policyNumber)

$claim = Invoke-RestMethod -Method Post -Uri "$base/claim/file-claim" -Headers $hdr -ContentType 'application/json' -Body (@{
  policyNumber = $confirm.policyNumber
  description = 'Test sinistre ABC'
  estimatedCost = 50
} | ConvertTo-Json)
Write-Output ("C_FILE " + $claim.claimNumber)

$ap = Invoke-RestMethod -Method Patch -Uri ($base + '/claims/' + $claim.claimNumber + '/status') -Headers $hdr -ContentType 'application/json' -Body (@{
  status = 'approved'
  approvedAmount = 40
  reviewerNotes = 'ok'
} | ConvertTo-Json)
Write-Output ("C_APPROVE " + $ap.claim.ClaimStatus + " amt=" + $ap.claim.ApprovedAmountUSD)

$v = Invoke-RestMethod -Headers $hdr -Uri ($base + '/admin/verify/policy/' + $confirm.policyNumber)
Write-Output ("VERIFY valid=" + $v.valid + " remaining=" + $v.policy.remainingLimitUSD)
Write-Output 'ABC_SMOKE_OK'
