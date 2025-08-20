TasaPeru - Full App (frontend + backend)
=======================================

Frontend: /frontend/index.html
Backend: /backend/server.js  (Node.js + Express scraper)

Instructions:
1. Backend:
   - cd backend
   - npm install
   - npm start
   - API endpoint will be: http://localhost:3000/api/retasas

2. Frontend:
   - Open frontend/index.html in a browser (or serve with any static host).
   - To connect to live backend, edit frontend/index.html fetch URL '/api/retasas' to your backend public URL.

Notes:
- The backend scrapes the SBS website. Respect their terms and avoid excessive requests.
- Configure BANKS env var if you want to filter different banks: e.g. BANKS='BCP,BBVA,Interbank'
