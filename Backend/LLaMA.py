from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import sys
import json

def load_model(model_path):
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(model_path, torch_dtype=torch.float16, device_map="auto")
    return model, tokenizer

model_path = "./LlaMA3"
model, tokenizer = load_model(model_path)

def summarize(abstract):
    input_ids = tokenizer(abstract, return_tensors="pt").input_ids.to(model.device)
    summary_ids = model.generate(input_ids, max_length=150, num_beams=5, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

if __name__ == "__main__":
    # Read abstract from stdin
    input_data = json.loads(sys.stdin.read())
    abstract = input_data.get("abstract", "")
    
    summary = summarize(abstract)
    print(json.dumps({"summary": summary}))
