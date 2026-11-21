---
title: Multi-head attention
summary: Runs several attention operations in parallel so the model can track different kinds of relationship at once.
level: intermediate
tags: [mechanism, architecture]
extends: [self-attention]
related: [kv-cache]
---

One head might follow syntax while another follows coreference. Their outputs are concatenated and projected back to the model's width.
