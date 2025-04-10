from enum import Enum

class ApplicationStatus(Enum):
    """
    Enum representing the status of an application.
    """
    WISHLIST = "wishlist"
    APPLIED = "applied"
    INTERVIEWED = "interviewed"
    OFFER = "offer"
    DECLINED = "declined"