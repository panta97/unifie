from django.db import models
from .constants import EQ_CHOICES


# Create your models here.
class StoreSection(models.Model):
    id = models.AutoField(primary_key=True)
    supervisor = models.CharField(max_length=50)
    section_name = models.CharField(choices=EQ_CHOICES, max_length=50)

    def __str__(self):
        return f"{self.section_name} - {self.supervisor}"


class StoreSectionGoal(models.Model):
    id = models.AutoField(primary_key=True)
    year = models.IntegerField()
    month = models.IntegerField()
    goal = models.DecimalField(max_digits=12, decimal_places=2)
    section = models.ForeignKey(
        StoreSection, on_delete=models.CASCADE, related_name="store_sections"
    )

    class Meta:
        unique_together = ("year", "month", "section")
