# Email Automation

A local desktop app for sending bulk emails through Gmail using a spreadsheet as your recipient list.

---

## Download & Install

Go to [**Releases**](../../releases/latest) and download the file for your OS:

| OS | File to download |
|---|---|
| Mac | `Email-Automation-x.x.x-arm64.dmg` |
| Windows | `Email-Automation-x.x.x-Setup.exe` |

### Mac — "damaged and can't be opened" fix

macOS blocks unsigned apps by default. The app is not damaged — run this in Terminal after downloading:

```bash
xattr -cr ~/Downloads/Email\ Automation-*.dmg
```

Then open the DMG and drag the app to Applications. If you still see a warning after installing, run:

```bash
xattr -cr "/Applications/Email Automation.app"
```

Then open it normally.

### Windows — SmartScreen warning fix

Windows may show "Windows protected your PC". Click **More info → Run anyway**.

---

## First-Time Setup — Connect Gmail

The app needs Google OAuth credentials to access your Gmail account. This is a one-time setup.

### Step 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**, give it a name, click **Create**

### Step 2 — Enable the Gmail API

1. In the left menu go to **APIs & Services → Library**
2. Search for **Gmail API** and click **Enable**

### Step 3 — Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. If prompted, configure the consent screen first:
   - User type: **External**
   - Fill in app name and your email, save
   - Add your email as a **Test user**
4. Back on Create Credentials, set:
   - Application type: **Desktop app**
   - Name: anything (e.g. `Email Automation`)
5. Click **Create**
6. Under **Authorized redirect URIs**, add: `http://localhost:4242/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 4 — Enter credentials in the app

1. Open Email Automation
2. Click **Settings** in the left sidebar
3. Paste your **Client ID** and **Client Secret**
4. Click **Save Settings**
5. Click **Connect Gmail Account** — your browser will open for Google sign-in
6. After approving, return to the app — the sidebar will show Gmail as connected

---

## How to Use

### 1. Upload your spreadsheet
- Click **Upload Sheet** and select an `.xlsx`, `.xls`, or `.csv` file
- Choose the column that contains email addresses
- Set the start and end row range

### 2. Select a template
- Your Gmail **Drafts** are used as email templates
- Create a draft in Gmail first, then click **Refresh Drafts** in the app
- Select the draft you want to send

### 3. Set up attachments (optional)
- Toggle attachments on
- Select a folder containing your files
- Set the naming pattern (e.g. prefix `INV-`, starting number `100`, extension `pdf`)
- Row 1 → `INV-100.pdf`, Row 2 → `INV-101.pdf`, and so on

### 4. Review and send
- Check the **Final Review** table — email addresses and attachment names
- Click **Start Sending**
- Watch the live progress and log console
- Logs are saved and viewable any time under **Logs**

---

## Run from Source

Requires [Node.js](https://nodejs.org) (v18 or later).

```bash
git clone https://github.com/nitinraina-dev/email-automation.git
cd email-automation
npm install
npm run dev
```

### Build a local installer

```bash
npm run package
```

Output is in the `release/` folder.

---

## Gmail Sending Limits

| Account type | Daily limit |
|---|---|
| Free Gmail | ~500 emails/day |
| Google Workspace | ~2,000 emails/day |

The app sends one email every **2.5 seconds** by default to avoid rate limiting. You can change this in **Settings**.

---

## Troubleshooting

**"Gmail not connected" after signing in**
Make sure you added `http://localhost:4242/callback` as an authorized redirect URI in Google Cloud Console (Step 3 above).

**"No drafts found"**
Create at least one draft in Gmail (it can be a simple test draft), then click **Refresh Drafts** in the app.

**Emails sending but going to spam**
This is a Gmail deliverability issue unrelated to the app. Consider warming up your sending volume gradually.

**App crashes on open (Mac)**
Run `xattr -cr "/Applications/Email Automation.app"` in Terminal and try again.
