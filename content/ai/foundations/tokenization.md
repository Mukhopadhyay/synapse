---
title: Tokenization
summary: Splits text into the units a model actually reads, usually subword pieces from a fixed vocabulary.
level: foundational
tags: [preprocessing, vocabulary]
related: [positional-encoding]
---

A tokenizer turns "unbelievable" into pieces like "un", "believ" and "able", then maps each piece to an id. Everything downstream, from [[embeddings]] to context limits, is counted in these tokens.
