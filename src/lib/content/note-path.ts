/** Path is identity: content/<domain>/[<cluster>/]<slug>.md. Ghosts use their inferred domain and cluster. */
export function notePath(node: { id: string; domain: string; cluster?: string }) {
  return ["content", node.domain, node.cluster, `${node.id}.md`].filter(Boolean).join("/");
}
