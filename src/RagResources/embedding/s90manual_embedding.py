from pinecone import Pinecone, ServerlessSpec
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os

# Set your API key
os.environ["PINECONE_API_KEY"] = "9786676c-f535-4428-a97b-6164addccfe9"

def main():
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))

    file_path = 'src/RagResources/data/OwnerManual.md'
    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()

    headers_to_split_on = [
        ("##", "Header 2")
    ]

    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on, strip_headers=False
    )
    md_header_splits = markdown_splitter.split_text(markdown_content)

    # Create or connect to the index
    index_name = "s90-ai-support"
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=1024,
            metric="cosine",
            spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )

    index = pc.Index(index_name)

    # Create a text splitter for smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )

    # Generate embeddings and upsert to Pinecone
    for i, doc in enumerate(md_header_splits):
        # Split the document into smaller chunks
        chunks = text_splitter.split_text(doc.page_content)
        
        for j, chunk in enumerate(chunks):
            embeddings = pc.inference.embed(
                "multilingual-e5-large",
                inputs=[chunk],
                parameters={
                    "input_type": "passage"
                }
            )
            
            # Truncate the metadata to fit within Pinecone's limits
            truncated_text = chunk[:500]  # Adjust this value as needed
            
            index.upsert(
                vectors=[{
                    "id": f"doc_{i}_chunk_{j}",
                    "values": embeddings[0].values,
                    "metadata": {
                        "text": truncated_text,
                        "source": f"Document {i}, Chunk {j}"
                    }
                }],
                namespace="S90Manual"
            )

    print("Documents embedded and upserted to Pinecone index.")

if __name__ == "__main__":
    main()
