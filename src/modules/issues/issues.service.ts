import { pool } from "../../db";
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
    [reporterIds]
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



export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB
};
