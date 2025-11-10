"""create chats and messages tables

Revision ID: 5c217f75a5f4
Revises: 2d0e0299c7ce
Create Date: 2025-11-10 11:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5c217f75a5f4'
down_revision: Union[str, None] = '2d0e0299c7ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sender_type = postgresql.ENUM(
            'user', 'assistant', name='messagesender', create_type=False
        )
        op.execute(text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'messagesender'
                ) THEN
                    CREATE TYPE messagesender AS ENUM ('user', 'assistant');
                END IF;
            END$$;
            """
        ))
    else:
        sender_type = sa.Enum('user', 'assistant', name='messagesender')
        sender_type.create(bind, checkfirst=True)

    op.create_table(
        'chats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chats_id'), 'chats', ['id'], unique=False)
    op.create_index(op.f('ix_chats_user_id'), 'chats',
                    ['user_id'], unique=False)

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chat_id', sa.Integer(), nullable=False),
        sa.Column('sender', sender_type, nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.create_index(op.f('ix_messages_chat_id'),
                    'messages', ['chat_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_chat_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')

    op.drop_index(op.f('ix_chats_user_id'), table_name='chats')
    op.drop_index(op.f('ix_chats_id'), table_name='chats')
    op.drop_table('chats')

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(text("DROP TYPE IF EXISTS messagesender"))
    else:
        sa.Enum('user', 'assistant', name='messagesender').drop(
            bind, checkfirst=True
        )
