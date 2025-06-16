import sys
import json
import torch
from transformers import PegasusTokenizer, PegasusForConditionalGeneration

# Load Pegasus model
model_name = "google/pegasus-xsum"
cache_path = "D:/MERN/PaperSummarizer2/backend/HugginFace"
tokenizer = PegasusTokenizer.from_pretrained(model_name, cache_dir=cache_path)
model = PegasusForConditionalGeneration.from_pretrained(model_name, cache_dir=cache_path)

def generate_summary(text):
    tokens = tokenizer.tokenize(text)
    min_length = max(30, len(tokens) // 2)
    max_length = min(512, int(len(tokens) * 0.6))

    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    
    with torch.no_grad():
        summary_ids = model.generate(
            inputs["input_ids"], 
            max_length=max_length, 
            min_length=min_length, 
            num_beams=5, 
            length_penalty=1.0,  
            early_stopping=True
        )
    
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

if __name__ == "__main__":
    input_texts = json.loads(sys.argv[1])
    summaries = [generate_summary(text) for text in input_texts]
    print(json.dumps(summaries))
