from fastapi import Query
from typing import Dict

def get_pagination_params(
    limit: int = Query(50, gt=0, le=100),
    offset: int = Query(0, ge=0)
) -> Dict[str, int]:
    return {"limit": limit, "offset": offset}