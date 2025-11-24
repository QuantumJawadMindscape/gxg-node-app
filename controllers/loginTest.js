import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

// ===========================================================
// MAIN FUNCTION — Login + CreateClient + CreateAccount
// ===========================================================
export async function testLogin(req, res) {

    let browser;
    const steps = {
        login: { success: false, message: "", data: null },
        createClient: { success: false, message: "", data: null },
        createAccount: { success: false, message: "", data: null }
    };

    try {
        // browser = await puppeteer.launch({ headless: true });
         const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://gxg.app/",
            "Origin": "https://gxg.app"
        });

        // ===========================================================
        // STEP 1 — LOGIN
        // ===========================================================
        const loginUrl =
            "https://apis.gxg.app/BOWCF/Backoffice.svc/BackofficeLogin?" +
            "username=gxgfff&password=haier9696&callback=handleLogin";

        await page.goto(loginUrl, { waitUntil: "networkidle0" });
        const loginRaw = await page.evaluate(() => document.body.innerText);

        const loginJson = extractJsonFromJsonp(loginRaw, "handleLogin");

        if (!loginJson?.SessionID) {
            steps.login.success = false;
            steps.login.message = "Login failed — SessionID missing";
            steps.login.data = loginRaw;

            return res.json({ status: false, steps });
        }

        const sessionID = loginJson.SessionID;

        steps.login.success = true;
        steps.login.message = "Login successful";
        steps.login.data = loginJson;


        // ===========================================================
        // STEP 2 — CREATE CLIENT
        // ===========================================================
        const clientUsername = "Client" + Date.now();

        const clientUrl =
            `https://apis.gxg.app/BOWCF/Backoffice.svc/CreateClient?` +
            `SessionID=${sessionID}` +
            `&FirstName=TestUser` +
            `&Username=${clientUsername}` +
            `&Password=Test@1234` +
            `&InvestorPassword=Invest@1234` +
            `&Country=Pakistan` +
            `&ParentID=8564` +
            `&callback=handleCreateClient`;

        await page.goto(clientUrl, { waitUntil: "networkidle0" });
        const clientRaw = await page.evaluate(() => document.body.innerText);

        let clientJson = extractJsonFromJsonp(clientRaw, "handleCreateClient");

        let clientId = null;

        // CASE 1: JSONP returned structured JSON
        if (clientJson && typeof clientJson === "object") {
            clientId =
                clientJson.ClientID ||
                clientJson.data?.ClientID ||
                clientJson.Client_Id;
        }

        // CASE 2: JSONP returned a STRING → "14787"
        if (!clientId && typeof clientJson === "string") {
            let cleaned = clientJson.replace(/"/g, "").trim();
            if (/^\d+$/.test(cleaned)) {
                clientId = parseInt(cleaned);
            }
        }

        // CASE 3: Raw string — strip everything except digits
        if (!clientId) {
            let cleaned = clientRaw.replace(/[^0-9]/g, "").trim();
            if (/^\d+$/.test(cleaned)) {
                clientId = parseInt(cleaned);
            }
        }

        if (!clientId) {
            steps.createClient.success = false;
            steps.createClient.message = "ClientID not found";
            steps.createClient.data = clientRaw;
            return res.json({ status: false, steps });
        }

        steps.createClient.success = true;
        steps.createClient.message = "Client created successfully";
        steps.createClient.data = { clientId, raw: clientRaw };


        // ===========================================================
        // STEP 3 — CREATE ACCOUNT
        // ===========================================================
        const accountData = {
            ParentID: clientId,
            AccountID: 0,
            AccountType: 1,
            IsDemo: false,
            IsLocked: false,
            DontLiquidate: false,
            IsMargin: true,
            UserDefinedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            callback: "handleCreateAccount"
        };

        const accQuery = Object.keys(accountData)
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(accountData[k])}`)
            .join("&");

        const accUrl =
            `https://apis.gxg.app/BOWCF/Backoffice.svc/CreateAccount?${accQuery}`;

        await page.goto(accUrl, { waitUntil: "networkidle0" });

        const accRaw = await page.evaluate(() => document.body.innerText);

        let accJson = extractJsonFromJsonp(accRaw, "handleCreateAccount");

        let accountId =
            accJson?.AccountID ||
            accJson?.data?.AccountID ||
            null;

        // CASE 2: String
        if (!accountId && typeof accJson === "string") {
            let cleaned = accJson.replace(/"/g, "").trim();
            if (/^\d+$/.test(cleaned)) accountId = parseInt(cleaned);
        }

        // CASE 3: Raw numeric
        if (!accountId) {
            let cleaned = accRaw.replace(/[^0-9]/g, "").trim();
            if (/^\d+$/.test(cleaned)) accountId = parseInt(cleaned);
        }

        if (!accountId || accountId < 0) {
            steps.createAccount.success = false;
            steps.createAccount.message = "Account creation failed";
            steps.createAccount.data = accRaw;
            return res.json({ status: false, steps });
        }

        steps.createAccount.success = true;
        steps.createAccount.message = "Account created successfully";
        steps.createAccount.data = { accountId, raw: accRaw };


        // ===========================================================
        // FINAL RESPONSE
        // ===========================================================
        return res.json({
            status: true,
            steps
        });

    } catch (err) {
        return res.json({ status: false, error: err.toString(), steps });
    } finally {
        if (browser) await browser.close();
    }
}


// ===========================================================
// JSONP PARSER
// ===========================================================
function extractJsonFromJsonp(raw, callback) {
    const pattern = new RegExp(`${callback}\\(\\"(.*)\\"\\);`, "s");
    const match = raw.match(pattern);
    if (!match || !match[1]) return null;

    let cleaned = match[1].replace(/\\"/g, '"');

    try {
        return JSON.parse(cleaned);
    } catch {
        return cleaned; // return raw string if not JSON
    }
}
