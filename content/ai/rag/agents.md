---
title: Agents
summary: A language model run in a loop that plans a step, calls a tool, reads the result and goes again until the task is done.
level: advanced
tags: [applications, tools]
requires: [rag]
related: [fine-tuning]
---

An agent decides each next step from what it has seen so far: search, call a tool, or answer. Retrieval is usually its first tool, the same lookup [[rag]] makes once, made as many times as the task needs.
