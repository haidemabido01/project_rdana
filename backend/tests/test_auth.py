import pytest

from app.seed import DEMO_ACCOUNTS


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "crissalen.danao", "password": "superadmin123"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["username"] == "crissalen.danao"
    assert body["user"]["roleId"] == "super_admin"
    assert body["user"]["agencyCode"] == "MDRRMO"


def test_login_is_case_insensitive_for_username(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "CRISSALEN.DANAO", "password": "superadmin123"}
    )
    assert response.status_code == 200


def test_login_rejects_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "crissalen.danao", "password": "wrong-password"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_login_rejects_unknown_username(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "not.an.account", "password": "anything"}
    )
    assert response.status_code == 401


def test_me_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, super_admin_token):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Crissalen Danao"


def test_me_rejects_invalid_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_agency_login_returns_scoped_profile(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "elena.ramos", "password": "deped123"}
    )
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["roleId"] == "agency_deped"
    assert user["level"] == "agency"
    assert user["agencyId"] == "deped"


@pytest.mark.parametrize(
    "account",
    DEMO_ACCOUNTS,
    ids=[account["username"] for account in DEMO_ACCOUNTS]
)
def test_every_seeded_account_can_login(client, account):
    response = client.post(
        "/api/auth/login",
        json={"username": account["username"], "password": account["password"]}
    )
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["roleId"] == account["role_id"]
    assert user["agencyId"] == account["agency_id"]


def test_demo_accounts_endpoint(client):
    response = client.get("/api/auth/demo-accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 9
    assert any(account["username"] == "crissalen.danao" for account in accounts)


def test_logout(client, super_admin_token):
    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 200
    assert "Crissalen Danao" in response.json()["message"]
