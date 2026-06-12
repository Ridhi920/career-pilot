"""Add job_listings table

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:01.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_listings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("is_easy_apply", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.Column("match_data", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column("tailored_resume", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="Discovered", nullable=False),
        sa.Column("resume_id", sa.Integer(), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_listings_id"), "job_listings", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_job_listings_id"), table_name="job_listings")
    op.drop_table("job_listings")
