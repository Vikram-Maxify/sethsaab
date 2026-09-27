const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.usertoken ||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiN2UyYjRjODEtYTRjZC00ODdkLWE4NWQtYjQwYTI3Y2JjZmVmIiwiaWQiOiI2YWFiZGMwZGE4NmNlMzBiZDlmNTNlZGMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTA1MDYyNDIsImV4cCI6MTc5MTExMTA0Mn0.hPbY9y3OD2bNurqJoEMZ4pCp8fdQ0UX13uwovbxPQxo";



    console.log(token)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;


    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;