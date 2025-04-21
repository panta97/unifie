from django.db import models


class PosExternalLog(models.Model):
    _name = "pos.external.log"
    _description = "Registro de Integración POS"
    order_data = models.TextField("Datos de Orden")
    user_name = models.TextField(null=True, blank=True)
    config_name = models.TextField(null=True, blank=True)
    status = models.CharField(
        "Estado", max_length=20, choices=[("success", "Éxito"), ("error", "Error")]
    )
    response = models.TextField("Respuesta API", null=True, blank=True)
    error_message = models.TextField("Mensaje de Error", null=True, blank=True)
    timestamp = models.DateTimeField("Fecha", auto_now_add=True)

    class Meta:
        verbose_name = "Registro de Integración POS"
        verbose_name_plural = "Registros de Integración POS"

    def __str__(self):
        return f"{self.timestamp} - {self.status}"
