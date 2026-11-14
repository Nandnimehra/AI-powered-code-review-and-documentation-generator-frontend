# 🖥️ AI Code Review & Documentation Generator: Frontend

The React frontend for the **AI-Powered Code Review and Documentation Generator**. It provides a simple interface to submit code, view AI-generated reviews, generate docstrings and README content, and ask follow-up questions about your code.

🔗 **Backend repository:** [AI-powered-code-review-and-documentation-generator](https://github.com/Nandnimehra/AI-powered-code-review-and-documentation-generator)

![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 📥 **Code input**: paste code or upload a file
- 🔍 **Code review**: view detected bugs, security issues, and code smells
- 📝 **Docstring generation**: get docstrings for functions, classes, and modules
- 📄 **README generation**: generate project documentation from your code
- 💬 **Follow-up Q&A**: ask questions about your code and get contextual answers
- 🔌 **API integration**: communicates with the Django REST Framework backend

## 🛠️ Tech Stack

| Category        | Technology                                  |
|-----------------|---------------------------------------------|
| Framework       | React                                       |
| Language        | JavaScript [or TypeScript]                  |
| HTTP Client     | [Axios / Fetch API]                         |
| Styling         | [CSS / Tailwind CSS / Material UI]          |
| Backend         | Django REST Framework (separate repo)       |

## 📁 Project Structure

```
.
├── public/            # Static files
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page-level components  [if used]
│   ├── services/      # API calls to the backend  [if used]
│   ├── App.js         # Root component
│   └── index.js       # Entry point
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- The [backend](https://github.com/Nandnimehra/AI-powered-code-review-and-documentation-generator) running at `http://localhost:8000/`

### Installation

```bash
# Clone the repository
git clone https://github.com/Nandnimehra/AI-powered-code-review-and-documentation-generator-frontend.git
cd AI-powered-code-review-and-documentation-generator-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The app runs at `http://localhost:3000/`.

> If you use Vite, run `npm run dev` instead (usually `http://localhost:5173/`).

### Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=http://localhost:8000
```

> For Vite, use `VITE_API_URL` instead. Do not commit your `.env` file.

### Backend Setup

The frontend needs the Django backend to work. Follow the setup steps in the [backend README](https://github.com/Nandnimehra/AI-powered-code-review-and-documentation-generator), then start the server:

```bash
python manage.py runserver
```

Make sure CORS is enabled in the Django settings (for example with `django-cors-headers`) so the frontend at `localhost:3000` can call the API.

## 📡 API Endpoints Used

| Method | Endpoint             | Purpose                           |
|--------|----------------------|-----------------------------------|
| POST   | `/api/review/`       | Submit code for review            |
| POST   | `/api/docstrings/`   | Generate docstrings               |
| POST   | `/api/readme/`       | Generate README content           |
| POST   | `/api/ask/`          | Ask a follow-up question          |

## 🧭 Usage

1. Open the app in your browser.
2. Paste your code or upload a file.
3. Choose **Review**, **Generate Docstrings**, or **Generate README**.
4. Read the results on screen.
5. Use the Q&A box to ask follow-up questions about your code.

## 📸 Screenshots

> Add screenshots here, for example:
> `![Home](screenshots/home.png)`
> `![Review Results](screenshots/review.png)`

## 📜 Available Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm start`       | Runs the app in development mode     |
| `npm run build`   | Builds the app for production        |
| `npm test`        | Runs tests                           |

## 🗺️ Future Improvements

- Syntax-highlighted code editor
- Dark mode
- Review history and saved sessions
- Export results as PDF or Markdown
- Support for multiple files and whole projects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👩‍💻 Author

**Nandni Mehra**
GitHub: [@Nandnimehra](https://github.com/Nandnimehra)
