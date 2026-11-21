---
title: Positional encoding
summary: Adds information about each token's position, because attention on its own ignores word order.
level: foundational
tags: [representation, order]
requires: [embeddings]
---

Without positions, "dog bites man" and "man bites dog" look identical to [[self-attention]]. A positional signal is added to each token's embedding so order survives.
