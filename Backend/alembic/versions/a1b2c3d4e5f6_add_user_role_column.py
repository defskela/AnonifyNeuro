"""add user role column

Revision ID: a1b2c3d4e5f6
Revises: 5c217f75a5f4
Create Date: 2026-03-08 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "5c217f75a5f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        role_type = sa.Enum("user", "admin", name="user_role", create_type=False)
        role_type.create(bind, checkfirst=True)
    else:
        role_type = sa.Enum("user", "admin", name="user_role")
        role_type.create(bind, checkfirst=True)

    op.add_column("users", sa.Column("role", role_type, nullable=True))
    op.execute("UPDATE users SET role = 'user' WHERE role IS NULL")
    op.alter_column("users", "role", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "role")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS user_role")
    else:
        sa.Enum("user", "admin", name="user_role").drop(bind, checkfirst=True)
