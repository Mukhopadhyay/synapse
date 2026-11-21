/** The GitHub repo every "Edit" and "Write this note" link points at. */
export const REPO = { owner: "Mukhopadhyay", name: "synapse", branch: "master" } as const;

export const repoUrl = `https://github.com/${REPO.owner}/${REPO.name}`;

/** GitHub's editor for an existing file. */
export function editUrl(path: string) {
  return `${repoUrl}/edit/${REPO.branch}/${path}`;
}

/** GitHub's new-file page with the path and contents prefilled. */
export function newFileUrl(path: string, contents: string) {
  const query = new URLSearchParams({ filename: path, value: contents });
  return `${repoUrl}/new/${REPO.branch}?${query}`;
}
