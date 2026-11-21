---
title: Self-attention
summary: Attention where a sequence attends to itself, so each token is rebuilt from the tokens around it.
level: intermediate
tags: [mechanism]
extends: [attention]
requires: [dot-product, softmax]
---

Each token produces a query, a key and a value. Query–key dot products, passed through softmax, decide how much of each value flows into the new representation.
