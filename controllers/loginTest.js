import axios from "axios";

// ===============================
// EXTRACT JSON FROM JSONP
// ===============================
function extractJsonFromJsonp(raw, callback) {
    const pattern = new RegExp(callback + '\\(\\"(.*)\\"\\);', 's');
    const match = raw.match(pattern);

    if (!match || !match[1]) {
        console.log("❌ JSONP Extract Failed");
        console.log("RAW:", raw);
        return null;
    }

    const cleaned = match[1].replace(/\\"/g, '"');

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log("❌ JSON parse error:", e);
        return null;
    }
}

// ===============================
// LOGIN + SECOND API FUNCTION
// ===============================
export async function testLogin(req, res) {
    console.log("===== TESTING LOGIN + SECOND API =====");

    const loginUrl = "https://apis.gxg.app/BOWCF/Backoffice.svc/BackofficeLogin";

    let loginResp;
    try {
        loginResp = await axios.get(loginUrl, {
            params: {
                username: "gxgfff",
                password: "haier9696",
                callback: "handleLogin"
            }
        });
    } catch (err) {
        return res.json({ status: false, msg: "Login API Request Failed", error: err.toString() });
    }

    const loginJson = extractJsonFromJsonp(loginResp.data, "handleLogin");
    if (!loginJson || !loginJson.SessionID) {
        return res.json({ status: false, msg: "Login Failed", raw: loginResp.data });
    }

    const sessionID = loginJson.SessionID;
    console.log("Login Successful. SessionID:", sessionID);

    // ================================
    // SECOND API CALL (Example: CreateClient)
    // ================================
    const clientData = {
        FirstName: "Moazzam Hussain",
        Username: "moazzam123" + Date.now(), // unique username
        Password: "Test@1234",
        InvestorPassword: "Invest@1234",
        Country: "Pakistan",
        ParentID: 8564,
        callback: "handleCreateClient"
    };

    let createResp;
    try {
        createResp = await axios.get(
            "https://apis.gxg.app/BOWCF/Backoffice.svc/CreateClient",
            { params: { ...clientData, SessionID: sessionID } }
        );
    } catch (err) {
        return res.json({ status: false, msg: "CreateClient API Request Failed", error: err.toString() });
    }

    const createJson = extractJsonFromJsonp(createResp.data, "handleCreateClient");
    if (!createJson) {
        return res.json({ status: false, msg: "CreateClient Parse Failed", raw: createResp.data });
    }

    console.log("Client Created Successfully");

    // ================================
    // COMBINED RESPONSE
    // ================================
    return res.json({
        status: true,
        msg: "Login + Client Creation Successful",
        LoginData: loginJson,
        ClientData: createJson
    });
}
