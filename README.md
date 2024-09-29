# Bill Extractor Main

**Bill Extractor Main** is a powerful desktop application designed to extract text from images of bills, including both printed and handwritten text. The application leverages advanced AI models to process images and convert the extracted text into structured JSON and Excel formats. Built using Electron, this project runs seamlessly across Windows, macOS, and Linux platforms.

## Features

- **User Authentication**: Secure login system to manage user sessions.
- **Image Selection**: Allows selection of single or multiple images for processing.
- **API Integration**: Supports text extraction using Gemini and Claude APIs.
- **Progress Tracking**: Displays extraction progress and notifies upon completion.
- **Daily Limits**: Monitors the number of images processed per user per day.

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/bill_extractor_main.git
   cd bill_extractor_main
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Project Structure

- **main.js**: Main entry point for the Electron application.
- **renderer.js**: Handles the front-end logic and user interactions.
- **extractor.py**: Python script for extracting text from images using AI models.
- **save_to_excel.py**: Python script to convert JSON data to Excel format.
- **userStats.json**: Stores user statistics for tracking image processing limits.

## About the Developer

I am *Adnan Ahtas*, a software developer passionate about creating innovative solutions using modern technologies. My expertise lies in building applications that leverage AI and machine learning to solve real-world problems. This project is a testament to my commitment to developing tools that enhance productivity and efficiency.

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss potential improvements or features.

## Contact

For any inquiries or support, please contact me at [adnanahtas@gmail.com](mailto:adnanahtas@gmail.com).

---

**Note**: Ensure you have Python installed on your system as the project involves running Python scripts for text extraction and data conversion.
