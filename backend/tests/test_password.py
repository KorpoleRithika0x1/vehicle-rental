from app.utils.password import hash_password, verify_password


def test_password_hash_roundtrip():
    password = "SecurePass1"
    password_hash = hash_password(password)
    assert password_hash != password
    assert verify_password(password, password_hash) is True
