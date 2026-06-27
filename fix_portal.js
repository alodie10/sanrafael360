const fs = require('fs');
const file = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { createPortal } from 'react-dom';")) {
  code = code.replace("import React, { useState, useEffect, useMemo } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport { createPortal } from 'react-dom';");
}

const modalStart = `{selectedBusiness && (
        <div className="fixed inset-0 z-[999]`;

const newModalStart = `{selectedBusiness && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999]`;

code = code.replace(modalStart, newModalStart);

const modalEnd = `</div>
      )}
    </div>`;

const newModalEnd = `</div>
      ), document.body)}
    </div>`;

code = code.replace(modalEnd, newModalEnd);

fs.writeFileSync(file, code);
console.log("Patched AdminPaymentsView for createPortal.");
