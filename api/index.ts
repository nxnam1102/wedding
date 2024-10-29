import express from "express";
import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import path from "path";
import bodyParser from "body-parser";

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
const app = express();
const keyFilePath = path.join(
  __dirname,
  "../assets/google/mylove-433207-94588a3b4b4a.json"
);

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

app.use((error: any, req: any, res: any, next: any) => {
  // Default error status code
  const statusCode = error.response?.status || 500;

  // Customize error messages based on Google API responses
  let errorMessage = "An unexpected error occurred.";
  if (statusCode === 404) {
    errorMessage =
      "Resource not found. Please check the spreadsheet ID or URL.";
  } else if (statusCode === 403) {
    errorMessage =
      "Access denied. Ensure the sheet is shared with the service account.";
  } else if (statusCode === 400) {
    errorMessage = "Bad request. Please check your input parameters.";
  } else if (error.response) {
    errorMessage = `Google API error: ${error.response.statusText}`;
  }

  // Log the error details (for debugging)
  console.error("Error details:", error);

  // Send JSON response to client
  res.status(statusCode).json({
    error: errorMessage,
    details: error.message,
  });
});

app.use(bodyParser.json());

const spreadsheetId = "19tweSf6WtZXeZh1B5kaBg3Xwiy52VvTiBOBRSSmbZOs";
const willGoSheet = "Sẽ Tham Dự";
const wishSheet = "Lời Chúc";

const getSheetValue = async ({ sheetName }: { sheetName: string }) => {
  const client: any = await auth.getClient();
  const sheets: sheets_v4.Sheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return;
  }

  // Use the first row as keys
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    let rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || null; // Handle missing data
    });
    return rowData;
  });
  return data;
};

const appendSheetValue = async ({
  insertData,
  sheetName,
}: {
  insertData: any;
  sheetName: string;
}) => {
  const client: any = await auth.getClient();
  const sheets: sheets_v4.Sheets = google.sheets({
    version: "v4",
    auth: client,
  });
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: {
      values: [[...Object.values(insertData), formatDate(new Date())]],
    },
  });
  return response.data;
};

app.get("/", (req: any, res: any) => res.send("1.0.0"));
// get will go
app.get("/will_go", async (req: any, res: any, next: any) => {
  try {
    const data = await getSheetValue({ sheetName: willGoSheet });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// post will go
app.post("/will_go", async (req: any, res: any, next: any) => {
  try {
    const data = await appendSheetValue({
      insertData: req.body,
      sheetName: willGoSheet,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/wish", async (req: any, res: any, next: any) => {
  try {
    const data = await getSheetValue({ sheetName: wishSheet });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// post will go
app.post("/wish", async (req: any, res: any, next: any) => {
  try {
    const data = await appendSheetValue({
      insertData: req.body,
      sheetName: wishSheet,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.listen(3000, () => console.log("Server ready http://127.0.0.1:3000."));

module.exports = app;
