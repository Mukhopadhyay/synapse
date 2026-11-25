/** What a person is revising right now: a whole field, one cluster (`<domain>/<cluster>`), or a note plus what it needs. */
export type Focus = { kind: "field"; id: string } | { kind: "cluster"; id: string } | { kind: "note"; id: string };

export type Progress = {
  /** Slug → ISO date it was marked studied. */
  studied: Record<string, string>;
  focus: Focus | null;
};

export const EMPTY_PROGRESS: Progress = { studied: {}, focus: null };
