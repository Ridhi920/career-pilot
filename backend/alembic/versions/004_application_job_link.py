"""Link applications to discovered job listings

Revision ID: 004
Revises: 003
Create Date: 2026-06-12 00:00:01.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("job_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_applications_job_id",
        "applications",
        "job_listings",
        ["job_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_applications_job_id", "applications", type_="foreignkey")
    op.drop_column("applications", "job_id")
