---
title: Attention
summary: Lets every token weigh every other token when it builds its representation.
level: foundational
tags: [mechanism]
requires: [embeddings, softmax]
related: [flash-attention]
---

Attention scores how relevant each token is to the current one, normalises the scores with softmax and takes a weighted average. It is the core operation of the transformer.
