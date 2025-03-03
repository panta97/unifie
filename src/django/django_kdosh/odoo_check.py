import xmlrpc.client

ODOO_URL = "https://marvinh10-kdosh-bd.odoo.com/"
ODOO_DB = "marvinh10-kdosh-bd-17-0-0-17332055"
ODOO_PWD = "4e94bb1f5aa83b518b04c1a45f7a894585ad474b"
ODOO_USER = "marvinhectorcamposdeza@gmail.com"

# Conexión al servidor Odoo
try:
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PWD, {})

    if uid:
        print("✅ Conexión exitosa. UID:", uid)
    else:
        print("❌ Error: No se pudo autenticar en Odoo. Verifica usuario y contraseña.")

except Exception as e:
    print(f"❌ Error de conexión a Odoo: {e}")
