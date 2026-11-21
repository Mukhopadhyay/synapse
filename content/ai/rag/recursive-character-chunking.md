---
title: Recursive character chunking
summary: Splits text by trying separators in order (paragraph, line, word) until each chunk fits the size limit.
level: foundational
tags: [rag, preprocessing]
aliases: [RCTS]
extends: [chunking]
contrasts: [semantic-chunking]
---

Unlike fixed-size [[chunking]], this keeps paragraphs intact where it can and only cuts mid-sentence as a last resort.

```python
def split(text, size, separators=("\n\n", "\n", " ", "")):
    if len(text) <= size:
        return [text]
    sep, *rest = separators
    parts = text.split(sep) if sep else list(text)
    chunks, current = [], ""
    for part in parts:
        candidate = current + sep + part if current else part
        if len(candidate) <= size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            current = part
    if current:
        chunks.append(current)
    return [c for chunk in chunks for c in (split(chunk, size, rest) if len(chunk) > size else [chunk])]
```
