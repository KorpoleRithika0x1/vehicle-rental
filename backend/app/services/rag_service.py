from __future__ import annotations

import hashlib
import re
from pathlib import Path

import httpx
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from loguru import logger

from app.config import get_settings
from app.services.openrouter_client import openrouter_base_url, openrouter_headers


BASE_DIR = Path(__file__).resolve().parents[2]
RAG_DOCS_DIR = BASE_DIR / "rag_docs"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 80
COLLECTION_NAME = "vehicle_rental_docs_openrouter_v3"

_collection = None
_init_attempted = False


class OpenRouterEmbeddingFunction(EmbeddingFunction):
    def __init__(self, model: str) -> None:
        self.model = model

    def __call__(self, input: Documents) -> Embeddings:
        headers = openrouter_headers()
        if not headers:
            raise RuntimeError("OPENROUTER_API_KEY is not configured.")

        embeddings: Embeddings = []
        with httpx.Client(timeout=60.0) as client:
            for text in input:
                response = client.post(
                    f"{openrouter_base_url()}/embeddings",
                    headers=headers,
                    json={"model": self.model, "input": text},
                )
                response.raise_for_status()
                payload = response.json()
                embeddings.append(payload["data"][0]["embedding"])
        return embeddings


def _chunk_text(text: str, source: str) -> list[tuple[str, str]]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks: list[tuple[str, str]] = []
    buffer = ""

    for paragraph in paragraphs:
        if len(buffer) + len(paragraph) + 2 <= CHUNK_SIZE:
            buffer = f"{buffer}\n\n{paragraph}".strip()
            continue
        if buffer:
            chunks.append((buffer, source))
        if len(paragraph) <= CHUNK_SIZE:
            buffer = paragraph
            continue
        start = 0
        while start < len(paragraph):
            end = min(start + CHUNK_SIZE, len(paragraph))
            chunks.append((paragraph[start:end], source))
            start = max(end - CHUNK_OVERLAP, start + 1)
        buffer = ""

    if buffer:
        chunks.append((buffer, source))
    return chunks


def _scope_for_source(source: str) -> str:
    if source.startswith("admin_"):
        return "admin"
    if source.startswith("manager_"):
        return "vehicle_manager"
    if source.startswith("customer_"):
        return "customer"
    if source.startswith("shared_"):
        return "shared"
    return "public"


def _load_document_chunks() -> list[tuple[str, str, str, str]]:
    chunks: list[tuple[str, str, str, str]] = []
    if not RAG_DOCS_DIR.exists():
        return chunks

    for path in sorted(RAG_DOCS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for index, (chunk, source) in enumerate(_chunk_text(text, path.name)):
            chunk_id = hashlib.sha256(f"{source}:{index}:{chunk}".encode()).hexdigest()[:24]
            chunks.append((chunk_id, chunk, source, _scope_for_source(path.name)))
    return chunks


def _get_collection():
    global _collection, _init_attempted
    if _collection is not None:
        return _collection
    if _init_attempted:
        return None

    _init_attempted = True
    settings = get_settings()
    if not settings.openrouter_api_key:
        logger.warning("rag_init_skipped missing OPENROUTER_API_KEY")
        return None

    try:
        import chromadb

        persist_dir = settings.chroma_persist_dir
        persist_dir.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(persist_dir))
        embed_fn = OpenRouterEmbeddingFunction(settings.openrouter_embedding_model)
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
            metadata={"hnsw:space": "cosine"},
        )

        doc_chunks = _load_document_chunks()
        if doc_chunks:
            existing_ids = set(collection.get(include=[]).get("ids", []))
            new_ids: list[str] = []
            new_docs: list[str] = []
            new_meta: list[dict] = []
            for chunk_id, chunk, source, scope in doc_chunks:
                if chunk_id in existing_ids:
                    continue
                new_ids.append(chunk_id)
                new_docs.append(chunk)
                new_meta.append({"source": source, "scope": scope})

            if new_ids:
                collection.add(ids=new_ids, documents=new_docs, metadatas=new_meta)
                logger.info(f"rag_indexed chunks={len(new_ids)}")

        _collection = collection
        return _collection
    except Exception as exc:
        logger.warning(f"rag_init_failed error={exc}")
        return None


def retrieve_context(query: str, top_k: int = 6, role: str | None = None) -> str:
    collection = _get_collection()
    if collection is None:
        return ""

    try:
        allowed_scopes = ["public"]
        if role:
            allowed_scopes.append(role)
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"scope": {"$in": allowed_scopes}},
        )
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        if not documents:
            return ""

        lines = ["Relevant knowledge base excerpts:"]
        for doc, meta in zip(documents, metadatas, strict=False):
            source = (meta or {}).get("source", "unknown")
            lines.append(f"- [{source}] {doc}")
        return "\n".join(lines)
    except Exception as exc:
        logger.warning(f"rag_query_failed error={exc}")
        return ""
