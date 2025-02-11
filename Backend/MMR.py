import sys
import json
import torch
from transformers import AutoModel, AutoTokenizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load pre-trained BERT model and tokenizer
MODEL_NAME = "allenai/scibert_scivocab_uncased"  # You can replace this with any BERT variant
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

# Function to get BERT embeddings
def get_bert_embeddings(texts):
    """
    Generate BERT embeddings for a list of texts.
    Args:
        texts (list): List of text strings.
    Returns:
        numpy.ndarray: Array of text embeddings.
    """
    with torch.no_grad():
        inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt", max_length=512)
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1)  # Average over the sequence
        return embeddings.cpu().numpy()

# MMR function
def mmr(query_embedding, doc_embeddings, lambda_param=0.5, top_k=5):
    """
    Perform Maximal Marginal Relevance (MMR) to rank documents.
    Args:
        query_embedding (numpy.ndarray): Query embedding.
        doc_embeddings (numpy.ndarray): Candidate document embeddings.
        lambda_param (float): Trade-off parameter (0: only diversity, 1: only relevance).
        top_k (int): Number of documents to return.
    Returns:
        list: Indices of ranked documents.
    """
    query_embedding = query_embedding.reshape(1, -1)
    relevance_scores = cosine_similarity(query_embedding, doc_embeddings)[0]
    selected_indices = []
    unselected_indices = list(range(len(doc_embeddings)))

    for _ in range(top_k):
        if not unselected_indices:
            break

        # Calculate MMR score for each unselected document
        mmr_scores = []
        for i in unselected_indices:
            diversity_score = max(
                [cosine_similarity(doc_embeddings[i].reshape(1, -1), doc_embeddings[j].reshape(1, -1))[0][0]
                 for j in selected_indices] if selected_indices else [0]
            )
            mmr_score = lambda_param * relevance_scores[i] - (1 - lambda_param) * diversity_score
            mmr_scores.append((i, mmr_score))

        # Select the document with the highest MMR score
        best_doc = max(mmr_scores, key=lambda x: x[1])[0]
        selected_indices.append(best_doc)
        unselected_indices.remove(best_doc)

    return selected_indices

# Main Execution Block
if __name__ == "__main__":
    query = sys.argv[1]
    summaries_json = sys.argv[2]

    # Parse the summaries JSON string into a Python list
    summaries = json.loads(summaries_json)

    # Get embeddings for the query and document summaries
    query_embedding = get_bert_embeddings([query])[0]
    doc_embeddings = get_bert_embeddings(summaries)

    # Perform MMR
    ranked_indices = mmr(query_embedding, doc_embeddings, lambda_param=0.7, top_k=5)

    # Output the result as JSON
    print(json.dumps(ranked_indices))
