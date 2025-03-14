REPORT_FIELDTYPE_DATE = "date"
REPORT_FIELDTYPE_TEXT = "text"
REPORT_FIELDTYPE_NUMBER = "number"

REPORT_DATATYPE_CHOICES = [
    (REPORT_FIELDTYPE_DATE, REPORT_FIELDTYPE_DATE),
    (REPORT_FIELDTYPE_TEXT, REPORT_FIELDTYPE_TEXT),
    (REPORT_FIELDTYPE_NUMBER, REPORT_FIELDTYPE_NUMBER),
]


DB_ODOO_V11 = "odoo_v11"
DB_ODOO_V15 = "odoo_v15"
DB_ODOO_V17 = "odoo_v17"

DATABASE_TARGET_CHOICES = [(DB_ODOO_V11, DB_ODOO_V11), (DB_ODOO_V15, DB_ODOO_V15), (DB_ODOO_V17, DB_ODOO_V17)]
