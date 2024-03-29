import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { User } from "../models/user-model.js";
import { wrapper } from "../middleware/wrapper.js";

const loginAttempt = wrapper(async (req, res) => {
    res.header(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
    );
    if (!req.body.username || !req.body.password) {
        throw new Error("Credential Error: Username or password not provided");
    }
    const attemptUsername = req.body.username;
    const attemptPassword = req.body.password;
    const dbUser = await User.findOne({
        username: String(attemptUsername),
    });
    if (!dbUser) {
        throw new Error(
            "Credential Error: No database user found with provided username"
        );
    }
    const hashedPassword = await bcrypt.compare(
        attemptPassword,
        dbUser.password
    );
    if (!hashedPassword) {
        throw new Error(
            "Credential Error: Provided password does not match stored hash"
        );
    }
    const token = jwt.sign(
        {
            id: dbUser._id,
            username: dbUser.username,
            admin: dbUser.admin,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
    res.status(200);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 2,
    });
    res.json({
        msg: "Logged in successfully",
        id: dbUser._id,
        admin: dbUser.admin,
        username: dbUser.username,
    });
});

export { loginAttempt };
