---
title: LoRA
summary: Fine-tunes a model by training small low-rank matrices beside the frozen original weights.
level: advanced
tags: [training, efficiency]
aliases: [Low-rank adaptation]
extends: [fine-tuning]
contrasts: [full-fine-tuning]
---

LoRA trains a tiny fraction of the parameters, so a single base model can carry many cheap, swappable adapters.
