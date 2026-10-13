-- Jejak audit tidak dapat diubah: tolak UPDATE, DELETE, dan TRUNCATE.
CREATE OR REPLACE FUNCTION audit_log_reject_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog bersifat append-only; % tidak diizinkan', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_reject_change();

CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_reject_change();
