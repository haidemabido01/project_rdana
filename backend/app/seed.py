from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import User
from .security import hash_password

DEMO_ACCOUNTS = [
    {
        "username": "crissalen.danao",
        "password": "superadmin123",
        "email": "crissalen.danao@tagbina.gov.ph",
        "name": "Crissalen Danao",
        "role_id": "super_admin",
        "role_label": "Super Admin - MDRRMO RDANA Lead",
        "level": "super_admin",
        "agency_id": "mdrrmo",
        "agency_code": "MDRRMO",
        "agency_name": "MDRRMO Central Disaster Operations",
        "initials": "CD",
        "tone": "brand"
    },
    {
        "username": "roberto.dizon",
        "password": "admin123",
        "email": "roberto.dizon@tagbina.gov.ph",
        "name": "Engr. Roberto Dizon",
        "role_id": "admin_mdrrmo",
        "role_label": "MDRRMO Admin - Operations Officer",
        "level": "admin_mdrrmo",
        "agency_id": "mdrrmo",
        "agency_code": "MDRRMO",
        "agency_name": "MDRRMO Disaster Operations Office",
        "initials": "RD",
        "tone": "brand"
    },
    {
        "username": "elena.ramos",
        "password": "deped123",
        "email": "elena.ramos@deped.gov.ph",
        "name": "Dr. Elena Ramos",
        "role_id": "agency_deped",
        "role_label": "Division Representative - Education Lead",
        "level": "agency",
        "agency_id": "deped",
        "agency_code": "DEPED",
        "agency_name": "Department of Education Division Office",
        "initials": "ER",
        "tone": "violet"
    },
    {
        "username": "grace.lim",
        "password": "mho123",
        "email": "grace.lim@tagbina.gov.ph",
        "name": "Dr. Grace Lim",
        "role_id": "agency_mho",
        "role_label": "Municipal Health Officer - Health Lead",
        "level": "agency",
        "agency_id": "mho",
        "agency_code": "MHO",
        "agency_name": "Municipal Health Office",
        "initials": "GL",
        "tone": "blue"
    },
    {
        "username": "ramon.valderama",
        "password": "omag123",
        "email": "ramon.valderama@tagbina.gov.ph",
        "name": "Ramon Valderama",
        "role_id": "agency_omag",
        "role_label": "Municipal Agriculturist - Agri Lead",
        "level": "agency",
        "agency_id": "omag",
        "agency_code": "OMAG",
        "agency_name": "Office of the Municipal Agriculturist",
        "initials": "RV",
        "tone": "green"
    },
    {
        "username": "teresa.villanueva",
        "password": "mswdo123",
        "email": "teresa.villanueva@tagbina.gov.ph",
        "name": "Teresa Villanueva",
        "role_id": "agency_mswdo",
        "role_label": "Social Welfare Officer - Relief Lead",
        "level": "agency",
        "agency_id": "mswdo",
        "agency_code": "MSWDO",
        "agency_name": "Municipal Social Welfare & Development Office",
        "initials": "TV",
        "tone": "red"
    },
    {
        "username": "carlos.mendoza",
        "password": "masso123",
        "email": "carlos.mendoza@tagbina.gov.ph",
        "name": "Carlos Mendoza",
        "role_id": "agency_masso",
        "role_label": "Municipal Assessor - Real Property Lead",
        "level": "agency",
        "agency_id": "masso",
        "agency_code": "MASSO",
        "agency_name": "Municipal Assessor's Office",
        "initials": "CM",
        "tone": "green"
    },
    {
        "username": "arthur.salazar",
        "password": "meo123",
        "email": "arthur.salazar@tagbina.gov.ph",
        "name": "Engr. Arthur Salazar",
        "role_id": "agency_meo",
        "role_label": "Municipal Engineer - Infrastructure Lead",
        "level": "agency",
        "agency_id": "meo",
        "agency_code": "MEO",
        "agency_name": "Municipal Engineering Office",
        "initials": "AS",
        "tone": "yellow"
    },
    {
        "username": "diana.cruz",
        "password": "mpdo123",
        "email": "diana.cruz@tagbina.gov.ph",
        "name": "Arch. Diana Cruz",
        "role_id": "agency_mpdo",
        "role_label": "Planning Coordinator - GIS Lead",
        "level": "agency",
        "agency_id": "mpdo",
        "agency_code": "MPDO",
        "agency_name": "Municipal Planning & Development Office",
        "initials": "DC",
        "tone": "navy"
    }
]

LEGACY_USERNAMES = {
    "maria.santos": "crissalen.danao"
}

SEED_FIELDS = [
    "email",
    "name",
    "role_id",
    "role_label",
    "level",
    "agency_id",
    "agency_code",
    "agency_name",
    "initials",
    "tone"
]


def migrate_legacy_users(db: Session) -> None:
    for old_username, new_username in LEGACY_USERNAMES.items():
        legacy = db.scalar(
            select(User).where(User.username == old_username)
        )
        if legacy is None:
            continue

        current = db.scalar(
            select(User).where(User.username == new_username)
        )
        if current is not None and current.id != legacy.id:
            db.delete(legacy)
        else:
            legacy.username = new_username
            legacy.email = f"{new_username}@tagbina.gov.ph"

    db.flush()


def seed_users(db: Session) -> None:
    migrate_legacy_users(db)

    existing = {
        user.username: user
        for user in db.scalars(select(User)).all()
    }

    for account in DEMO_ACCOUNTS:
        user = existing.get(account["username"])
        if user is None:
            user = User(
                username=account["username"],
                password_hash=hash_password(account["password"]),
                is_active=True
            )
            db.add(user)

        for field in SEED_FIELDS:
            setattr(user, field, account[field])

    db.commit()
