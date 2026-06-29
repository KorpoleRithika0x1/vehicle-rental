FROM python:3.11

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install -r requirements.txt

COPY backend .

EXPOSE 5000
CMD ["python","-m","app.main"]