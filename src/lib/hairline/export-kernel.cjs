/**
 * Turbopack loader for kernel.js. The kernel is a plain script that defines `HL` and must stay
 * byte for byte as Hairline ships it, so the export is added here, at build time, not in the file.
 */
module.exports = function exportKernel(source) {
  return `${source}\nexport { HL };\n`;
};
