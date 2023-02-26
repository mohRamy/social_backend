const express = require("express");

const { User } = require("../models/user");
const Chat = require("../models/chat");
const bcryptjs = require("bcryptjs");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");


authRouter.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password, photo } = req.body;

        // multer for images

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ msg: "User with same email already exists!" });
        }

        const hashedPassword = await bcryptjs.hash(password, 8);

        let user = new User({
            name,
            email,
            password: hashedPassword,
            photo,
        });
        user = await user.save();

        let chat = new Chat({
            userId: user.id,
        });
        chat = await chat.save();

        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

authRouter.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "User with this email does not exist!" });
        }
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Incorrect password." });
        }
        const token = jwt.sign({ id: user._id }, "passwordKeys");

        res.json({ token, ...user._doc });

    } catch (e) {
        res.status(500).json({ error: e.toString });
    }
});

authRouter.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.header("x-auth-token");
        if (!token) return res.json(false);
        const verified = jwt.verify(token, "passwordKeys");
        if (!verified) return res.json(false);

        const user = await User.findById(verified.id);
        if (!user) return res.json(false);
        res.json(true);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// get user data
authRouter.get("/get-my-data", auth, async (req, res) => {
    const user = await User.findById(req.user);
    res.json({ ...user._doc, token: req.token });
});

authRouter.get("/user-by-id", auth, async (req, res) => {
    const user = await User.findById(req.query.userId);
    res.json(user);
});

module.exports = authRouter;