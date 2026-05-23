import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  connection_string: process.env.CONNECTION_STRING as string,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  refresh_token: process.env.JWT_REFRESH_SECRET,
};

export default config;
