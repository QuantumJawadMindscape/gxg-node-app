import puppeteer from "puppeteer";

// ===============================
// LOGIN + SECOND API FUNCTION USING PUPPETEER
// ===============================
export async function testLogin(req, res) {
    console.log("===== TESTING LOGIN + SECOND API =====");

    let browser;
    try {
        // Launch headless browser
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set browser headers
        await page.setExtraHTTPHeaders({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://gxg.app/",
            "Origin": "https://gxg.app"
        });

        // ===============================
        // LOGIN STEP
        // ===============================
        const loginUrl = "https://apis.gxg.app/BOWCF/Backoffice.svc/BackofficeLogin?username=gxgfff&password=haier9696&callback=handleLogin";

        await page.goto(loginUrl, { waitUntil: "networkidle0" });

        // Extract JSONP content from page
        const loginRaw = await page.evaluate(() => document.body.innerText);

        // Extract JSON from JSONP
        const loginJson = extractJsonFromJsonp(loginRaw, "handleLogin");
        if (!loginJson || !loginJson.SessionID) {
            return res.json({ status: false, msg: "Invalid Login Response", raw: loginRaw });
        }

        const sessionID = loginJson.SessionID;
        console.log("Login successful. SessionID:", sessionID);

        
        // ===============================
        // SECOND API CALL - CREATE CLIENT
        // ===============================
        const clientData = {
            FirstName: "Moazzam Hussain",
            Username: "moazzam" + Date.now(),
            Password: "Test@1234",
            InvestorPassword: "Invest@1234",
            Country: "Pakistan",
            ParentID: 8564,
            callback: "handleCreateClient"
        };

        const clientUrl = `https://apis.gxg.app/BOWCF/Backoffice.svc/CreateClient?SessionID=${sessionID}&FirstName=${encodeURIComponent(clientData.FirstName)}&Username=${encodeURIComponent(clientData.Username)}&Password=${encodeURIComponent(clientData.Password)}&InvestorPassword=${encodeURIComponent(clientData.InvestorPassword)}&Country=${encodeURIComponent(clientData.Country)}&ParentID=${clientData.ParentID}&callback=handleCreateClient`;

        await page.goto(clientUrl, { waitUntil: "networkidle0" });

        const createRaw = await page.evaluate(() => document.body.innerText);
        const createJson = extractJsonFromJsonp(createRaw, "handleCreateClient");

        if (!createJson) {
            return res.json({ status: false, msg: "Client Creation Parse Failed", raw: createRaw });
        }

        console.log("Client created successfully");

        return res.json({
            status: true,
            msg: "Login + Client Creation Successful",
            LoginData: loginJson,
            ClientData: createJson
        });

    } catch (err) {
        return res.json({ status: false, msg: "Error occurred", error: err.toString() });
    } finally {
        if (browser) await browser.close();
    }
}

// ===============================
// HELPER FUNCTION TO PARSE JSONP
// ===============================
function extractJsonFromJsonp(raw, callback) {
    const pattern = new RegExp(callback + '\\(\\"(.*)\\"\\);', 's');
    const match = raw.match(pattern);

    if (!match || !match[1]) return null;

    const cleaned = match[1].replace(/\\"/g, '"');

    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}
