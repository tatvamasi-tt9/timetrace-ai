import json
import bz2
import urllib.parse
import xml.etree.ElementTree as ET
from collections import defaultdict
import os
import mwparserfromhell

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TITLES_FILE = r'C:\Users\Tushar\Desktop\Search_engine\titles.json'
INDEX_FILE = r'C:\Users\Tushar\Desktop\Search_engine\server\Data\wikipedia\enwiki-20260601-pages-articles-multistream-index.txt.bz2'
XML_FILE = r'C:\Users\Tushar\Desktop\Search_engine\server\Data\wikipedia\enwiki-20260601-pages-articles-multistream.xml.bz2'
OUTPUT_FILE = 'extracted_articles.jsonl'

def main():
    print("1. Loading target titles...")
    with open(TITLES_FILE, 'r', encoding='utf-8') as f:
        target_titles = set(json.load(f))
    print(f"Loaded {len(target_titles)} target titles.")

    print("\n2. Scanning index file for byte offsets (this takes ~2 minutes)...")
    offset_to_titles = defaultdict(list)
    
    with bz2.open(INDEX_FILE, 'rt', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split(':', 2)
            if len(parts) == 3:
                offset_str, page_id, title = parts
                if title in target_titles:
                    offset_to_titles[int(offset_str)].append(title)

    print(f"Found targets in {len(offset_to_titles)} unique compressed blocks.")

    print("\n3. Extracting articles from XML dump...")
    
    articles_saved = 0
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f, open(XML_FILE, 'rb') as xml_f:
        
        for offset in sorted(offset_to_titles.keys()):
            titles_in_block = set(offset_to_titles[offset])
            
            try:
                xml_f.seek(offset)
                decompressor = bz2.BZ2Decompressor()
                block_data = b""
                
                while not decompressor.eof:
                    chunk = xml_f.read(65536)
                    if not chunk: break
                    block_data += decompressor.decompress(chunk)
                
                xml_str = b"<root>" + block_data + b"</root>"
                root = ET.fromstring(xml_str)
                
                for page in root.findall('.//{*}page'):
                    title_elem = page.find('{*}title')
                    
                    if title_elem is not None and title_elem.text in titles_in_block:
                        title = title_elem.text
                        
                        rev = page.find('{*}revision')
                        text_elem = rev.find('{*}text') if rev is not None else None
                        raw_wikitext = text_elem.text if text_elem is not None else ""
                        
                        # --- THE SAFETY ZONE ---
                        # We print this so if the script crashes, you know EXACTLY which article did it
                        print(f"Processing: {title}...", end=" ", flush=True)
                        
                        try:
                            parsed_wikitext = mwparserfromhell.parse(raw_wikitext)
                            clean_text = parsed_wikitext.strip_code()
                        except Exception as e:
                            print(f"[WARNING: Clean failed, saving raw text] - {e}")
                            clean_text = raw_wikitext
                            
                        url_title = urllib.parse.quote(title.replace(' ', '_'))
                        url = f"https://en.wikipedia.org/wiki/{url_title}"
                        
                        result = {
                            "title": title,
                            "url": url,
                            "text": clean_text
                        }
                        
                        out_f.write(json.dumps(result) + '\n')
                        out_f.flush() # Forces save to hard drive immediately!
                        
                        articles_saved += 1
                        print("Done.") # Prints on the same line if successful
                        
            except Exception as block_err:
                print(f"\n❌ Skipping block at offset {offset} due to error: {block_err}")

    print(f"\n🎉 Success! Total articles saved: {articles_saved}")

if __name__ == "__main__":
    main()