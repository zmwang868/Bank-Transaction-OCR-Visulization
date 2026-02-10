import requests
import os
import sys

def verify_upload():
    url = "http://localhost:5000/api/ocr"
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "January 31.pdf")
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    print(f"Uploading {file_path} to {url}...")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files)
            
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Upload successful!")
            try:
                data = response.json()
                print("Response JSON:")
                print(data)
                
                results = data.get("results", [])
                if results:
                    print(f"\nProcessed {len(results)} pages.")
                    for page in results:
                        print(f"Page {page['page_number']}: {page['image_url']}")
                else:
                    print("\nNo results found in response.")
                    
            except ValueError:
                print("Error: Could not parse JSON response.")
        else:
            print("Upload failed.")
            print(response.text)
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    verify_upload()
