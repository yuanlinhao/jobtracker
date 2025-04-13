from fastapi import HTTPException, status

def not_found(resource: str = "Resource"):
    raise HTTPException(status_code=404, detail=f"{resource} not found")

def unauthorized(action: str = "Resource"):
    raise HTTPException(status_code=401, detail=f"Not authorized to {action}")

def bad_request(message: str = "Invalid request"):
    raise HTTPException(status_code=400, detail=message)