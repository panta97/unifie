import xmlrpc.client
from django.conf import settings


class OdooService:
    def __init__(self):
        self.url = settings.ODOO_URL
        self.db = settings.ODOO_DB
        self.password = settings.ODOO_PWD
        self.uid = int(settings.ODOO_UID)

        self.models = xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/object")

    def get_price_lists(self):
        try:
            price_lists = self.models.execute_kw(
                self.db,
                self.uid,
                self.password,
                "product.pricelist",
                "search_read",
                [[]],
                {"fields": ["id", "name", "currency_id"]},
            )

            formatted_lists = []
            for pl in price_lists:
                formatted_lists.append(
                    {
                        "id": pl["id"],
                        "name": pl["name"],
                        "currency": (
                            pl["currency_id"][1] if pl.get("currency_id") else "USD"
                        ),
                    }
                )

            return formatted_lists
        except Exception as e:
            print(f"Error getting price lists: {str(e)}")
            raise

    def get_categories(self):
        try:
            categories = self.models.execute_kw(
                self.db,
                self.uid,
                self.password,
                "product.category",
                "search_read",
                [[]],
                {
                    "fields": ["id", "name", "complete_name"],
                    "order": "complete_name ASC",
                },
            )

            formatted_categories = []
            for cat in categories:
                formatted_categories.append(
                    {
                        "id": cat["id"],
                        "name": cat.get("complete_name", cat["name"]),
                    }
                )

            return formatted_categories
        except Exception as e:
            print(f"Error getting categories: {str(e)}")
            raise

    def search_products_by_reference(self, reference):
        try:
            domain = [
                "|",
                ("default_code", "ilike", reference),
                ("name", "ilike", reference),
                ("sale_ok", "=", True),
            ]

            products = self.models.execute_kw(
                self.db,
                self.uid,
                self.password,
                "product.product",
                "search_read",
                [domain],
                {
                    "fields": [
                        "id",
                        "default_code",
                        "name",
                        "list_price",
                        "categ_id",
                        "product_tmpl_id",
                        "product_template_attribute_value_ids",
                    ],
                    "order": "default_code ASC",
                },
            )

            filtered_products = []
            reference_lower = reference.lower().strip()

            for prod in products:
                name = (prod.get("name", "") or "").strip().lower()

                if name.endswith(reference_lower):
                    if len(name) == len(reference_lower):
                        filtered_products.append(prod)
                    else:
                        char_before = name[len(name) - len(reference_lower) - 1]
                        if char_before in [" ", "-", "/", ",", "_"]:
                            filtered_products.append(prod)

            products = filtered_products

            all_attr_ids = []
            for prod in products:
                if prod.get("product_template_attribute_value_ids"):
                    all_attr_ids.extend(prod["product_template_attribute_value_ids"])

            all_attr_ids = list(set(all_attr_ids))

            attr_values_dict = {}
            if all_attr_ids:
                try:
                    attr_values = self.models.execute_kw(
                        self.db,
                        self.uid,
                        self.password,
                        "product.template.attribute.value",
                        "read",
                        [all_attr_ids],
                        {"fields": ["id", "name"]},
                    )
                    attr_values_dict = {av["id"]: av["name"] for av in attr_values}
                except Exception as e:
                    print(f"Error loading attributes: {str(e)}")

            formatted_products = []
            for prod in products:
                attributes_str = ""
                if prod.get("product_template_attribute_value_ids"):
                    attr_names = [
                        attr_values_dict.get(attr_id, "")
                        for attr_id in prod["product_template_attribute_value_ids"]
                        if attr_id in attr_values_dict
                    ]
                    attributes_str = ", ".join(filter(None, attr_names))

                formatted_products.append(
                    {
                        "id": prod["id"],
                        "product_tmpl_id": (
                            prod["product_tmpl_id"][0]
                            if prod.get("product_tmpl_id")
                            else None
                        ),
                        "reference": prod.get("default_code", "N/A"),
                        "description": prod["name"],
                        "currentPrice": prod.get("list_price", 0.0),
                        "discount": 0,
                        "category": (
                            prod["categ_id"][1]
                            if prod.get("categ_id")
                            else "Sin categoría"
                        ),
                        "category_id": (
                            prod["categ_id"][0] if prod.get("categ_id") else None
                        ),
                        "attributes": attributes_str,
                    }
                )

            return formatted_products

        except Exception as e:
            print(f"Error searching products: {str(e)}")
            raise

    def search_products_by_category(self, category_id):
        try:
            domain = [
                ("categ_id", "=", int(category_id)),
                ("sale_ok", "=", True),
            ]

            products = self.models.execute_kw(
                self.db,
                self.uid,
                self.password,
                "product.product",
                "search_read",
                [domain],
                {
                    "fields": [
                        "id",
                        "default_code",
                        "name",
                        "list_price",
                        "categ_id",
                        "product_tmpl_id",
                        "product_template_attribute_value_ids",
                    ],
                    "order": "name ASC",
                },
            )

            all_attr_ids = []
            for prod in products:
                if prod.get("product_template_attribute_value_ids"):
                    all_attr_ids.extend(prod["product_template_attribute_value_ids"])

            all_attr_ids = list(set(all_attr_ids))

            attr_values_dict = {}
            if all_attr_ids:
                try:
                    attr_values = self.models.execute_kw(
                        self.db,
                        self.uid,
                        self.password,
                        "product.template.attribute.value",
                        "read",
                        [all_attr_ids],
                        {"fields": ["id", "name"]},
                    )
                    attr_values_dict = {av["id"]: av["name"] for av in attr_values}
                except Exception as e:
                    print(f"Error loading attributes: {str(e)}")

            formatted_products = []
            for prod in products:
                attributes_str = ""
                if prod.get("product_template_attribute_value_ids"):
                    attr_names = [
                        attr_values_dict.get(attr_id, "")
                        for attr_id in prod["product_template_attribute_value_ids"]
                        if attr_id in attr_values_dict
                    ]
                    attributes_str = ", ".join(filter(None, attr_names))

                formatted_products.append(
                    {
                        "id": prod["id"],
                        "product_tmpl_id": (
                            prod["product_tmpl_id"][0]
                            if prod.get("product_tmpl_id")
                            else None
                        ),
                        "reference": prod.get("default_code", "N/A"),
                        "description": prod["name"],
                        "currentPrice": prod.get("list_price", 0.0),
                        "discount": 0,
                        "category": (
                            prod["categ_id"][1]
                            if prod.get("categ_id")
                            else "Sin categoría"
                        ),
                        "category_id": (
                            prod["categ_id"][0] if prod.get("categ_id") else None
                        ),
                        "attributes": attributes_str,
                    }
                )

            print(
                f"✓ Encontrados {len(formatted_products)} productos en categoría {category_id}"
            )
            return formatted_products

        except Exception as e:
            print(f"Error searching products by category: {str(e)}")
            raise

    def update_pricelist_items(self, pricelist_id, products_data, apply_mode="product"):
        try:
            updated_count = 0
            created_count = 0
            skipped_count = 0

            batch_size = 10
            total_batches = (len(products_data) + batch_size - 1) // batch_size

            print(f"\n🔄 Iniciando actualización en modo: {apply_mode}")
            print(f"📦 Total de items a procesar: {len(products_data)}")
            print(f"📊 Lotes a procesar: {total_batches}\n")

            for i in range(0, len(products_data), batch_size):
                batch = products_data[i : i + batch_size]
                batch_num = i // batch_size + 1

                print(f"📦 Procesando lote {batch_num}/{total_batches}...")

                for product in batch:
                    discount_percent = product.get("discount", 0)

                    if discount_percent <= 0:
                        skipped_count += 1
                        continue

                    # ============================================
                    # MODO CATEGORÍA - applied_on='2_product_category'
                    # ============================================
                    if apply_mode == "category":
                        category_id = product.get("category_id")

                        if not category_id:
                            print(
                                f"⚠️  Item {product.get('id')} sin category_id - OMITIDO"
                            )
                            skipped_count += 1
                            continue

                        domain = [
                            ("pricelist_id", "=", pricelist_id),
                            ("categ_id", "=", category_id),
                            ("applied_on", "=", "2_product_category"),
                        ]

                        existing_items = self.models.execute_kw(
                            self.db,
                            self.uid,
                            self.password,
                            "product.pricelist.item",
                            "search",
                            [domain],
                        )

                        item_vals = {
                            "compute_price": "percentage",
                            "percent_price": discount_percent,
                        }

                        try:
                            if existing_items:
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "write",
                                    [existing_items, item_vals],
                                )
                                updated_count += 1
                                print(
                                    f"  ✓ Actualizada categoría {category_id}: {discount_percent}%"
                                )
                            else:
                                item_vals.update(
                                    {
                                        "pricelist_id": pricelist_id,
                                        "categ_id": category_id,
                                        "applied_on": "2_product_category",
                                    }
                                )
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "create",
                                    [item_vals],
                                )
                                created_count += 1
                                print(
                                    f"  ✅ Creada categoría {category_id}: {discount_percent}%"
                                )
                        except Exception as e:
                            print(f"  ❌ Error en categoría {category_id}: {str(e)}")
                            skipped_count += 1
                            continue

                    # ============================================
                    # MODO PRODUCTO - applied_on='1_product'
                    # ============================================
                    elif apply_mode == "product":
                        product_tmpl_id = product.get("product_tmpl_id")

                        if not product_tmpl_id:
                            print(
                                f"⚠️  Item {product.get('id')} sin product_tmpl_id - OMITIDO"
                            )
                            skipped_count += 1
                            continue

                        domain = [
                            ("pricelist_id", "=", pricelist_id),
                            ("product_tmpl_id", "=", product_tmpl_id),
                            ("applied_on", "=", "1_product"),
                        ]

                        existing_items = self.models.execute_kw(
                            self.db,
                            self.uid,
                            self.password,
                            "product.pricelist.item",
                            "search",
                            [domain],
                        )

                        item_vals = {
                            "compute_price": "percentage",
                            "percent_price": discount_percent,
                        }

                        try:
                            if existing_items:
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "write",
                                    [existing_items, item_vals],
                                )
                                updated_count += 1
                                print(
                                    f"  ✓ Actualizado producto {product_tmpl_id}: {discount_percent}%"
                                )
                            else:
                                item_vals.update(
                                    {
                                        "pricelist_id": pricelist_id,
                                        "product_tmpl_id": product_tmpl_id,
                                        "applied_on": "1_product",
                                    }
                                )
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "create",
                                    [item_vals],
                                )
                                created_count += 1
                                print(
                                    f"  ✅ Creado producto {product_tmpl_id}: {discount_percent}%"
                                )
                        except Exception as e:
                            print(f"  ❌ Error en producto {product_tmpl_id}: {str(e)}")
                            skipped_count += 1
                            continue

                    # ============================================
                    # MODO VARIANTE - applied_on='0_product_variant'
                    # ============================================
                    else:  # variant
                        product_id = product.get("id")

                        if not product_id:
                            skipped_count += 1
                            continue

                        domain = [
                            ("pricelist_id", "=", pricelist_id),
                            ("product_id", "=", product_id),
                            ("applied_on", "=", "0_product_variant"),
                        ]

                        existing_items = self.models.execute_kw(
                            self.db,
                            self.uid,
                            self.password,
                            "product.pricelist.item",
                            "search",
                            [domain],
                        )

                        item_vals = {
                            "compute_price": "percentage",
                            "percent_price": discount_percent,
                        }

                        try:
                            if existing_items:
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "write",
                                    [existing_items, item_vals],
                                )
                                updated_count += 1
                                print(
                                    f"  ✓ Actualizada variante {product_id}: {discount_percent}%"
                                )
                            else:
                                item_vals.update(
                                    {
                                        "pricelist_id": pricelist_id,
                                        "product_id": product_id,
                                        "applied_on": "0_product_variant",
                                    }
                                )
                                self.models.execute_kw(
                                    self.db,
                                    self.uid,
                                    self.password,
                                    "product.pricelist.item",
                                    "create",
                                    [item_vals],
                                )
                                created_count += 1
                                print(
                                    f"  ✅ Creada variante {product_id}: {discount_percent}%"
                                )
                        except Exception as e:
                            print(f"  ❌ Error en variante {product_id}: {str(e)}")
                            skipped_count += 1
                            continue

            print(f"\n✅ Proceso completado:")
            print(f"   • Creados: {created_count}")
            print(f"   • Actualizados: {updated_count}")
            print(f"   • Omitidos: {skipped_count}")
            print(f"   • Total: {created_count + updated_count}\n")

            return {"created": created_count, "updated": updated_count}

        except Exception as e:
            print(f"❌ Error en update_pricelist_items: {str(e)}")
            raise
