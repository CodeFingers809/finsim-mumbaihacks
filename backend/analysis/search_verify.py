import os
import sys
import torch
import polars as pl
import numpy as np
import time
from openai import OpenAI

# ================= CONFIGURATION =================
DATA_DIR = "./data_lake/text"  # Where the pipeline saved the files
VLLM_API_URL = "http://localhost:8000/v1" # Using Node 0 for query embedding
TOP_K = 20

# Visuals
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

class FastSearchEngine:
    def __init__(self):
        print(f"{CYAN}🔌 Connecting to vLLM Cluster (Node 0)...{RESET}")
        self.client = OpenAI(base_url=VLLM_API_URL, api_key="EMPTY")
        
        print(f"{CYAN}📂 Loading Parquet Data Lake...{RESET}")
        self.df, self.index_tensor = self._load_index()
        
        print(f"{GREEN}🚀 Engine Ready. Indexed {len(self.df):,} documents on GPU.{RESET}")

    def _load_index(self):
        # 1. Load Data
        try:
            # Read all parquet files in the directory at once
            df = pl.read_parquet(f"{DATA_DIR}/*.parquet")
            
            if df.is_empty():
                raise ValueError("Parquet files are empty.")
                
        except Exception as e:
            print(f"{RED}❌ Failed to load data: {e}{RESET}")
            sys.exit(1)

        # 2. Extract Vectors (Int8) -> Numpy -> Tensor (Float16)
        print(f"{CYAN}📐 Building GPU Index...{RESET}")
        
        # Polars list to numpy stack is the fastest method
        vecs_np = np.stack(df["vector"].to_list())
        
        # Convert to Tensor, Move to GPU, De-quantize (Divide by 100), Cast to FP16
        tensor = torch.from_numpy(vecs_np).to("cuda")
        tensor = tensor.to(torch.float16) / 100.0
        
        # 3. Pre-Normalize Document Vectors (Optimization)
        # Doing this once here saves time during every query
        tensor = torch.nn.functional.normalize(tensor, p=2, dim=1)
        
        return df, tensor

    def get_embedding(self, text):
        # E5-Mistral Instruction Format
        formatted_query = f"Instruct: Retrieve financial insights.\nQuery: {text}"
        
        try:
            resp = self.client.embeddings.create(
                input=[formatted_query],
                model="intfloat/e5-mistral-7b-instruct"
            )
            return resp.data[0].embedding
        except Exception as e:
            print(f"{RED}API Error: {e}{RESET}")
            return None

    def search(self, query):
        t0 = time.time()
        
        # 1. Get Query Embedding (API Call)
        query_vec_list = self.get_embedding(query)
        if query_vec_list is None: return []
        
        # 2. Prepare Query Tensor
        query_tensor = torch.tensor(query_vec_list, device="cuda", dtype=torch.float16).unsqueeze(0)
        query_tensor = torch.nn.functional.normalize(query_tensor, p=2, dim=1)
        
        # 3. GPU Similarity Search (Matrix Multiplication)
        # [1, 4096] x [N, 4096]^T = [1, N]
        scores = torch.mm(query_tensor, self.index_tensor.transpose(0, 1)).squeeze()
        
        # 4. Top K
        top_scores, top_indices = torch.topk(scores, k=TOP_K)
        
        # 5. Retrieve Metadata
        results = []
        # Move indices back to CPU for dataframe lookup
        indices = top_indices.cpu().numpy()
        scores = top_scores.cpu().numpy()
        
        for score, idx in zip(scores, indices):
            row = self.df.row(idx, named=True)
            results.append({
                "score": score,
                "code": row['code'],
                "url": row['url'],
                "text": row['text']
            })
            
        t1 = time.time()
        print(f"⚡ Search time: {(t1-t0)*1000:.2f}ms")
        return results

if __name__ == "__main__":
    engine = FastSearchEngine()
    
    

    print("\n" + "="*50)
    print(f"{YELLOW}🔎 SUPER-FAST FINANCIAL SEARCH (Type 'exit' to quit){RESET}")
    print("="*50)
    
    while True:
        try:
            user_input = input(f"\n{YELLOW}Query: {RESET}")
            if user_input.lower() in ['exit', 'quit']: break
            if not user_input.strip(): continue
            
            results = engine.search(user_input)
            
            for i, r in enumerate(results):
                print(f"\n{GREEN}--- Result #{i+1} (Sim: {r['score']:.4f}) ---{RESET}")
                print(f"🏢 {r['code']}")
                print(f"🔗 {r['url']}")
                # Clean up newlines for display
                snippet = r['text'][:400].replace('\n', ' ')
                print(f"📄 \"{snippet}...\"")
                
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break