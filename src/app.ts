import express, { type Application, type Request, type Response } from "express"
import cors from "cors";
import { userRoute } from "./modules/user/user.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.get("/", (req: Request, res: Response) => {
  
  res.status(200).json({
    message: "Devpulse",
    author: "Platform for developer",
  });
});


app.use("/api/users", userRoute);

export default app;
