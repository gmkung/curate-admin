"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const document_1 = require("next/document");
function Document() {
    return (<document_1.Html lang="en">
      <document_1.Head> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"/>
      </document_1.Head>
      <body>
        <document_1.Main />
        <document_1.NextScript />
      </body>
    </document_1.Html>);
}
exports.default = Document;
