const fs = require('fs');
const path = require('path');

// ── 1. Update src/index.css ──
const cssPath = path.join('d:\\live p\\medpro\\src\\index.css');
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    // Remove absolute overrides for Grid cols
    const gridOverrideRegex = /\/\* ── KPI grid collapses to 2 columns ── \*\/[\s\S]*?grid-template-columns: 1fr !important;\s*\}/g;
    css = css.replace(gridOverrideRegex, '/* Grid layouts managed by Tailwind classes */');
    fs.writeFileSync(cssPath, css);
    console.log("Updated index.css");
}

// ── 2. Update MobileBottomNav ──
const navPath = path.join('d:\\live p\\medpro\\src\\components\\MobileBottomNav.tsx');
if (fs.existsSync(navPath)) {
    let nav = fs.readFileSync(navPath, 'utf8');
    // Fix New Patient text sizing & tracking cut-offs
    nav = nav.replace(/text-\[8px\] font-bold text-slate-400 uppercase tracking-tighter/g, 'text-[9px] font-bold text-slate-400 tracking-normal mt-0.5');
    fs.writeFileSync(navPath, nav);
    console.log("Updated MobileBottomNav.tsx");
}

// ── 3. Update Dashboard ──
const dashPath = path.join('d:\\live p\\medpro\\src\\components\\views\\Dashboard.tsx');
if (fs.existsSync(dashPath)) {
    let dash = fs.readFileSync(dashPath, 'utf8');
    // Replace layout grid-cols-2 inside cards
    dash = dash.replace(/grid grid-cols-2 gap-3 mt-4/g, 'grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4');
    dash = dash.replace(/grid grid-cols-2 gap-3 mb-3/g, 'grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3');
    fs.writeFileSync(dashPath, dash);
    console.log("Updated Dashboard.tsx");
}

console.log("Success");
