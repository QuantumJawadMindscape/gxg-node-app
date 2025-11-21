import express from "express";
import { testLogin } from "../controllers/loginTest.js";


const router = express.Router();


router.get("/create-first-account", testLogin);


export default router;
