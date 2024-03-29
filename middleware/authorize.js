import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "../models/user-model.js";

const fileName = fileURLToPath(import.meta.url);
const cwd = path.dirname(fileName);
const rootDirectory = path.dirname(cwd);

async function authorizeUser(req, res, next) {
    try {
        const cookies = req.headers.cookie;
        if (!cookies) {
            throw new Error("Credential Error: No cookies present in request");
        }
        let tokenCookie;
        const cookiesArray = cookies.split(";");
        cookiesArray.forEach((cookie) => {
            if (cookie.includes("token")) {
                tokenCookie = cookie.split("=")[1];
            }
        });
        if (!tokenCookie) {
            throw new Error(
                "Credential Error: Token cookie not present in request"
            );
        }
        const decodedClient = jwt.verify(tokenCookie, process.env.JWT_SECRET);
        const id = decodedClient.id;
        const dbUser = await User.findOne({ _id: id });
        if (!dbUser) {
            throw new Error(
                "Credential Error: No matching database user found"
            );
        }
        req.userId = decodedClient.id;
        if (dbUser.admin) {
            req.admin = true;
        }
        next();
    } catch (err) {
        console.error(err);
        if (err.message.startsWith("Credential Error:")) {
            res.status(401);
            res.sendFile(`${rootDirectory}/public/not-authorized.html`);
        } else {
            res.status(500);
            res.json({
                msg: "There has been an error, please try again later",
            });
        }
    }
}

function authorizeAdmin(req, res, next) {
    try {
        let exception;
        if (
            req.path.includes("/schedule") ||
            req.path.includes("/tasks") ||
            req.path.includes("all-pages") ||
            req.path.includes("/logout-user")
        ) {
            exception = true;
        }
        if (!req.admin && !exception) {
            throw new Error(
                "Credential Error: User does not have access to this route"
            );
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(403);
        res.sendFile(`${rootDirectory}/public/not-authorized.html`);
    }
}

export { authorizeUser, authorizeAdmin };
