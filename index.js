"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
const app = (0, express_1.default)();
const keyFilePath = path_1.default.join(
  __dirname,
  "assets/google/mylove-433207-94588a3b4b4a.json"
);
const auth = new googleapis_1.google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
app.use((error, req, res, next) => {
  var _a;
  // Default error status code
  const statusCode =
    ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) ||
    500;
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
app.use(body_parser_1.default.json());
const spreadsheetId = "19tweSf6WtZXeZh1B5kaBg3Xwiy52VvTiBOBRSSmbZOs";
const willGoSheet = "Sẽ Tham Dự";
const wishSheet = "Lời Chúc";
const getSheetValue = (_a) =>
  __awaiter(void 0, [_a], void 0, function* ({ sheetName }) {
    const client = yield auth.getClient();
    const sheets = googleapis_1.google.sheets({
      version: "v4",
      auth: client,
    });
    const response = yield sheets.spreadsheets.values.get({
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
      let rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || null; // Handle missing data
      });
      return rowData;
    });
    return data;
  });
const appendSheetValue = (_a) =>
  __awaiter(void 0, [_a], void 0, function* ({ insertData, sheetName }) {
    const client = yield auth.getClient();
    const sheets = googleapis_1.google.sheets({
      version: "v4",
      auth: client,
    });
    const response = yield sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: [[...Object.values(insertData), formatDate(new Date())]],
      },
    });
    return response.data;
  });
app.get("/", (req, res) => res.send("1.0.0"));
// get will go
app.get("/will_go", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const data = yield getSheetValue({ sheetName: willGoSheet });
      res.json(data);
    } catch (error) {
      next(error);
    }
  })
);
// post will go
app.post("/will_go", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const data = yield appendSheetValue({
        insertData: req.body,
        sheetName: willGoSheet,
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  })
);
app.get("/wish", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const data = yield getSheetValue({ sheetName: wishSheet });
      res.json(data);
    } catch (error) {
      next(error);
    }
  })
);
// post will go
app.post("/wish", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const data = yield appendSheetValue({
        insertData: req.body,
        sheetName: wishSheet,
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  })
);
app.listen(3000, () => console.log("Server ready http://127.0.0.1:3000."));
module.exports = app;
