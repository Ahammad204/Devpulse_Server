
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
    

// src/app.ts
import express from "express";
import cors from "cors";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/Config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  refresh_token: process.env.JWT_REFRESH_SECRET
};
var Config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: Config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(30) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
            `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        reporter_id INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
);
            `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
     INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(jwtpayload, Config_default.jwtSecret, {
    expiresIn: "1d"
  });
  const refreshToken2 = jwt.sign(jwtpayload, Config_default.refresh_token, {
    expiresIn: "10d"
  });
  delete user.password;
  return {
    token: accessToken,
    refreshToken: refreshToken2,
    user
  };
};
var generateFreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decoded = jwt.verify(
    token,
    Config_default.refresh_token
  );
  const userData = await pool.query(
    `
     SELECT * FROM users WHERE email=$1   
        `,
    [decoded.email]
  );
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(jwtpayload, Config_default.jwtSecret, {
    expiresIn: "1d"
  });
  return { accessToken };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB,
  generateFreshToken
};

// src/utility/sendresponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendresponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendresponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var userLogin = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { refreshToken: refreshToken2, token, user } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: true,
      httpOnly: true,
      sameSite: "lax"
    });
    sendresponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: { token, user }
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generateFreshToken(
      req.cookies.refreshToken
    );
    res.status(200).json({
      success: true,
      message: "Access token generated!",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  createUser,
  userLogin,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.createUser);
router.post("/login", authController.userLogin);
router.post("/refresh-token", authController.refreshToken);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendresponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access!!"
        });
      }
      const decoded = jwt2.verify(
        token,
        Config_default.jwtSecret
      );
      const userData = await pool.query(
        `
     SELECT * FROM users WHERE email=$1   
        `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return sendresponse_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return sendresponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden!!,This role have no access!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, userId) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, userId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (queryParams) => {
  let query = `SELECT * FROM issues`;
  const conditions = [];
  const values = [];
  const { sort = "newest", type, status } = queryParams;
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += sort === "oldest" ? " ORDER BY created_at ASC" : " ORDER BY created_at DESC";
  const issueResult = await pool.query(query, values);
  const issues = issueResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const userMap = /* @__PURE__ */ new Map();
  userResult.rows.forEach((user) => {
    userMap.set(user.id, user);
  });
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (issueResult.rows.length === 0) {
    return null;
  }
  const issue = issueResult.rows[0];
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = userResult.rows[0] || null;
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (issueId, user, payload) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId
  ]);
  if (issueResult.rows.length === 0) {
    return null;
  }
  const issue = issueResult.rows[0];
  const isMaintainer = user.role === "maintainer";
  const isOwner = issue.reporter_id === user.id;
  const isOpen = issue.status === "open";
  if (!isMaintainer) {
    if (!isOwner || !isOpen) {
      return null;
    }
  }
  const fields = [];
  const values = [];
  if (payload.title) {
    values.push(payload.title);
    fields.push(`title = $${values.length}`);
  }
  if (payload.description) {
    values.push(payload.description);
    fields.push(`description = $${values.length}`);
  }
  if (payload.type) {
    values.push(payload.type);
    fields.push(`type = $${values.length}`);
  }
  if (fields.length === 0) {
    return issue;
  }
  values.push(issueId);
  const idIndex = values.length;
  const query = `
    UPDATE issues
    SET ${fields.join(", ")}, updated_at = NOW()
    WHERE id = $${idIndex}
    RETURNING *
  `;
  const updatedResult = await pool.query(query, values);
  return updatedResult.rows[0];
};
var deleteIssueFromDB = async (issueId, user) => {
  if (user.role !== "maintainer") {
    return null;
  }
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  await pool.query(
    `DELETE FROM issues WHERE id = $1`,
    [issueId]
  );
  return true;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const user = req.user;
    const result = await issueService.createIssueIntoDB(req.body, user?.id);
    sendresponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendresponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      return sendresponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: null
      });
    }
    sendresponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const issueId = parseInt(String(req.params.id), 10);
    const user = req.user;
    if (isNaN(issueId)) {
      return sendresponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
        data: null
      });
    }
    const result = await issueService.updateIssueIntoDB(
      issueId,
      user,
      req.body
    );
    if (!result) {
      return sendresponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Not allowed to update this issue",
        data: null
      });
    }
    sendresponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const issueId = parseInt(String(req.params.id), 10);
    if (isNaN(issueId)) {
      return sendresponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
        data: null
      });
    }
    const user = req.user;
    if (!user) {
      return sendresponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized",
        data: null
      });
    }
    const result = await issueService.deleteIssueFromDB(issueId, user);
    if (!result) {
      return sendresponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Only maintainer can delete issues",
        data: null
      });
    }
    sendresponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: null
    });
  } catch (error) {
    sendresponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(), issueController.updateIssue);
router2.delete("/:id", auth_default(), issueController.deleteIssue);
var issueRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Devpulse",
    author: "Platform for developer"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(Config_default.port, () => {
    console.log(`Example app listening on port ${Config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map