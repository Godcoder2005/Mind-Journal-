import requests

BASE = "http://localhost:8000"

# use a new email since old one has incompatible password hash
signup = requests.post(f"{BASE}/auth/signup", json={
    "email":    "akshith@gmail.com",
    "username": "akshith",
    "password": "test123"
})
print("Signup:", signup.json())

token = signup.json().get("token")
if not token:
    print("Signup failed — trying login")
    login = requests.post(f"{BASE}/auth/login", json={
        "email":    "akshith@gmail.com",
        "password": "test123"
    })
    print("Login:", login.json())
    token = login.json().get("token")

print("Token:", token[:30], "...")
headers = {"Authorization": f"Bearer {token}"}

# test full pipeline
response = requests.post(f"{BASE}/agent/chat",
    headers = headers,
    json    = {"query": "I am feeling very stressed about my internship search"}
)
print("Status:", response.status_code)
print("Agent response:", response.json())