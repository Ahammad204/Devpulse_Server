import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { IUser } from "../auth/auth.interface";
import type { IIssue, IIssueQuery } from "./issues.interface";

const createIssueIntoDB = async (payload: IIssue, userId: number) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, userId],
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (queryParams: IIssueQuery) => {
  let query = `SELECT * FROM issues`;
  const conditions: string[] = [];
  const values: (string | number)[] = [];

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

  query +=
    sort === "oldest"
      ? " ORDER BY created_at ASC"
      : " ORDER BY created_at DESC";

  const issueResult = await pool.query(query, values);
  const issues = issueResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  const userMap = new Map();
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
    updated_at: issue.updated_at,
  }));
};

const getSingleIssueFromDB = async (id: number) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0];

  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
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
    updated_at: issue.updated_at,
  };
};

const updateIssueIntoDB = async (
  issueId: number,
  user: IUser & { id: number },
  payload: {
    title?: string;
    description?: string;
    type?: "bug" | "feature";
  },
) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId,
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


  const fields: string[] = [];
  const values: (string | number)[] = [];

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


const deleteIssueFromDB = async (
  issueId: number,
  user: JwtPayload
) => {
  
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



export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};
