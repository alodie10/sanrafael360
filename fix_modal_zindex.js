const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', 'utf-8');
code = code.replace('className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"', 'className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"');
fs.writeFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', code);
console.log("Modal z-index updated to z-[999]");
