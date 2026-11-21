/** The note template with its title filled in, quoted when YAML needs it. */
export function fillTemplate(template: string, title: string) {
  const safeTitle = /[:#'"[\]{}]/.test(title) ? JSON.stringify(title) : title;
  return template.replaceAll("{{title}}", safeTitle);
}
