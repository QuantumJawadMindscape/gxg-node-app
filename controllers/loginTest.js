import axios from "axios";

// ===============================
// UNIVERSAL JSONP PARSER (SAFE)
// ===============================
function extractJsonFromJsonp(raw, callback) {
    try {
        raw = raw.trim();

        const prefix = `${callback}(`;
        const suffix = `);`;

        if (!raw.startsWith(prefix) || !raw.endsWith(suffix)) {
            console.log("❌ JSONP Extract Failed — Format mismatch");
            console.log("RAW:", raw);
            return null;
        }

        // Get inside content
        let jsonPart = raw.substring(prefix.length, raw.length - suffix.length).trim();

        // If content is string-wrapped JSON → " {\"a\":1} "
        if (
            (jsonPart.startsWith('"') && jsonPart.endsWith('"')) ||
            (jsonPart.startsWith("'") && jsonPart.endsWith("'"))
        ) {
            jsonPart = jsonPart.slice(1, -1); // remove outer quotes
            jsonPart = jsonPart.replace(/\\"/g, '"'); // unescape quotes
            jsonPart = jsonPart.replace(/\\'/g, "'"); // unescape single quotes
        }

        return JSON.parse(jsonPart);

    } catch (err) {
        console.log("❌ JSONP PARSE ERROR:", err);
        console.log("RAW:", raw);
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
    console.log("✔ Login Successful. SessionID:", sessionID);

    // ================================
    // SECOND API CALL: CreateClient
    // ================================
    const clientData = {
        FirstName: "Moazzam Hussain",
        Username: "moazzam123" + Date.now(),
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

    console.log("✔ Client Created Successfully");

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
