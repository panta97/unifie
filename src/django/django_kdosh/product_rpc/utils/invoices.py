def get_series_list(store, year):
    series = []
    year = int(year)
    if year <= 2024:
        if store == "abtao":
            series = [
                "B001",
                "B003",
                "B004",
                "B005",
                "B006",
                "B007",
                "B008",
                "B013",
                "F001",
                "F003",
                "F004",
                "F005",
                "F006",
                "F007",
                "F008",
                "F013",
            ]
        elif store == "san_martin":
            series = ["B002", "F002"]
        elif store == "tingo":
            series = ["B009", "B010", "B011", "B012", "F009", "F010", "F011", "F012"]
    else:
        if store == "abtao":
            series = [
                "B001",
                "B002",
                "B003",
                "B004",
                "B005",
                "B006",
                "B007",
                "B008",
                "B009",
                "F001",
                "F002",
                "F003",
                "F004",
                "F005",
                "F006",
                "F007",
                "F008",
                "F009",
            ]
        elif store == "san_martin":
            series = ["B010", "F010"]
        elif store == "tingo":
            series = ["B011", "B012", "B013", "F011", "F012", "F013"]

    return series
