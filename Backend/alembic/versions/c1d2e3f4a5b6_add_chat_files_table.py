"""add chat files table

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a2
Create Date: 2026-03-08 13:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("chat_id", sa.Integer(), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), nullable=False),
        sa.Column("object_key", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["chat_id"], ["chats.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chat_files_id"), "chat_files", ["id"], unique=False)
    op.create_index(op.f("ix_chat_files_chat_id"), "chat_files", ["chat_id"], unique=False)
    op.create_index(op.f("ix_chat_files_uploaded_by"), "chat_files", ["uploaded_by"], unique=False)
    op.create_unique_constraint("uq_chat_files_object_key", "chat_files", ["object_key"])


def downgrade() -> None:
    op.drop_constraint("uq_chat_files_object_key", "chat_files", type_="unique")
    op.drop_index(op.f("ix_chat_files_uploaded_by"), table_name="chat_files")
    op.drop_index(op.f("ix_chat_files_chat_id"), table_name="chat_files")
    op.drop_index(op.f("ix_chat_files_id"), table_name="chat_files")
    op.drop_table("chat_files")
