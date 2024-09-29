#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
#AIzaSyA4Ri3j0Ev0jmgiuT470pQoENxjusVBq6Q

import json
import base64
import os
import io
from PIL import Image
import google.generativeai as genai
import anthropic
import re
import sys
import io
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set your API keys
GEMINI_API_KEY = 'your-key'
CLAUDE_API_KEY = 'your-key'

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def extract_text_from_image_gemini(image_path):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    with open(image_path, 'rb') as img_file:
        image_data = img_file.read()

    response = model.generate_content([
        "Extract all the text from all rows from this bill image, including both printed and handwritten text and return data as a JSON object only (no other text) with appropriate keys and values in same language as in image. Give one standard JSON output always like this:",
        '''"परिवार_रजिस्टर": {
    "ग्राम_सभा_का_नाम": "",
    "ग्राम_वार्ड_पंचायत_का_नाम": "",
    "गांव_का_नाम": "",
    "तहसील": "",
    "विकास_खण्ड": "",
    "जिला": "",
    "परिवार_सदस्य": [
      {
        "क्रम_संख्या": "",
        "मकान_संख्या": "",
        "परिवार_के_प्रमुख_का_नाम": "",
        "परिवार_के_सदस्यों_के_नाम": "",
        "पिता_पति_का_नाम": "",
        "पुरुष_या_महिला": "",
        "धर्म":"",
        "जन्म_तिथि": "",
        "पता": "",
        "साक्षर_या_निरक्षर": "",
        "मृत्यु दिनांक":"",
        "अभ्युक्ति":""
      }
    ]
  }''',
        Image.open(io.BytesIO(image_data))
    ])
    return response.text

def extract_text_from_image_claude(image_path):
    client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
    
    with open(image_path, "rb") as image_file:
        image_data = base64.b64encode(image_file.read()).decode('utf-8')
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=4500,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": '''Extract all the text from all rows from this bill image, including both printed and handwritten text and return data as a JSON object only (no other text) with appropriate keys and values in same language as in image. Give one standard JSON output always like this:
                        "परिवार_रजिस्टर": {
                            "ग्राम_सभा_का_नाम": "",
                            "ग्राम_वार्ड_पंचायत_का_नाम": "",
                            "गांव_का_नाम": "",
                            "तहसील": "",
                            "विकास_खण्ड": "",
                            "जिला": "",
                            "परिवार_सदस्य": [
                              {
                                "क्रम_संख्या": "",
                                "मकान_संख्या": "",
                                "परिवार_के_प्रमुख_का_नाम": "",
                                "परिवार_के_सदस्यों_के_नाम": "",
                                "पिता_पति_का_नाम": "",
                                "पुरुष_या_महिला": "",
                                "धर्म":"",
                                "जन्म_तिथि": "",
                                "पता": "",
                                "साक्षर_या_निरक्षर": "",
                                "मृत्यु दिनांक":"",
                                "अभ्युक्ति":""
                              }
                            ]
                          }'''
                    }
                ]
            }
        ]
    )

    return response.content[0].text

def preprocess_json_string(json_string):
    json_string = json_string.strip()
    match = re.search(r'({.*})', json_string, re.DOTALL)
    if match:
        json_string = match.group(1)
    return json_string

def parse_json_safely(json_string):
    try:
        cleaned_json = preprocess_json_string(json_string)
        parsed_data = json.loads(cleaned_json)
        return parsed_data
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None



if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extractor.py <image_path> <API G|API C>")
        sys.exit(1)

    image_path = sys.argv[1]
    api_choice = sys.argv[2].lower()

    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")

        if api_choice == 'api g':
            result = extract_text_from_image_gemini(image_path)
        elif api_choice == 'api c':
            result = extract_text_from_image_claude(image_path)
        else:
            raise ValueError("Invalid API choice")

        parsed_result = parse_json_safely(result)
        if parsed_result is None:
            raise ValueError("Failed to parse the API response as JSON.")

        # Generate a unique filename for the JSON output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"extracted_{timestamp}.json"
        output_path = os.path.join(os.path.dirname(__file__), "output","json", output_filename)

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save the result as a JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(parsed_result, f, ensure_ascii=False, indent=2)

        # Print the path to the JSON file
        print(output_path)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    # print(f"Extraction completed. Output saved in {json_file}.")
# import sys
# import json
# from anthropic import Anthropic
# import base64
# import io
# import pandas as pd
# from openpyxl import Workbook
# from openpyxl.styles import Font, Alignment

# def encode_image(image_path):
#     with open(image_path, "rb") as image_file:
#         return base64.b64encode(image_file.read()).decode('utf-8')

# def extract_text_from_image(image_path):
#     anthropic = Anthropic(api_key='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')

#     base64_image = encode_image(image_path)

#     response = anthropic.messages.create(
#         model="claude-3-5-sonnet-20240620",
#         max_tokens=5000,
#         messages=[
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "image",
#                         "source": {
#                             "type": "base64",
#                             "media_type": "image/jpeg",
#                             "data": base64_image
#                         }
#                     },
#                     {
#                         "type": "text",
#                         "text": '''Extract all the text from all rows from this bill image, 
#                         including both printed and handwritten text and return data as a JSON object only(no other text) with 
#                         appropriate keys and values to be easily shown on html table in same language as in image.give one standard output always like this 
#                         "परिवार_रजिस्टर": {
#     "ग्राम_सभा_का_नाम": "",
#     "ग्राम_वार्ड_पंचायत_का_नाम": "",
#     "गांव_का_नाम": "",
#     "तहसील": "",
#     "विकास_खण्ड": "",
#     "जिला": "",
#     "परिवार_सदस्य": [
#       {
#         "क्रम_संख्या": "",
#         "मकान_संख्या": "",
#         "परिवार_के_प्रमुख_का_नाम": "",
#         "परिवार_के_सदस्यों_के_नाम": "",
#         "पिता_पति_का_नाम": "",
#         "पुरुष_या_महिला": "",
#         "जन्म_तिथि": "",
#         "पता": "",
#         "साक्षर_या_निरक्षर": "",
#         "मृत्यु दिनांक":"",
#         "अभ्युक्ति":""
#       },}'''
#                     }
#                 ]
#             }
#         ]
#     )
#     extracted_text = response.content[0].text
#     with open('extracted_text.txt', 'w', encoding='utf-8') as f:
#         f.write(extracted_text)
#     return response.content[0].text
# def save_to_excel(data, output_file):
#     # Parse the JSON data
#     parsed_data = json.loads(data)
#     परिवार_रजिस्टर = parsed_data["परिवार_रजिस्टर"]

#     # Create a pandas DataFrame
#     df = pd.DataFrame(परिवार_रजिस्टर["परिवार_सदस्य"])

#     # Create a new workbook and select the active sheet
#     wb = Workbook()
#     ws = wb.active

#     # Add header information
#     header_info = {k: v for k, v in परिवार_रजिस्टर.items() if k != "परिवार_सदस्य"}
#     for i, (key, value) in enumerate(header_info.items(), start=1):
#         ws.cell(row=i, column=1, value=key)
#         ws.cell(row=i, column=2, value=value)

#     # Add an empty row
#     start_row = len(header_info) + 2

#     # Add column headers
#     for col, header in enumerate(df.columns, start=1):
#         cell = ws.cell(row=start_row, column=col, value=header)
#         cell.font = Font(bold=True)
#         cell.alignment = Alignment(horizontal='center')

#     # Add data
#     for r, row in enumerate(df.values, start=start_row+1):
#         for c, value in enumerate(row, start=1):
#             ws.cell(row=r, column=c, value=value)

#     # Save the workbook
#     wb.save(output_file)

# if __name__ == "__main__":
#     image_path = sys.argv[1]
#     result = extract_text_from_image(image_path)
#     # Use io.StringIO to handle Unicode encoding
#     with io.StringIO() as buffer:
#         json.dump({"result": result}, buffer, ensure_ascii=False)
#         output = buffer.getvalue()
#     excel_output = "output.xlsx"
#     save_to_excel(result, excel_output)
#     # Print the JSON-encoded string
#     sys.stdout.buffer.write(output.encode('utf-8'))
