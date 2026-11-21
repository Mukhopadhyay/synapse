---
title: Softmax
summary: Turns a list of raw scores into probabilities that are all positive and add up to one.
level: foundational
tags: [math, probability]
related: [tokenization, dot-product]
---

Softmax exponentiates each score and divides by the total, so larger scores take a larger share. It picks the next token from the vocabulary and turns attention scores into weights.

For scores $z_1, \dots, z_n$:

$$
\operatorname{softmax}(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{n} e^{z_j}}
$$
