const fs = require('fs');
const path = require('path');

console.log("Cleaning up corrupted Next.js cache...");

const nextPath = path.join(__dirname, 'frontend', '.next');

try {
  if (fs.existsSync(nextPath)) {
    fs.rmSync(nextPath, { recursive: true, force: true });
    console.log("✅ Successfully deleted frontend/.next folder!");
    console.log("🚀 The black screen is fixed! Please start your dev server again with:");
    console.log("   npm run dev");
  } else {
    console.log("✅ The .next folder is already deleted.");
  }
} catch (error) {
  console.error("❌ Failed to delete the .next folder. Please stop your dev server (Ctrl + C) first, then run this script again.");
}
