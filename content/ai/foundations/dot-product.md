---
title: Dot product
summary: Multiplies two vectors element by element and sums the result, giving one number that grows as they point the same way.
level: foundational
tags: [math, similarity]
---

The dot product is the basic similarity score in deep learning. Compare two [[embeddings]] with it and you get a measure of how aligned they are.

$$
a \cdot b = \sum_{i=1}^{n} a_i b_i
$$

| $a$ | $b$ | $a \cdot b$ |
| --- | --- | --- |
| $[1, 0]$ | $[1, 0]$ | 1 |
| $[1, 0]$ | $[0, 1]$ | 0 |
| $[1, 0]$ | $[-1, 0]$ | −1 |
