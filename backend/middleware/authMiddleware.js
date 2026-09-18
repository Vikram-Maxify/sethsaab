const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // ==========================================
        // TOKEN FROM AUTHORIZATION HEADER
        // ==========================================

        let token = null;

        const authHeader = req.headers.authorization;

        if (
            authHeader &&
            authHeader.startsWith("Bearer ")
        ) {
            token = authHeader.split(" ")[1];
        }

        // ==========================================
        // TOKEN FROM COOKIE
        // ==========================================

        if (!token && req.cookies?.usertoken) {
            token = req.cookies.usertoken;
        }

        // ==========================================
        // TOKEN NOT FOUND
        // ==========================================

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // ==========================================
        // VERIFY TOKEN
        // ==========================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // ==========================================
        // USER DATA
        // ==========================================

        req.user = decoded;

        next();

    } catch (error) {
        console.error(
            "Auth middleware error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = authMiddleware;