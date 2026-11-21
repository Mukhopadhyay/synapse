---
title: Retrieval-augmented generation
summary: Ground a model's answer in documents fetched at query time.
level: intermediate
tags: [rag]
aliases: [RAG]
requires: [embeddings, vector-database, chunking, transformer]
related: [fine-tuning]
---

A retriever finds passages relevant to the question and the model writes its answer conditioned on them. Both halves lean on [[embeddings]]: questions and passages share one vector space.

The idea comes from Lewis et al. (2020), who paired a dense retriever with a sequence-to-sequence generator:

https://arxiv.org/abs/2005.11401

## The pipeline

Documents are split by [[chunking]], embedded once and stored in a [[vector-database]]. At query time:

```python
query_vector = embed(question)
passages = index.search(query_vector, k=5)
prompt = f"Answer using these passages:\n{passages}\n\nQuestion: {question}"
answer = llm.generate(prompt)
```

Anthropic's write-up shows how giving each chunk its context before embedding cuts failed retrievals:

!https://www.anthropic.com/news/contextual-retrieval

## When to reach for it

Use RAG when answers depend on facts the model wasn't trained on, facts that change often, or facts you need to cite. If you need a new style or skill rather than new facts, [[fine-tuning]] fits better.

https://huggingface.co/docs/transformers/model_doc/rag
