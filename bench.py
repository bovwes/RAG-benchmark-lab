import argparse
import os

import chromadb
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer

import ragbench as rb

VECTOR_DB_DIR   = "chroma_db"
COLLECTION_NAME = "documents"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

load_dotenv()

# Helper functions

def _get_llm_client() -> tuple[OpenAI, str]:
    api_key  = os.getenv("LLM_API_KEY", "none")
    base_url = os.getenv("LLM_BASE_URL")
    model    = os.getenv("LLM_MODEL_NAME")

    if not base_url or not model:
        raise SystemExit(
            "LLM_BASE_URL and LLM_MODEL_NAME must be set in your .env file."
        )
    return OpenAI(base_url=base_url, api_key=api_key), model


# Main
def main():
    parser = argparse.ArgumentParser(description="Benchmark RAG pipeline configurations")
    parser.add_argument("--eval-dataset",   required=True,              help="Path to evaluation dataset (.json or .csv)")
    parser.add_argument("--collection",     default=COLLECTION_NAME,    help=f"ChromaDB collection name (default: {COLLECTION_NAME})")
    parser.add_argument("--export",         default="results.json",     help="Export results to this file (.json)")
    parser.add_argument("--judge",          action="store_true",        help="Enable LLM-as-judge scoring")
    parser.add_argument("--top-k",          type=int, default=10,       help="Chunks to retrieve before reranking (default 10)")
    parser.add_argument("--rerank-k",       type=int, default=5,        help="Chunks to pass to the generator (default 5)")
    args = parser.parse_args()


    # Load Dataset
    print("Loading dataset...")

    if args.eval_dataset.endswith(".csv"):
        dataset = rb.EvalDataset.from_csv(args.eval_dataset)
    else:
        dataset = rb.EvalDataset.from_json(args.eval_dataset)
    print(f"  Dataset: {dataset.name}  ({len(dataset)} questions)")

    
    # Load Resources
    print("Loading resources...")

    if not os.path.exists(VECTOR_DB_DIR):
        raise SystemExit(f"Vector store \"{VECTOR_DB_DIR}\" not found")
    
    embed_model = SentenceTransformer(EMBEDDING_MODEL)
    collection  = chromadb.PersistentClient(path=VECTOR_DB_DIR).get_collection(args.collection)
    client, model = _get_llm_client()
    print(f"  {collection.count()} chunks indexed")
    print(f"  Using model: {model}")


    ##############################################################################
    # COMPONENTS
    ##############################################################################

    chroma_ret  = rb.ChromaRetriever(collection, embed_model)
    bm25_ret    = rb.BM25Retriever(collection)
    hybrid_ret  = rb.HybridRetriever(dense=chroma_ret, sparse=bm25_ret)

    reranker    = rb.CrossEncoderReranker()
    generator   = rb.OpenAIGenerator(client, model)
    judge       = rb.LLMJudge(client, model) if args.judge else None


    ##############################################################################
    # CONFIGURATIONS TO BENCHMARK
    ##############################################################################

    configs = [
        rb.PipelineConfig(
            name="BM25, No Reranker",
            retriever=bm25_ret,
            generator=generator,
            top_k_retrieve=args.top_k,
            top_k_rerank=args.rerank_k,
        ),
        rb.PipelineConfig(
           name="Chroma + Cross Encoder",
            retriever=chroma_ret,
            reranker=reranker,
            generator=generator,
            top_k_retrieve=args.top_k,
            top_k_rerank=args.rerank_k,
        ),
        rb.PipelineConfig(
            name="Hybrid + Cross Encoder",
            retriever=hybrid_ret,
            reranker=reranker,
            generator=generator,
            top_k_retrieve=args.top_k,
            top_k_rerank=args.rerank_k,
        ),
    ]

    # Run
    runner  = rb.BenchmarkRunner(dataset, judge=judge)
    results = runner.run(configs)

    # Report
    rb.print_table(results)

    if args.export:
        rb.to_json(results, args.export)
        print(f"View the dashboard by running: streamlit run dashboard.py {args.export}")

if __name__ == "__main__":
    main()
