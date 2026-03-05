-- Migración 008: Cambiar scheduled_at de TIMESTAMPTZ a TIMESTAMP
-- Esto evita conversión de timezone al almacenar horas de citas
-- Las horas se guardan como hora local del negocio

ALTER TABLE appointments 
  ALTER COLUMN scheduled_at TYPE TIMESTAMP WITHOUT TIME ZONE;
