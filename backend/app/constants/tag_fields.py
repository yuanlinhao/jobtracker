from enum import Enum

class TaggableField(str, Enum):
    """
    Enum for taggable fields.
    """
    COMPANY = "company"
    LOCATION = "location"
    POSITION = "position"
    STATUS = "status"