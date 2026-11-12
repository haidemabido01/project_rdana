import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DB = Path(tempfile.gettempdir()) / "rdana_backend_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["RDANA_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["RDANA_JWT_SECRET"] = "test-secret-that-is-not-used-in-production"
os.environ["RDANA_DEMO_MODE"] = "true"

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()


@pytest.fixture(scope="session")
def super_admin_token(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "crissalen.danao", "password": "superadmin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
